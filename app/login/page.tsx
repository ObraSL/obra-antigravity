"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { SelectorIdioma } from "@/components/ui/SelectorIdioma";
import { tr } from "@/lib/i18n";

const EMAIL_RECORDADO = "control-de-obra:email";
const ID_PASSWORD = "login-password";

/** Pone el cursor en la contraseña, para escribirla sin tener que tocar nada más. */
const enfocarPassword = () =>
  requestAnimationFrame(() => document.getElementById(ID_PASSWORD)?.focus());

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInterior />
    </Suspense>
  );
}

function LoginPageInterior() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const params = useSearchParams();
  // ?empresa= (invitación de una empresa) o ?alta= (vuelta del pago en /alta).
  const codigoEnlace = params.get("empresa") ?? params.get("alta");

  const [modo, setModo] = useState<"login" | "signup" | "recuperar">(codigoEnlace ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  // Lo que escribe (o trae el enlace) en "Código" y qué significa: de una
  // empresa existente (te unes), de alta (creas la tuya) o inválido.
  const [codigo, setCodigo] = useState(codigoEnlace ?? "");
  const [codigoInfo, setCodigoInfo] = useState<
    { estado: "vacio" | "comprobando" | "invalido" } | { estado: "empresa"; nombre: string } | { estado: "alta" }
  >({ estado: "vacio" });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  // Cada vez que cambia el código se consulta qué es (con una pequeña pausa
  // para no preguntar por cada letra) y se enseña antes de crear la cuenta.
  useEffect(() => {
    const limpio = codigo.trim();
    if (!limpio) {
      setCodigoInfo({ estado: "vacio" });
      return;
    }
    setCodigoInfo({ estado: "comprobando" });
    let cancelado = false;
    const t = setTimeout(() => {
      supabase.rpc("comprobar_codigo_registro", { p_codigo: limpio }).then(({ data }) => {
        if (cancelado) return;
        const fila = (data as { tipo: string; nombre: string | null }[] | null)?.[0];
        if (fila?.tipo === "empresa") setCodigoInfo({ estado: "empresa", nombre: fila.nombre ?? "" });
        else if (fila?.tipo === "alta") setCodigoInfo({ estado: "alta" });
        else setCodigoInfo({ estado: "invalido" });
      });
    }, 400);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [codigo, supabase]);

  // Recordamos solo el email del último acceso (la contraseña nunca se
  // guarda: hay que escribirla cada vez).
  useEffect(() => {
    const guardado = localStorage.getItem(EMAIL_RECORDADO);
    if (guardado) {
      setEmail(guardado);
      // Con el email ya puesto, lo único que falta es la contraseña.
      enfocarPassword();
    }
  }, []);

  const cambiarModo = (m: typeof modo) => {
    setModo(m);
    setError("");
    setAviso("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAviso("");
    setCargando(true);

    if (modo === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message === "Invalid login credentials") {
          // Se queda en esta pantalla y con el email escrito: solo se borra
          // la contraseña mala y el cursor vuelve a ella para repetirla.
          setError(tr("Contraseña incorrecta. Vuelve a escribirla."));
          setPassword("");
          enfocarPassword();
        } else if (error.message === "Email not confirmed") {
          setError(tr("Todavía no has confirmado tu email. Busca el correo de confirmación."));
        } else {
          setError(error.message);
        }
        setCargando(false);
        return;
      }
      localStorage.setItem(EMAIL_RECORDADO, email);
      router.push("/");
      router.refresh();
    } else if (modo === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data:
            codigoInfo.estado === "empresa"
              ? { empresa_codigo: codigo.trim(), nombre: nombre.trim(), apellidos: apellidos.trim() }
              : {
                  codigo_alta: codigo.trim(),
                  nombre_empresa: nombreEmpresa.trim(),
                  nombre: nombre.trim(),
                  apellidos: apellidos.trim(),
                },
        },
      });
      if (error) {
        setError(error.message);
        setCargando(false);
        return;
      }
      setAviso(tr("Cuenta creada. Revisa tu email para confirmarla y luego inicia sesión."));
      setModo("login");
      setCargando(false);
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
        setCargando(false);
        return;
      }
      setAviso(tr("Si ese email tiene una cuenta, te hemos enviado un enlace para restablecer la contraseña."));
      setCargando(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-sm flex-col justify-center px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))]">
      {/* En la app instalada no hay barra del navegador: sin esto no se puede
          volver a la pantalla de inicio. */}
      <Link
        href="/"
        className="absolute left-4 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-obra-card-border bg-obra-card text-obra-text-dim"
        aria-label={tr("Volver")}
      >
        <ArrowLeft size={18} />
      </Link>
      <SelectorIdioma className="absolute right-4 top-5" />

      <div className="mb-8 flex flex-col items-center gap-3">
        <Logo size={48} className="text-obra-text" />
        <div className="font-display text-2xl font-extrabold uppercase tracking-wide text-obra-text">
          {tr("Control de Obra")}
        </div>
      </div>

      <form onSubmit={submit}>
        <Field label={tr("Email")}>
          <Input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={tr("tú@ejemplo.com")}
          />
        </Field>

        {modo === "signup" && (
          <>
            <Field label={tr("Nombre")}>
              <Input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={tr("Ej. Ana")} />
            </Field>
            <Field label={tr("Apellidos")}>
              <Input required value={apellidos} onChange={(e) => setApellidos(e.target.value)} placeholder={tr("Ej. Pérez López")} />
            </Field>
          </>
        )}

        {modo !== "recuperar" && (
          <Field label={tr("Contraseña")}>
            <Input
              id={ID_PASSWORD}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="••••••••"
            />
          </Field>
        )}

        {modo === "signup" && (
          <>
            <Field label={tr("Código")}>
              <Input
                required
                autoCapitalize="characters"
                autoComplete="off"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder={tr("El código que te ha dado tu empresa")}
              />
            </Field>
            {codigoInfo.estado !== "empresa" && codigoInfo.estado !== "alta" && (
              <Link href="/alta" className="-mt-2 mb-3.5 block text-[13px] font-semibold text-obra-yellow">
                {tr("¿Tu empresa aún no tiene código? Consíguelo aquí")}
              </Link>
            )}
            {codigoInfo.estado === "comprobando" && (
              <div className="-mt-2 mb-3.5 text-[13px] text-obra-text-faint">{tr("Comprobando el código…")}</div>
            )}
            {codigoInfo.estado === "invalido" && (
              <div className="-mt-2 mb-3.5 rounded-xl bg-obra-red-bg px-3.5 py-3 text-[14px] font-semibold text-obra-red-text">
                {tr("Ese código no vale (o ya se usó). Pídelo de nuevo.")}
              </div>
            )}
            {codigoInfo.estado === "empresa" && (
              <div className="-mt-2 mb-3.5 rounded-xl bg-obra-yellow/12 px-3.5 py-3 text-[14px] font-semibold text-obra-text">
                {tr("Te unes a la empresa «{empresa}». Su responsable tendrá que aprobarte.", { empresa: codigoInfo.nombre })}
              </div>
            )}
            {codigoInfo.estado === "alta" && (
              <>
                <div className="-mt-2 mb-3.5 rounded-xl bg-obra-yellow/12 px-3.5 py-3 text-[14px] font-semibold text-obra-text">
                  {tr("Código válido: vas a crear tu propia empresa (14 días de prueba).")}
                </div>
                <Field label={tr("Nombre de tu empresa")}>
                  <Input
                    required
                    value={nombreEmpresa}
                    onChange={(e) => setNombreEmpresa(e.target.value)}
                    placeholder={tr("Ej. Reformas Pérez")}
                  />
                </Field>
              </>
            )}
          </>
        )}

        {/* Bien visible: con el teclado del iPhone abierto, un aviso pequeño
            en gris pasaba desapercibido y parecía que no hacía nada. */}
        {error && (
          <div className="mb-3.5 rounded-xl bg-obra-red-bg px-3.5 py-3 text-[14px] font-semibold text-obra-red-text">
            {error}
            {error.startsWith("Contraseña incorrecta") && (
              <div className="mt-0.5 text-[12px] font-normal">
                {tr("Si sigue fallando, revisa que el email esté bien escrito.")}
              </div>
            )}
          </div>
        )}
        {aviso && <div className="mb-3.5 text-sm text-obra-green">{aviso}</div>}

        <PrimaryButton
          type="submit"
          disabled={
            cargando ||
            (modo === "signup" && codigoInfo.estado !== "empresa" && codigoInfo.estado !== "alta")
          }
        >
          {cargando && <Loader2 size={16} className="animate-spin" />}
          {modo === "login" ? tr("Entrar") : modo === "signup" ? tr("Crear cuenta") : tr("Enviar enlace")}
        </PrimaryButton>
      </form>

      {modo === "login" && (
        <button onClick={() => cambiarModo("recuperar")} className="mt-4 text-center text-sm font-semibold text-obra-yellow">
          {tr("¿Olvidaste tu contraseña?")}
        </button>
      )}

      <button
        onClick={() => cambiarModo(modo === "login" ? "signup" : "login")}
        className="mt-3 text-center text-sm font-semibold text-obra-text-dim"
      >
        {modo === "login"
          ? tr("¿No tienes cuenta? Créala")
          : modo === "signup"
            ? tr("¿Ya tienes cuenta? Inicia sesión")
            : tr("Volver a iniciar sesión")}
      </button>
    </div>
  );
}
