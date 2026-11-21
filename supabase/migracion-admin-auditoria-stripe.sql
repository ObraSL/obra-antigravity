-- Persistencia real en PostgreSQL para auditoría admin, motivos de bloqueo/estado
-- y eventos de cobro de Stripe (paid, failed, canceled, trialing).
--
-- Seguro de ejecutar varias veces en Supabase → SQL Editor → Run.

alter table public.empresas add column if not exists motivo_estado text;
alter table public.empresas add column if not exists stripe_event text;
alter table public.empresas add column if not exists ultima_actividad timestamptz;

create table if not exists public.auditoria_admin (
  id bigint generated always as identity primary key,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  fecha timestamptz not null default now(),
  accion text not null,
  detalle text not null,
  admin text not null default 'Superadmin',
  admin_user_id uuid references auth.users (id)
);

create index if not exists auditoria_admin_empresa_fecha_idx
  on public.auditoria_admin (empresa_id, fecha desc);

alter table public.auditoria_admin enable row level security;

-- Evitar ambigüedad de sobrecargas en PostgREST al ampliar parámetros.
drop function if exists public.establecer_suscripcion(uuid, timestamptz, boolean);
drop function if exists public.establecer_suscripcion(uuid, timestamptz, boolean, text, text, text);

create or replace function public.establecer_suscripcion(
  p_empresa uuid,
  p_activa_hasta timestamptz,
  p_bloqueada boolean,
  p_motivo text default null,
  p_accion text default null,
  p_detalle text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_admin_email text;
  v_empresa_id uuid;
  v_accion text;
  v_detalle text;
begin
  if not public.soy_admin_plataforma() then
    raise exception 'no autorizado';
  end if;

  update public.empresas
  set activa_hasta = p_activa_hasta,
      bloqueada = coalesce(p_bloqueada, false),
      motivo_estado = nullif(trim(p_motivo), '')
  where id = p_empresa
  returning id into v_empresa_id;

  if v_empresa_id is null then
    raise exception 'empresa no encontrada';
  end if;

  select coalesce(email, 'Superadmin')
  into v_admin_email
  from auth.users
  where id = auth.uid();

  v_accion := coalesce(
    nullif(trim(p_accion), ''),
    case
      when coalesce(p_bloqueada, false) then 'Bloqueo manual'
      else 'Actualización de suscripción'
    end
  );

  v_detalle := coalesce(
    nullif(trim(p_detalle), ''),
    case
      when p_motivo is not null and trim(p_motivo) <> '' then trim(p_motivo)
      when p_activa_hasta is null then 'Suscripción sin caducidad'
      else 'Vigencia establecida hasta ' || to_char(p_activa_hasta at time zone 'UTC', 'YYYY-MM-DD')
    end
  );

  insert into public.auditoria_admin (empresa_id, accion, detalle, admin, admin_user_id)
  values (v_empresa_id, v_accion, v_detalle, coalesce(v_admin_email, 'Superadmin'), auth.uid());
end;
$$;

-- Solo la clave service_role (webhook del servidor) puede llamar a esta función.
create or replace function public.registrar_evento_stripe(
  p_subscription text,
  p_event text,
  p_pagado_hasta timestamptz default null,
  p_motivo text default null,
  p_detalle text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_accion text;
begin
  if p_pagado_hasta is not null then
    update public.codigos_alta
    set pagado_hasta = p_pagado_hasta
    where stripe_subscription_id = p_subscription;
  end if;

  select empresa_id
  into v_empresa_id
  from public.codigos_alta
  where stripe_subscription_id = p_subscription
    and empresa_id is not null
  limit 1;

  if v_empresa_id is null then
    return;
  end if;

  update public.empresas
  set stripe_event = p_event,
      motivo_estado = nullif(trim(p_motivo), ''),
      activa_hasta = case
        when activa_hasta is not null and p_pagado_hasta is not null then p_pagado_hasta
        else activa_hasta
      end
  where id = v_empresa_id;

  v_accion := case p_event
    when 'paid' then 'Pago mensual Stripe'
    when 'failed' then 'Fallo de cobro Stripe'
    when 'canceled' then 'Suscripción cancelada en Stripe'
    when 'trialing' then 'Período de prueba Stripe'
    else 'Evento Stripe'
  end;

  insert into public.auditoria_admin (empresa_id, accion, detalle, admin)
  values (
    v_empresa_id,
    v_accion,
    coalesce(nullif(trim(p_detalle), ''), 'Evento Stripe: ' || coalesce(p_event, 'desconocido')),
    'Stripe Webhook'
  );
end;
$$;
revoke execute on function public.registrar_evento_stripe(text, text, timestamptz, text, text) from public, anon, authenticated;

drop function if exists public.listar_empresas_admin();
create or replace function public.listar_empresas_admin()
returns table (
  id uuid,
  nombre text,
  codigo text,
  created_at timestamptz,
  miembros_count bigint,
  obras_count bigint,
  activa_hasta timestamptz,
  bloqueada boolean,
  codigo_alta text,
  motivo_estado text,
  stripe_event text,
  ultima_actividad timestamptz,
  errores_24h_count bigint,
  historial_audit jsonb
)
language sql security definer stable
set search_path = public
as $$
  select
    e.id,
    e.nombre,
    e.codigo,
    e.created_at,
    (select count(*) from public.miembros m where m.empresa_id = e.id and not m.es_soporte) as miembros_count,
    (select count(*) from public.obras o where o.empresa_id = e.id) as obras_count,
    e.activa_hasta,
    e.bloqueada,
    (select c.codigo from public.codigos_alta c where c.empresa_id = e.id limit 1) as codigo_alta,
    e.motivo_estado,
    e.stripe_event,
    coalesce(
      e.ultima_actividad,
      (select max(f.created_at) from public.fichajes f join public.obras o on o.id = f.obra_id where o.empresa_id = e.id),
      e.created_at
    ) as ultima_actividad,
    (select count(*) from public.errores_app err where err.empresa_id = e.id and err.creado_en > now() - interval '24 hours') as errores_24h_count,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'fecha', a.fecha,
            'accion', a.accion,
            'detalle', a.detalle,
            'admin', a.admin
          )
          order by a.fecha desc
        )
        from (
          select fecha, accion, detalle, admin
          from public.auditoria_admin
          where empresa_id = e.id
          order by fecha desc
          limit 50
        ) a
      ),
      '[]'::jsonb
    ) as historial_audit
  from public.empresas e
  where public.soy_admin_plataforma()
  order by e.created_at desc;
$$;
