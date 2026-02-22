"use client";

import { useState, useEffect } from "react";
import { login } from "@/app/actions/auth";
import { checkDatabaseConnection } from "@/app/actions/db";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    checking: boolean;
    connected: boolean;
    error?: string;
  }>({ checking: true, connected: false });

  useEffect(() => {
    checkDatabaseConnection().then((result) => {
      setDbStatus({
        checking: false,
        connected: result.connected,
        error: result.error,
      });
    });
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-sm p-8 bg-white border border-stone-200 rounded-lg shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-stone-900 text-balance">Asther</h1>
          <p className="text-stone-500 mt-2 text-pretty">Sign in to your dashboard</p>
        </div>

        {/* Database Status Indicator */}
        {dbStatus.checking ? (
          <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-md text-stone-600 text-sm flex items-center gap-2">
            <span className="animate-pulse">●</span> Checking database connection...
          </div>
        ) : !dbStatus.connected ? (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            <div className="font-medium">Database Error</div>
            <div className="text-red-600 text-xs mt-1">{dbStatus.error}</div>
          </div>
        ) : null}

        <form action={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-stone-700 mb-1.5"
            >
              Username
            </label>
            <input
              type="text"
              id="email"
              name="email"
              required
              autoComplete="username"
              suppressHydrationWarning
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-700 mb-1.5"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              autoComplete="current-password"
              suppressHydrationWarning
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
