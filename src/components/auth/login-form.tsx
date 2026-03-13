"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { User, Lock, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const { error } = await authClient.signIn.username({
      username,
      password,
      rememberMe: true,
    });

    if (error) {
      setError(error.message || "Username atau password tidak valid.");
      setIsPending(false);
      return;
    }

    // Force a new document request so the dashboard reads the fresh auth cookie.
    window.location.replace("/dashboard");
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">
          Username
        </label>
        <div className="relative group">
          <User className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-300" />
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Masukkan username"
            autoComplete="username"
            className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pl-11 text-sm font-medium text-slate-900 transition-all duration-300 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-[3px] focus:ring-primary/20 outline-none"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-700">
            Password
          </label>
        </div>
        <div className="relative group">
          <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-300" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pl-11 text-sm font-medium text-slate-900 transition-all duration-300 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-[3px] focus:ring-primary/20 outline-none"
            required
          />
        </div>
      </div>

      {error ? (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600"
        >
          <AlertCircle className="size-5 shrink-0 text-rose-500" />
          <p>{error}</p>
        </motion.div>
      ) : null}

      <div className="pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="relative inline-flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-base font-bold text-white shadow-lg shadow-slate-900/20 transition-all duration-300 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 overflow-hidden"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <span>Masuk ke Dashboard</span>
          )}
        </button>
      </div>
    </form>
  );
}
