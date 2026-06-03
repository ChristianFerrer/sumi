"use client";

import { useState } from "react";
import { Mail, User as UserIcon, Crown, LogOut, Lock, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { AuthForm } from "@/components/AuthForm";

export default function CuentaPage() {
  const { user, loading, configured, recovering, signOut, updatePassword } = useAuth();
  const [newPass, setNewPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  if (loading) {
    return <p className="py-16 text-center text-slate-500">Cargando…</p>;
  }

  if (!configured) {
    return (
      <div className="space-y-3 py-10 text-center text-slate-500">
        <h1 className="text-2xl font-extrabold text-slate-900">Cuenta</h1>
        <p className="text-sm">
          La autenticación no está configurada. Falta definir las variables de
          Supabase en el entorno.
        </p>
      </div>
    );
  }

  // Pantalla para fijar nueva contraseña tras el enlace de recuperación.
  if (recovering) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold">Nueva contraseña</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await updatePassword(newPass);
            setMsg(res.error ?? "Contraseña actualizada.");
          }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 focus-within:border-sumi">
            <Lock size={18} className="text-slate-400" />
            <input
              type="password"
              minLength={6}
              required
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Nueva contraseña"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          {msg && <p className="text-sm text-grade-excellent">{msg}</p>}
          <button className="w-full rounded-xl bg-sumi py-3 text-sm font-semibold text-white">
            Guardar
          </button>
        </form>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const name = (user.user_metadata?.name as string) || "—";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Cuenta</h1>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Información personal
        </p>
        <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <li className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
            <UserIcon size={18} className="text-slate-400" />
            <span className="flex-1 font-medium">Nombre</span>
            <span className="text-slate-500">{name}</span>
          </li>
          <li className="flex items-center gap-3 px-4 py-3.5">
            <Mail size={18} className="text-slate-400" />
            <span className="flex-1 font-medium">Email</span>
            <span className="truncate text-slate-500">{user.email}</span>
          </li>
        </ul>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Suscripción
        </p>
        <button className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm">
          <Crown size={18} className="text-grade-poor" />
          <span className="flex-1 text-left font-medium">Hacerse Socio Premium</span>
          <ChevronRight size={18} className="text-slate-300" />
        </button>
      </section>

      <button
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-semibold text-grade-bad shadow-sm"
      >
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </div>
  );
}
