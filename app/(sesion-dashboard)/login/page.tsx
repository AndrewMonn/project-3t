// app/(sesion-dashboard)/login/page.tsx
// MODIFICADO: se añadió reCAPTCHA v2 y aviso de IP nueva al hacer login.
"use client";

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

interface FieldErrors {
  email: string;
  password: string;
}

export default function Login() {
  const router = useRouter();
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [nuevaIp, setNuevaIp]     = useState(false);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({ email: "", password: "" });
  const [values, setValues]       = useState({ email: "", password: "" });
  const captchaRef                = useRef<HTMLDivElement>(null);
  const widgetIdRef               = useRef<number | null>(null);

  // ── Cargar script de reCAPTCHA dinámicamente ─────────────────────────────
  useEffect(() => {
    if (document.getElementById("recaptcha-script")) {
      setCaptchaReady(true);
      return;
    }

    window.onRecaptchaLoad = () => setCaptchaReady(true);

    const script   = document.createElement("script");
    script.id      = "recaptcha-script";
    script.src     = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
    script.async   = true;
    script.defer   = true;
    document.head.appendChild(script);
  }, []);

  // ── Renderizar widget cuando el script esté listo ────────────────────────
  useEffect(() => {
    if (!captchaReady || !captchaRef.current) return;
    if (widgetIdRef.current !== null) return; // ya renderizado

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

    if (!siteKey) {
      console.warn("[reCAPTCHA] NEXT_PUBLIC_RECAPTCHA_SITE_KEY no configurada.");
      return;
    }

    widgetIdRef.current = window.grecaptcha.render(captchaRef.current, {
      sitekey: siteKey,
      theme:   "dark",
    });
  }, [captchaReady]);

  function validateEmail(email: string)    { return !email.trim() ? "El correo es obligatorio" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Formato inválido" : ""; }
  function validatePassword(pw: string)    { return !pw ? "La contraseña es obligatoria" : pw.length < 6 ? "Mínimo 6 caracteres" : ""; }

  function handleBlur(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFieldErrors(prev => ({ ...prev, [name]: name === "email" ? validateEmail(value) : validatePassword(value) }));
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNuevaIp(false);

    const email    = values.email.toLowerCase().trim();
    const password = values.password;

    // Validación de campos
    const emailErr = validateEmail(email);
    const passErr  = validatePassword(password);
    if (emailErr || passErr) { setFieldErrors({ email: emailErr, password: passErr }); return; }

    // Obtener token reCAPTCHA
    let captchaToken = "";
    if (widgetIdRef.current !== null && window.grecaptcha) {
      captchaToken = window.grecaptcha.getResponse(widgetIdRef.current);
      if (!captchaToken) {
        setError("Por favor completa la verificación de seguridad.");
        return;
      }
    }

    setLoading(true);
    const form = e.currentTarget;

    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password, captchaToken }),
      });

      const json = await res.json();

      if (!res.ok) {
        // Resetear captcha en caso de error
        if (widgetIdRef.current !== null && window.grecaptcha) {
          window.grecaptcha.reset(widgetIdRef.current);
        }
        setError(json.message || "Credenciales inválidas");
        return;
      }

      if (!json.data?.token) throw new Error(json.message || "Respuesta inválida del servidor");

      const remember = (form.elements.namedItem("remember") as HTMLInputElement)?.checked;
      const storage  = remember ? localStorage : sessionStorage;
      storage.setItem("token", json.data.token);
      storage.setItem("user",  JSON.stringify(json.data.user));

      // Si el servidor detecta una IP nueva, mostrar aviso breve antes de redirigir
      if (json.data.nuevaIp) {
        setNuevaIp(true);
        setTimeout(() => router.push("/dashboard"), 2500);
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de conexión. Intente nuevamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-gray w-96 p-6 rounded-lg shadow-xl shadow-gray-500 backdrop-blur-lg"
      >
        <div className="flex items-center justify-center mb-4">
          <h2 className="font-semibold text-3xl italic">Iniciar Sesión</h2>
        </div>

        <div className="relative mx-9 my-3 w-60 h-40">
          <Image
            src="/images/pngegg.png"
            alt="Logo"
            fill
            sizes="(max-width: 60px), (max-width: 60px)"
            className="object-contain"
            priority
          />
        </div>

        {/* Aviso IP nueva */}
        {nuevaIp && (
          <div className="bg-amber-500/90 px-3 py-2 mb-3 rounded text-white text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>Inicio de sesión desde una ubicación nueva. Redirigiendo...</span>
          </div>
        )}

        {/* Error general */}
        {error && (
          <div className="bg-rose-500 px-3 py-2 mb-3 rounded text-gray-100 flex items-center justify-center">
            <p>{error}</p>
          </div>
        )}

        {/* Email */}
        <label htmlFor="email" className="block text-gray-100 mx-2 py-2">Correo</label>
        <input
          id="email" name="email" type="email"
          value={values.email} onChange={handleChange} onBlur={handleBlur}
          className={`w-full py-2 bg-gray-50 text-gray-500 px-3 outline-none mb-1 rounded-lg ${fieldErrors.email ? "border-2 border-rose-500" : ""}`}
          placeholder="correo@ejemplo.com" autoComplete="email"
        />
        {fieldErrors.email && <p className="text-rose-400 text-sm mx-2 mb-3">{fieldErrors.email}</p>}

        {/* Password */}
        <label htmlFor="password" className="block text-gray-100 mx-2 py-2">Contraseña</label>
        <input
          id="password" name="password" type="password"
          value={values.password} onChange={handleChange} onBlur={handleBlur}
          className={`w-full py-2 bg-gray-50 text-gray-500 px-3 outline-none mb-1 rounded-lg ${fieldErrors.password ? "border-2 border-rose-500" : ""}`}
          placeholder="******" autoComplete="current-password"
        />
        {fieldErrors.password && <p className="text-rose-400 text-sm mx-2 mb-3">{fieldErrors.password}</p>}

        {/* Recuérdame */}
        <div className="my-2 flex items-center">
          <input id="recuerdame" name="remember" className="mb-4 mx-1 rounded-xl" type="checkbox" />
          <label htmlFor="recuerdame" className="text-gray-100 mb-4 cursor-pointer">Recuérdame</label>
        </div>

        {/* reCAPTCHA widget */}
        <div className="flex justify-center my-3">
          <div ref={captchaRef} />
        </div>
        {!captchaReady && (
          <p className="text-center text-xs text-gray-400 mb-2">Cargando verificación de seguridad...</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-sky-500 w-full text-gray-100 py-2 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Entrando..." : "Inicio"}
        </button>
      </form>
    </main>
  );
}
