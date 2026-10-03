"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function login(e) {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/auth/callback" }
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return <main className="authPage">
    <div className="authCard">
      <p className="eyebrow">SOCIAL MANAGER</p>
      <h1>Sign in</h1>
      <p className="muted">Enter your email and we&apos;ll send you a secure sign-in link.</p>
      <form onSubmit={login}>
        <input type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        <button className="primary" type="submit">Send sign-in link</button>
      </form>
      {sent && <p className="success">Check your email for the sign-in link.</p>}
      {error && <p className="error">{error}</p>}
    </div>
  </main>;
}
