"use client";

import React, { useState } from "react";
import { CheckCheck, Moon, Sun, Send, Smile, Phone, Video, MoreVertical, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ExploreSticker, ExplorePack } from "../../src/types/explore";

interface WhatsAppChatSimulatorProps {
  sticker: ExploreSticker;
  pack: ExplorePack;
}

export function WhatsAppChatSimulator({ sticker, pack }: WhatsAppChatSimulatorProps) {
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [messageSide, setMessageSide] = useState<"outgoing" | "incoming">("outgoing");

  const isDark = themeMode === "dark";

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-lg">
      {/* Simulator Control Bar */}
      <div className="flex items-center justify-between bg-slate-100 dark:bg-[#111b21] px-3.5 py-2 border-b border-slate-200 dark:border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
          <span className="font-bold text-slate-700 dark:text-slate-200 font-['Space_Grotesk']">
            WhatsApp Live Chat Preview
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Incoming vs Outgoing Toggle */}
          <div className="flex items-center rounded-xl bg-white dark:bg-black/40 p-0.5 border border-slate-200 dark:border-white/10 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setMessageSide("outgoing")}
              className={`rounded-lg px-2 py-0.5 transition-all cursor-pointer ${
                messageSide === "outgoing"
                  ? "bg-[#25D366] text-black"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Outgoing (You)
            </button>
            <button
              type="button"
              onClick={() => setMessageSide("incoming")}
              className={`rounded-lg px-2 py-0.5 transition-all cursor-pointer ${
                messageSide === "incoming"
                  ? "bg-[#25D366] text-black"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Incoming
            </button>
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => setThemeMode(isDark ? "light" : "dark")}
            title="Toggle WhatsApp Chat Theme"
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-white dark:bg-black/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* WhatsApp Fake Chat Window */}
      <div
        className={`relative flex flex-col h-72 sm:h-80 w-full select-none overflow-hidden transition-colors ${
          isDark ? "bg-[#0b141a]" : "bg-[#efeae2]"
        }`}
      >
        {/* Subtle WhatsApp Background Doodle Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${isDark ? "#ffffff" : "#000000"} 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        />

        {/* WhatsApp Chat Header */}
        <div
          className={`relative z-10 flex items-center justify-between px-3.5 py-2 shrink-0 border-b shadow-xs ${
            isDark
              ? "bg-[#1f2c34] border-[#2a3942] text-white"
              : "bg-[#008069] border-[#008069] text-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white font-bold text-xs">
              💬
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Sticker Testing Chat</div>
              <div className="text-[10px] text-emerald-200/90 flex items-center gap-1">
                <span>online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <Video className="h-4 w-4" />
            <Phone className="h-3.5 w-3.5" />
            <MoreVertical className="h-4 w-4" />
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="relative z-10 flex-1 p-3.5 space-y-3 overflow-y-auto no-scrollbar flex flex-col justify-end">
          {/* Previous Context Message */}
          <div className="flex justify-start">
            <div
              className={`rounded-2xl rounded-tl-xs px-3 py-1.5 max-w-[75%] text-xs shadow-xs ${
                isDark
                  ? "bg-[#1f2c34] text-slate-100"
                  : "bg-white text-slate-800"
              }`}
            >
              <div className="text-[11px] font-bold text-emerald-500 mb-0.5">Alex</div>
              <p className="leading-snug">Check out this new sticker from {pack.title}! 🔥</p>
              <div className="text-[9px] text-slate-400 text-right mt-0.5">10:41 AM</div>
            </div>
          </div>

          {/* Actual Sticker Bubble */}
          <motion.div
            key={`${sticker.id}-${messageSide}`}
            initial={{ scale: 0.8, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`flex ${messageSide === "outgoing" ? "justify-end" : "justify-start"}`}
          >
            <div className="relative group max-w-[190px] sm:max-w-[210px]">
              {/* WhatsApp Sticker Display: Authentic floating die-cut without bulky speech bubble */}
              <div className="relative p-1">
                <img
                  src={sticker.imageUrl}
                  alt={sticker.title || "WhatsApp Sticker"}
                  className="h-32 w-32 sm:h-36 sm:w-36 object-contain drop-shadow-md pointer-events-none"
                  loading="eager"
                />

                {/* Floating WhatsApp Timestamp & Checkmarks */}
                <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-xs">
                  <span>10:42 AM</span>
                  {messageSide === "outgoing" && (
                    <CheckCheck className="h-3 w-3 text-cyan-400 stroke-[2.5]" />
                  )}
                </div>
              </div>

              {/* Emoji tag popup on hover */}
              {sticker.emojis && sticker.emojis.length > 0 && (
                <div
                  className={`absolute -top-2 ${
                    messageSide === "outgoing" ? "-left-2" : "-right-2"
                  } flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-[#1f2c34] shadow-md text-xs border border-slate-200 dark:border-white/10`}
                >
                  {sticker.emojis[0]}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* WhatsApp Fake Input Bar */}
        <div
          className={`relative z-10 flex items-center gap-2 p-2 shrink-0 border-t ${
            isDark ? "bg-[#1f2c34] border-[#2a3942]" : "bg-[#f0f2f5] border-slate-200"
          }`}
        >
          <div
            className={`flex-1 flex items-center gap-2 rounded-2xl px-3 py-1.5 text-xs ${
              isDark ? "bg-[#2a3942] text-slate-300" : "bg-white text-slate-600"
            }`}
          >
            <Smile className="h-4 w-4 text-slate-400" />
            <span className="text-slate-400">Type a message...</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-black shadow-sm">
            <Send className="h-3.5 w-3.5 fill-black ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
