"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError("Acesso negado. Senha inválida.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, idToken }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Acesso negado.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Erro na autenticação Google.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-jarvis-bg flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-jarvis-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-10">
          {/* Arc reactor icon */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-full border-2 border-jarvis-primary/40 flex items-center justify-center relative">
            <div className="w-10 h-10 rounded-full border-2 border-jarvis-primary/60 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-jarvis-primary shadow-[0_0_20px_rgba(0,212,255,0.8)] animate-glow-pulse" />
            </div>
            {/* Rotating ring */}
            <div className="absolute inset-0 rounded-full border border-jarvis-primary/20 animate-[spin_8s_linear_infinite]" />
          </div>

          <h1 className="text-3xl tracking-[0.25em] text-jarvis-primary font-(--font-orbitron) font-bold drop-shadow-[0_0_12px_rgba(0,212,255,0.5)]">
            J.A.R.V.I.S.
          </h1>
          <p className="text-jarvis-text-muted text-xs tracking-[0.15em] uppercase mt-2">
            Autenticação Necessária
          </p>
        </div>

        {/* Login card */}
        <form onSubmit={handleSubmit}>
          <div className="relative bg-jarvis-surface/60 backdrop-blur-xl border border-jarvis-primary/15 rounded-xl p-8">
            {/* Top accent line */}
            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-jarvis-primary/50 to-transparent" />

            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-[10px] text-jarvis-text-muted font-bold tracking-[0.15em] uppercase mb-3">
                Código de Acesso
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                autoFocus
                required
                className="w-full bg-jarvis-bg/80 border border-jarvis-primary/20 rounded-lg px-4 py-3 text-jarvis-text font-mono text-sm tracking-wider placeholder:text-jarvis-text-dim focus:outline-none focus:border-jarvis-primary/50 focus:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all duration-300"
              />
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-jarvis-error/10 border border-jarvis-error/30 text-jarvis-error text-xs font-mono tracking-wide">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-lg font-bold tracking-[0.15em] uppercase text-xs transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-jarvis-primary/10 border border-jarvis-primary/30 text-jarvis-primary hover:bg-jarvis-primary/20 hover:border-jarvis-primary/50 hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] active:scale-[0.98]">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-jarvis-primary/40 border-t-jarvis-primary rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                "Acessar com Código"
              )}
            </button>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-jarvis-primary/10"></div>
              </div>
              <span className="relative px-4 text-[9px] text-jarvis-text-dim uppercase tracking-widest bg-[#060612]/80 backdrop-blur-sm">Ou</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold tracking-[0.15em] uppercase text-xs transition-all duration-300 disabled:opacity-40 bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 flex items-center justify-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google Identity
            </button>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-jarvis-primary/30 to-transparent" />
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-jarvis-text-dim text-[10px] tracking-widest uppercase mt-6">
          Stark Industries — Acesso Restrito
        </p>
      </div>
    </div>
  );
}
