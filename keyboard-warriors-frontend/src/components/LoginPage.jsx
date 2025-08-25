// Path: src/components/LoginPage.jsx

import { useState } from "react";
import { supabase } from "../supabaseClient"; // Import the Supabase client

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // The App component will handle the redirect on successful login
    } catch (error) {
      setError(error.message || "Invalid login credentials.");
      console.error("Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid effect */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(to right, var(--color-border) 1px, var(--color-background) 1px)",
          backgroundSize: "30px 30px",
          opacity: "0.2",
        }}
      />

      <div className="w-full max-w-md bg-background border border-border rounded-lg shadow-lg shadow-primary/10 p-8 z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-widest text-primary animate-pulse">
            KEYBOARD WARRIORS
          </h1>
          <p className="text-sm text-muted mt-2">Round 3: Solve the Vault</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              className="block text-sm mb-2 text-foreground"
              htmlFor="email"
            >
              Participant Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-muted rounded px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all duration-300"
              required
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-sm mb-2 text-foreground"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-muted rounded px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all duration-300"
              required
            />
          </div>
          {error && <p className="text-destructive text-xs mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-background font-bold py-2 px-4 rounded hover:bg-opacity-90 focus:outline-none focus:shadow-outline shadow-md shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "ACCESS VAULT"}
          </button>
        </form>
      </div>
      <p className="text-xs text-muted mt-8 z-10">Authorization Required.</p>
    </div>
  );
}
