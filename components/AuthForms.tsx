"use client";

import React, { useState } from "react";
import { User, Lock, Mail, ArrowRight, Loader2, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

export interface AuthFormsProps {
  onSuccess?: (user: { id: string; email: string; username: string }) => void;
}

export function AuthForms({ onSuccess }: AuthFormsProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { identifier: email.trim(), password }
        : { email: email.trim(), username: username.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || (isLogin ? "Invalid login credentials." : "Failed to create account."));
      }

      if (!data.user) {
        throw new Error("Server returned an invalid authentication response.");
      }

      // Persist session locally
      try {
        localStorage.setItem("omoji_user_session", JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem("omoji_user_token", data.token);
        }
      } catch (storageErr) {
        console.warn("Storage warning:", storageErr);
      }

      setSuccess(isLogin ? `Welcome back, @${data.user.username}!` : `Account created! Welcome, @${data.user.username}!`);
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(data.user);
        }
      }, 600);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl transition-colors duration-200">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#25D366] via-emerald-500 to-[#128C7E] text-white shadow-lg shadow-emerald-500/25">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-['Space_Grotesk']">
          {isLogin ? "Welcome Back to Omoji" : "Create Creator Account"}
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          {isLogin
            ? "Sign in to save your custom stickers and publish packs"
            : "Join the creator community and publish WhatsApp sticker packs"}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="mt-6 flex rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#182229] p-1">
        <button
          type="button"
          onClick={() => {
            setIsLogin(true);
            setError(null);
          }}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
            isLogin
              ? "bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#128C7E] text-white shadow-md shadow-emerald-500/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setIsLogin(false);
            setError(null);
          }}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
            !isLogin
              ? "bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#128C7E] text-white shadow-md shadow-emerald-500/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Register
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Username</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="sticker_master"
                className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#182229] py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#182229] py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#182229] py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-medium text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#128C7E] py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>{isLogin ? "Sign In to Studio" : "Create My Account"}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default AuthForms;
