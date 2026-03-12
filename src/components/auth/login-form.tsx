"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { User, Lock, Loader2, AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
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

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-900">
          Username
        </label>
        <div className="relative group">
          <User className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="admin"
            autoComplete="username"
            className="flex h-12 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-900">
          Password
        </label>
        <div className="relative group">
          <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="flex h-12 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none"
            required
          />
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
          <AlertCircle className="size-5 shrink-0 text-rose-500" />
          <p>{error}</p>
        </div>
      ) : null}

      <div className="pt-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-base font-bold text-white shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] hover:bg-slate-800 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-3 size-5 animate-spin" />
              Memproses...
            </>
          ) : (
            "Masuk ke Dashboard"
          )}
        </button>
      </div>
    </form>
  );
}