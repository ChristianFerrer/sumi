"use client";

import { useState } from "react";
import { Mail, Lock, User } from "lucide-react";
import { useAuth } from "./AuthProvider";

type Mode = "signin" | "signup" | "reset";

function GoogleIcon() {
  // Logo de Google plano (multicolor oficial).
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 5.1 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 5.1 29.4 3 24 3 16.3 3 9.7 7.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.9 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.5 40.6 16.2 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.1 36.2 45 30.8 45 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

const FIELD =
  "flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 focus-within:border-sumi";
const INPUT = "flex-1 bg-transparent text-sm outline-none";

export function AuthForm() {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    let res;
    if (mode === "signin") res = await signIn(email, password);
    else if (mode === "signup") res = await signUp(email, password, name);
    else res = await resetPassword(email);

    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else if (mode === "signup") {
      setNotice("Cuenta creada. Revisa tu correo para confirmarla.");
    } else if (mode === "reset") {
      setNotice("Te enviamos un enlace para restablecer tu contraseña.");
    }
  }

  async function google() {
    setBusy(true);
    setError(null);
    const res = await signInWithGoogle();
    if (res.error) {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">
          {mode === "signin" && "Inicia sesión"}
          {mode === "signup" && "Crea tu cuenta"}
          {mode === "reset" && "Recuperar contraseña"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "reset"
            ? "Ingresa tu correo y te enviamos un enlace."
            : "Guarda tu historial y síntesis en Sumi."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <div className={FIELD}>
            <User size={18} className="text-slate-400" />
            <input
              className={INPUT}
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className={FIELD}>
          <Mail size={18} className="text-slate-400" />
          <input
            type="email"
            required
            autoComplete="email"
            className={INPUT}
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {mode !== "reset" && (
          <div className={FIELD}>
            <Lock size={18} className="text-slate-400" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className={INPUT}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => {
              setMode("reset");
              setError(null);
              setNotice(null);
            }}
            className="text-xs font-medium text-sumi"
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}

        {error && <p className="text-sm text-grade-bad">{error}</p>}
        {notice && <p className="text-sm text-grade-excellent">{notice}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-sumi py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {mode === "signin" && "Entrar"}
          {mode === "signup" && "Crear cuenta"}
          {mode === "reset" && "Enviar enlace"}
        </button>
      </form>

      {mode !== "reset" && (
        <>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />o<span className="h-px flex-1 bg-slate-200" />
          </div>
          <button
            onClick={google}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
          >
            <GoogleIcon />
            Continuar con Google
          </button>
        </>
      )}

      <p className="text-center text-sm text-slate-500">
        {mode === "signin" ? (
          <>
            ¿No tienes cuenta?{" "}
            <button onClick={() => setMode("signup")} className="font-semibold text-sumi">
              Regístrate
            </button>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <button onClick={() => setMode("signin")} className="font-semibold text-sumi">
              Inicia sesión
            </button>
          </>
        )}
      </p>
    </div>
  );
}
