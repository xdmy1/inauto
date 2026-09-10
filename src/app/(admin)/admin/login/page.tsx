"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <form
          action={action}
          className="mt-8 space-y-4 rounded-2xl border border-line bg-card p-6 shadow-card"
        >
          <h1 className="font-display text-lg font-extrabold">
            Panou administrator
          </h1>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Email
            </span>
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Parola
            </span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm outline-none focus:border-ink"
            />
          </label>
          {state?.error && (
            <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm font-medium text-accent-deep">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="h-11 w-full rounded-xl bg-ink font-display text-sm font-bold text-paper transition-colors hover:bg-black disabled:opacity-60"
          >
            {pending ? "..." : "Intră"}
          </button>
        </form>
      </div>
    </div>
  );
}
