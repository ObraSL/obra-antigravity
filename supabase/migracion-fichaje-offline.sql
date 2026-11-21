-- Q-01: Conservar la hora real del móvil en fichajes sin conexión (cola offline)
-- evitando que el servidor sobrescriba la hora del toque con el momento de entrega.
--
-- Seguro de ejecutar varias veces en Supabase → SQL Editor → Run.

alter table public.fichajes
  add column if not exists fichado_sin_conexion boolean not null default false,
  add column if not exists sincronizado_en timestamptz;

create or replace function public.proteger_horas_fichaje()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  ahora text := to_char(now() at time zone 'Europe/Madrid', 'HH24:MI');
  hoy date := (now() at time zone 'Europe/Madrid')::date;
begin
  -- Sin usuario = el propio dueño arreglando datos desde el editor SQL.
  if auth.uid() is null then
    return new;
  end if;

  if public.mi_rol() = 'dueno' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.hora_corregida := false;
  else
    new.hora_corregida := old.hora_corregida;
    if new.fecha is distinct from old.fecha
       or new.obra_id is distinct from old.obra_id
       or new.trabajador_id is distinct from old.trabajador_id then
      raise exception 'Solo el dueño puede cambiar un fichaje ya hecho.';
    end if;
  end if;

  if (tg_op = 'INSERT' and new.hora_entrada is not null)
     or (tg_op = 'UPDATE' and new.hora_entrada is distinct from old.hora_entrada) then
    if tg_op = 'UPDATE' and old.hora_entrada is not null then
      raise exception 'La entrada ya está fichada. Solo el dueño puede cambiarla.';
    end if;
    if new.fecha <> hoy then
      raise exception 'Solo se puede fichar el día de hoy.';
    end if;

    if coalesce(new.fichado_sin_conexion, false) = true
       and new.hora_entrada ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       and new.hora_entrada <= ahora then
      new.sincronizado_en := now();
    else
      new.hora_entrada := ahora;
      new.fichado_sin_conexion := false;
      new.sincronizado_en := null;
    end if;
  end if;

  if (tg_op = 'INSERT' and new.hora_salida is not null)
     or (tg_op = 'UPDATE' and new.hora_salida is distinct from old.hora_salida) then
    if tg_op = 'UPDATE' and old.hora_salida is not null then
      raise exception 'La salida ya está fichada. Solo el dueño puede cambiarla.';
    end if;
    if new.fecha <> hoy then
      raise exception 'Solo se puede fichar el día de hoy.';
    end if;

    if coalesce(new.fichado_sin_conexion, false) = true
       and new.hora_salida ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       and new.hora_salida <= ahora then
      new.sincronizado_en := now();
    else
      new.hora_salida := ahora;
      new.fichado_sin_conexion := false;
      new.sincronizado_en := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_horas_fichaje on public.fichajes;
create trigger proteger_horas_fichaje
  before insert or update on public.fichajes
  for each row execute function public.proteger_horas_fichaje();
