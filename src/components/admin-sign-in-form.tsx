"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";

export function AdminSignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Checking credentials...");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    if (result?.ok) {
      window.location.reload();
      return;
    }

    setMessage("Sign-in failed. Check the admin environment variables.");
  }

  return (
    <form onSubmit={onSubmit} className="glass-panel rounded-lg p-6">
      <h2 className="text-2xl font-black">Admin sign in</h2>
      <p className="mt-2 leading-7 text-ink/62">
        Protected product operations require an admin session before ingestion or research processing can be triggered.
      </p>
      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold">
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="rounded-md border border-ink/15 bg-paper px-3 py-3 text-ink outline-none ring-coral/30 transition focus:ring-4"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="rounded-md border border-ink/15 bg-paper px-3 py-3 text-ink outline-none ring-coral/30 transition focus:ring-4"
            required
          />
        </label>
      </div>
      <button
        type="submit"
        className="jitter-hover mt-5 inline-flex items-center gap-2 rounded-md bg-coral px-4 py-3 font-semibold text-white"
      >
        <LogIn className="h-4 w-4" aria-hidden />
        Sign in
      </button>
      {message ? <p className="mt-4 text-sm text-ink/64">{message}</p> : null}
    </form>
  );
}
