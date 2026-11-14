"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
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

  const iniciarComoDemo = useCallback(async () => {
    setError("");
    setAviso("");
    setCargando(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: "demo@obrasl.com",
      password: "ObraDemo2026!",
    });
    if (err) {
      setError(err.message);
      setCargando(false);
      return;
    }
    localStorage.setItem(EMAIL_RECORDADO, "demo@obrasl.com");
    router.push("/");
    router.refresh();
  }, [supabase, router]);

  useEffect(() => {
    if (params.get("demo") === "1") {
      iniciarComoDemo();
    }
  }, [params, iniciarComoDemo]);

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
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-between px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      {/* Barra superior con botón volver y selector de idioma */}
      <div className="relative z-10 flex items-center justify-between">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/18 bg-[#5a655d]/85 text-white backdrop-blur-md transition hover:bg-[#5a655d]"
          aria-label={tr("Volver")}
        >
          <ArrowLeft size={18} />
        </Link>
        <SelectorIdioma />
      </div>

      {/* Render 3D de la villa moderna iluminada (Screen 1 Dribbble) */}
      <div className="relative -mx-4 my-2 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-villa.png"
          alt="Control de Obra Villa"
          className="max-h-[220px] w-full object-contain object-bottom select-none"
        />
      </div>

      {/* Tarjeta principal de vidrio esmerilado oliva con resplandor cálido */}
      <div className="relative overflow-hidden rounded-[36px] border border-white/18 bg-[#60675d]/92 p-6 backdrop-blur-xl shadow-[0_20px_50px_rgba(12,16,13,0.38)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(85% 50% at 50% 0%, rgba(238,195,142,0.26) 0%, rgba(215,220,154,0.08) 45%, transparent 72%)",
          }}
        />

        <div className="relative mb-5 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/18 bg-white/10 text-[#d7dc9a]">
            <Logo size={24} />
          </div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-white">
            Welcome
          </h1>
          <div className="mt-1 text-[13px] text-white/75">
            {tr("Control de Obra")}
          </div>
        </div>

        <form onSubmit={submit} className="relative">
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
                <div className="-mt-2 mb-3.5 rounded-xl bg-obra-yellow/15 px-3.5 py-3 text-[14px] font-semibold text-white">
                  {tr("Te unes a la empresa «{empresa}». Su responsable tendrá que aprobarte.", { empresa: codigoInfo.nombre })}
                </div>
              )}
              {codigoInfo.estado === "alta" && (
                <>
                  <div className="-mt-2 mb-3.5 rounded-xl bg-obra-yellow/15 px-3.5 py-3 text-[14px] font-semibold text-white">
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

        <button
          onClick={() => cambiarModo(modo === "login" ? "signup" : "login")}
          className="relative mt-2.5 flex min-h-[48px] w-full items-center justify-center rounded-[16px] bg-[#0e0c0d] px-4 py-3 text-[15px] font-bold text-white shadow-[0_6px_18px_rgba(0,0,0,0.28)] transition hover:bg-black/85 active:scale-[0.99]"
        >
          {modo === "login"
            ? tr("¿No tienes cuenta? Créala")
            : modo === "signup"
              ? tr("¿Ya tienes cuenta? Inicia sesión")
              : tr("Volver a iniciar sesión")}
        </button>

        {modo === "login" && (
          <button
            onClick={() => cambiarModo("recuperar")}
            className="relative mt-3 block w-full text-center text-xs font-semibold text-white/75 hover:text-white"
          >
            {tr("¿Olvidaste tu contraseña?")}
          </button>
        )}

        {/* Acceso rápido de demostración en 1 clic */}
        <div className="relative mt-4 rounded-2xl border border-white/14 bg-[#4e5750]/85 p-3.5 text-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#d7dc9a]">
            {tr("Acceso de prueba")}
          </div>
          <button
            type="button"
            onClick={iniciarComoDemo}
            disabled={cargando}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#d7dc9a]/40 bg-[#d7dc9a]/18 px-3.5 py-2.5 text-[13.5px] font-bold text-[#d7dc9a] transition hover:bg-[#d7dc9a]/25 active:scale-[0.98]"
          >
            {cargando ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            <span>{tr("Entrar como Dueño (Demo 1-Clic)")}</span>
          </button>
          <div className="mt-2 text-[10.5px] text-white/70">
            <span className="font-mono text-[#d7dc9a]">demo@obrasl.com</span> · <span className="font-mono text-[#d7dc9a]">ObraDemo2026!</span> · <span className="font-mono text-[#d7dc9a]">OBRA2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
