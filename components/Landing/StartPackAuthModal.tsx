"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sticker,
  LogIn,
  UserPlus,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  Mail,
  User,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface StartPackAuthModalProps {
  isOpen: boolean;
  packTitle: string;
  onClose: () => void;
  onProceedAsGuest: () => void;
  onSuccessAuth: (user: { id: string; email: string; username: string }) => void;
}

export function StartPackAuthModal({
  isOpen,
  packTitle,
  onClose,
  onProceedAsGuest,
  onSuccessAuth,
}: StartPackAuthModalProps) {
  const [view, setView] = useState<"choice" | "login" | "register">("choice");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const isLogin = view === "login";

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

      // Persist session
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
        onSuccessAuth(data.user);
      }, 600);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Dialog Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300 transition hover:bg-slate-200 dark:hover:bg-white/20 dark:hover:text-white cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {view === "choice" ? (
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#25D366] via-emerald-500 to-[#128C7E] text-white shadow-lg shadow-emerald-500/25">
                <Sticker className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/10 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:text-[#25D366] font-['Space_Grotesk'] mb-2">
                <span>Pack: &ldquo;{packTitle || "New Sticker Pack"}&rdquo;</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-['Space_Grotesk']">
                How would you like to start?
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Choose an option to create and manage your WhatsApp sticker pack
              </p>
            </div>

            {/* 3 Main Choice Cards */}
            <div className="space-y-3">
              {/* Option 1: Log In */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView("login");
                }}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#182229] hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-[#25D366] shrink-0 group-hover:scale-105 transition-transform">
                    <LogIn className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-['Space_Grotesk'] text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Log In</span>
                      <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-[#25D366]">
                        Existing User
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Save packs directly to the online database and access anywhere.
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#25D366] group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* Option 2: Sign Up */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView("register");
                }}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 hover:border-emerald-500/60 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366] text-slate-950 shrink-0 group-hover:scale-105 transition-transform shadow-md">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-['Space_Grotesk'] text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Sign Up</span>
                      <span className="rounded-md bg-[#25D366] px-1.5 py-0.2 text-[10px] font-black text-slate-950">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Create free account with unlimited cloud saves and instant exports.
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#25D366] group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* Option 3: Proceed as Guest */}
              <button
                type="button"
                onClick={onProceedAsGuest}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-100/60 dark:bg-white/5 hover:border-slate-400 dark:hover:border-white/40 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-['Space_Grotesk'] text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span>Proceed as Guest</span>
                      <span className="rounded-md bg-slate-200 dark:bg-white/10 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        Quick Start
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Start creating immediately. Stored in your temporary session.
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            </div>
          </div>
        ) : (
          /* Login / Register Form View */
          <div>
            {/* Back to Options button */}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setView("choice");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold font-['Space_Grotesk'] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Options</span>
            </button>

            {/* Header */}
            <div className="text-center mb-5">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-['Space_Grotesk']">
                {view === "login" ? "Log In to Your Account" : "Create Creator Account"}
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {view === "login"
                  ? "Sign in to save packs permanently to the online database"
                  : "Join to save packs to the online database and sync across devices"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {view === "register" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Username
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="sticker_creator"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#182229] py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {view === "login" ? "Email or Username" : "Email Address"}
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type={view === "login" ? "text" : "email"}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#182229] py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#182229] py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#128C7E] py-3 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 cursor-pointer font-['Space_Grotesk']"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {view === "login" ? "Log In & Open Studio" : "Create Account & Open Studio"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch between Login and Register or Proceed as Guest */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView(view === "login" ? "register" : "login");
                }}
                className="text-emerald-700 dark:text-[#25D366] font-bold hover:underline cursor-pointer"
              >
                {view === "login" ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
              </button>
              <button
                type="button"
                onClick={onProceedAsGuest}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer font-medium"
              >
                Or proceed as guest →
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
