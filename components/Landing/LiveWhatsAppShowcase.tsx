"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Send,
  CheckCheck,
  Heart,
  Flame,
  Laugh,
  ArrowRight,
  Sun,
  Moon,
  Check,
} from "lucide-react";

interface LiveWhatsAppShowcaseProps {
  onStartPack: () => void;
  onOpenCanvas: (stickerUrl?: string) => void;
}

interface ChatMessage {
  id: string;
  sender: "me" | "them";
  senderName?: string;
  type: "text" | "sticker";
  text?: string;
  stickerEmoji?: string;
  stickerTitle?: string;
  time: string;
  reactions: string[];
}

export function LiveWhatsAppShowcase({ onStartPack, onOpenCanvas }: LiveWhatsAppShowcaseProps) {
  const [chatTheme, setChatTheme] = useState<"dark" | "light">("dark");
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);

  // Simulated tray stickers that user can click to send into the chat
  const trayStickers = [
    { id: "tray-1", emoji: "🐶", title: "Good Boy", caption: "GOOD BOY" },
    { id: "tray-2", emoji: "🥑", title: "Holy Guac", caption: "HOLY GUAC" },
    { id: "tray-3", emoji: "🚀", title: "To The Moon", caption: "TO THE MOON" },
    { id: "tray-4", emoji: "🔥", title: "It's Fine", caption: "THIS IS FINE" },
    { id: "tray-5", emoji: "☕", title: "Need Coffee", caption: "NEED COFFEE" },
    { id: "tray-6", emoji: "✨", title: "Vibe Check", caption: "VIBE CHECK" },
    { id: "tray-7", emoji: "🧠", title: "Big Brain", caption: "BIG BRAIN" },
    { id: "tray-8", emoji: "🧢", title: "No Cap", caption: "NO CAP" },
  ];

  // Chat message history
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "them",
      senderName: "Sarah (Designer)",
      type: "text",
      text: "Did everyone see the new group chat avatar? 😂",
      time: "10:42 AM",
      reactions: ["😂"],
    },
    {
      id: "m-2",
      sender: "them",
      senderName: "Alex",
      type: "text",
      text: "Wait someone turn Milo the dog into a WhatsApp sticker please!!",
      time: "10:43 AM",
      reactions: ["🔥"],
    },
    {
      id: "m-3",
      sender: "me",
      type: "sticker",
      stickerEmoji: "🐶",
      stickerTitle: "GOOD BOY",
      time: "10:44 AM",
      reactions: ["❤️", "😂", "🔥"],
    },
  ]);

  const handleSendSticker = (sticker: { emoji: string; title: string }) => {
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: "me",
      type: "sticker",
      stickerEmoji: sticker.emoji,
      stickerTitle: sticker.title,
      time: "Just now",
      reactions: ["❤️"],
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId) {
          const hasReaction = msg.reactions.includes(emoji);
          const nextReactions = hasReaction
            ? msg.reactions.filter((r) => r !== emoji)
            : [...msg.reactions, emoji];
          return { ...msg, reactions: nextReactions };
        }
        return msg;
      })
    );
  };

  return (
    <section className="relative w-full py-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#25D366] font-['Space_Grotesk']">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mt-1">
            Live WhatsApp Experience
          </h2>
        </div>

        {/* Wallpaper Theme Switcher */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#111b21] p-1">
          <button
            type="button"
            onClick={() => setChatTheme("dark")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-['Space_Grotesk'] transition-all cursor-pointer ${
              chatTheme === "dark"
                ? "bg-[#25D366] text-slate-950 font-black shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            <span>Dark Wallpaper</span>
          </button>
          <button
            type="button"
            onClick={() => setChatTheme("light")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-['Space_Grotesk'] transition-all cursor-pointer ${
              chatTheme === "light"
                ? "bg-[#25D366] text-slate-950 font-black shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span>Light Wallpaper</span>
          </button>
        </div>
      </div>

      {/* Main Showcase Layout (Chat Window + Interactive Sticker Drawer) */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] shadow-2xl overflow-hidden">
        {/* WhatsApp Chat App Bar */}
        <div className="bg-[#075E54] dark:bg-[#1f2c34] px-4 py-3 text-white flex items-center justify-between border-b border-emerald-800/30">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#25D366] to-[#128C7E] text-slate-950 font-black text-sm shadow-md">
              ⚡
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#25D366] ring-2 ring-[#075E54]" />
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white leading-tight">
                Squad Memes 2026 🔥
              </h3>
              <p className="text-[11px] text-emerald-200 dark:text-slate-400">
                Sarah, Alex, Marcus, You
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <Video className="h-4 w-4 hover:text-white cursor-pointer" />
            <Phone className="h-4 w-4 hover:text-white cursor-pointer" />
            <MoreVertical className="h-4 w-4 hover:text-white cursor-pointer" />
          </div>
        </div>

        {/* WhatsApp Chat Wallpaper Body */}
        <div
          className="relative min-h-[380px] sm:min-h-[420px] p-4 sm:p-6 flex flex-col justify-end gap-3.5 overflow-y-auto transition-colors"
          style={{
            backgroundColor: chatTheme === "dark" ? "#0b141a" : "#efeae2",
            backgroundImage:
              chatTheme === "dark"
                ? "radial-gradient(#1e2b33 1px, transparent 1px)"
                : "radial-gradient(#dcd5cb 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          {/* Wallpaper Date Badge */}
          <div className="self-center rounded-lg bg-black/40 dark:bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200 backdrop-blur-md">
            Today
          </div>

          {/* Messages Stream */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${
                  msg.sender === "me" ? "items-end" : "items-start"
                }`}
              >
                {/* Sender Name if incoming text */}
                {msg.sender === "them" && (
                  <span className="text-[10px] font-bold text-[#25D366] px-2 mb-0.5">
                    {msg.senderName}
                  </span>
                )}

                {msg.type === "text" ? (
                  /* Standard WhatsApp Text Bubble */
                  <div
                    className={`relative max-w-[80%] sm:max-w-md rounded-2xl px-3.5 py-2 text-xs sm:text-sm shadow-md ${
                      msg.sender === "me"
                        ? "bg-[#005c4b] text-white rounded-tr-none"
                        : chatTheme === "dark"
                        ? "bg-[#202c33] text-slate-100 rounded-tl-none"
                        : "bg-white text-slate-900 rounded-tl-none"
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                      <span>{msg.time}</span>
                      {msg.sender === "me" && (
                        <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                      )}
                    </div>

                    {/* Reactions Bar */}
                    {msg.reactions.length > 0 && (
                      <div className="absolute -bottom-2 right-2 flex items-center gap-0.5 rounded-full bg-slate-900/90 border border-white/20 px-1.5 py-0.5 shadow-md">
                        {msg.reactions.map((r, i) => (
                          <span key={i} className="text-[10px]">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* WhatsApp Die-Cut Sticker Display (No Bubble Box, Floating Die-Cut) */
                  <div className="relative group flex flex-col items-end">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative cursor-pointer"
                      onClick={() => handleToggleReaction(msg.id, "❤️")}
                    >
                      {/* Crisp 8px Die-Cut White Border and WhatsApp Drop Shadow */}
                      <div
                        className="relative flex items-center justify-center p-2"
                        style={{
                          filter:
                            "drop-shadow(0px 0px 8px #FFFFFF) drop-shadow(0px 10px 20px rgba(0,0,0,0.6))",
                        }}
                      >
                        <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 flex flex-col items-center justify-center shadow-inner">
                          <span className="text-5xl sm:text-6xl select-none">
                            {msg.stickerEmoji}
                          </span>
                          <span className="mt-1 rounded-full bg-black/80 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                            {msg.stickerTitle}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Floating Reactions Pill */}
                      <div className="absolute -bottom-1 right-2 flex items-center gap-1 rounded-full bg-black/80 border border-white/20 px-2 py-0.5 text-[11px] shadow-lg backdrop-blur-md">
                        {msg.reactions.map((r, i) => (
                          <span key={i}>{r}</span>
                        ))}
                        <div className="flex items-center gap-1 text-[10px] text-slate-300 ml-1">
                          <span>{msg.time}</span>
                          <CheckCheck className="h-3 w-3 text-[#53bdeb]" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Emoji Reaction Quick Bar on Hover / Tap */}
                    <div className="mt-1 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                      {["❤️", "😂", "🔥", "🥑"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className="h-6 w-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-xs transition-transform hover:scale-125 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Interactive Sticker Drawer & Send Tray */}
        <div className="border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1f2c34] p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
              <span className="font-['Space_Grotesk'] text-xs font-bold text-slate-800 dark:text-slate-200">
                Tap Any Sticker to Send into Live Chat:
              </span>
            </div>

            <button
              type="button"
              onClick={onStartPack}
              className="text-xs font-bold text-[#25D366] hover:underline font-['Space_Grotesk'] cursor-pointer"
            >
              Create My Own Pack ➔
            </button>
          </div>

          {/* Sticker Tray Carousel / Grid */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {trayStickers.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSendSticker(s)}
                className="group flex flex-col items-center justify-center min-w-[72px] h-20 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] p-2 shadow-sm hover:border-[#25D366] hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {s.emoji}
                </span>
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[64px] mt-1 font-['Space_Grotesk']">
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
