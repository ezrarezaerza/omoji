"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Layers,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Palette,
  Sliders,
  Check,
  Send,
  Plus,
  RefreshCw,
} from "lucide-react";

interface WorkflowStepperProps {
  onStartPack: () => void;
  onOpenCanvas: () => void;
}

export function WorkflowStepper({ onStartPack, onOpenCanvas }: WorkflowStepperProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  // Step 1 interactive demo state
  const [step1CutoutActive, setStep1CutoutActive] = useState<boolean>(true);
  const [step1BorderThickness, setStep1BorderThickness] = useState<number>(8);
  const [sampleType, setSampleType] = useState<"dog" | "flower">("dog");

  // Step 2 interactive demo state (slots filled simulation)
  const [filledSlotsCount, setFilledSlotsCount] = useState<number>(12);

  // Step 3 interactive demo state
  const [whatsappAdded, setWhatsappAdded] = useState<boolean>(false);

  const steps = [
    {
      stepNumber: 1,
      title: "AI Neural Cutout & Die-Cut Styling",
      shortTitle: "AI Cutout & Styling",
      tagline: "Instant subject isolation with crisp WhatsApp die-cut outlines",
      icon: Zap,
      accentColor: "#25D366",
    },
    {
      stepNumber: 2,
      title: "Pack Organization & Quality Check",
      shortTitle: "Pack Organization",
      tagline: "Organize custom sticker packs with automatic size and quality checks",
      icon: Layers,
      accentColor: "#8A2BE2",
    },
    {
      stepNumber: 3,
      title: "1-Tap Export to WhatsApp",
      shortTitle: "Export to WhatsApp",
      tagline: "Effortlessly export and use your stickers in WhatsApp chats",
      icon: Smartphone,
      accentColor: "#00E5FF",
    },
  ];

  return (
    <section className="relative w-full py-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#25D366] font-['Space_Grotesk']">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Linear Creation Journey</span>
          </div>
          <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mt-1">
            How OMOJI Works in 3 Clear Steps
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Explore the interactive preview below to see how raw photos transform into custom WhatsApp sticker packs ready to send.
        </p>
      </div>

      {/* Stepper Navigation Pills / Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-[#111b21] mb-8">
        {steps.map((s) => {
          const isCurrent = activeStep === s.stepNumber;
          const isDone = activeStep > s.stepNumber;
          const Icon = s.icon;

          return (
            <button
              key={s.stepNumber}
              type="button"
              onClick={() => setActiveStep(s.stepNumber)}
              className={`flex-1 flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all font-['Space_Grotesk'] text-left cursor-pointer ${
                isCurrent
                  ? "bg-white dark:bg-white/10 text-slate-950 dark:text-white shadow-sm border border-slate-200 dark:border-white/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shrink-0 transition-colors ${
                    isCurrent
                      ? "bg-[#25D366] text-slate-950"
                      : isDone
                      ? "bg-emerald-500/20 text-[#25D366]"
                      : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : `0${s.stepNumber}`}
                </span>
                <div className="truncate">
                  <span className="block text-xs font-bold leading-tight truncate">
                    {s.shortTitle}
                  </span>
                  <span className="hidden lg:block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {s.stepNumber === 1 ? "Auto Cutout" : s.stepNumber === 2 ? "Custom Pack" : "Export & Chat"}
                  </span>
                </div>
              </div>

              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isCurrent ? "text-[#25D366]" : "text-slate-400 dark:text-slate-500"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Active Step Content Container (Linear 2-Column Split: Explanation + Interactive Sandbox) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] p-6 sm:p-8 lg:p-10 shadow-xl"
        >
          {activeStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Descriptive Text & Features */}
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-[#25D366] font-['Space_Grotesk'] mb-3">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Step 01 / Studio Processing</span>
                  </div>
                  <h3 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    One-Click Neural Cutout &amp; Die-Cut Outline
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Upload any photo or meme from your camera roll. Our in-browser AI model isolates the subject without sending private imagery to external cloud servers. Then, apply an authentic WhatsApp die-cut white outline to guarantee contrast against dark and custom chat wallpapers.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-900 dark:text-white">Client-Side Privacy:</strong> Zero image telemetry. All AI segmentation runs securely inside your device browser.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-900 dark:text-white">Adjustable Die-Cut Stroke:</strong> Choose from 4px to 12px crisp white borders to match WhatsApp official sticker guidelines.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-900 dark:text-white">Meme &amp; Text Layers:</strong> Add bold Impact or Space Grotesk captions with automatic text wrapping.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={onOpenCanvas}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 font-['Space_Grotesk'] text-xs font-black text-slate-950 shadow-md hover:bg-[#20bd5a] transition-all cursor-pointer"
                  >
                    <span>Test In Canvas Editor</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="inline-flex items-center gap-1.5 font-['Space_Grotesk'] text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>Next: Sticker Pack</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive Sandbox */}
              <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-['Space_Grotesk'] text-slate-700 dark:text-slate-300">
                      Live Cutout Sandbox
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-[#25D366]">
                      Real Photo
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Switch between Real Puppy and Real Flower */}
                    <div className="inline-flex items-center rounded-lg bg-slate-200/80 dark:bg-white/10 p-0.5 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setSampleType("dog")}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          sampleType === "dog"
                            ? "bg-white dark:bg-[#182229] text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        🐶 Golden Pup
                      </button>
                      <button
                        type="button"
                        onClick={() => setSampleType("flower")}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          sampleType === "flower"
                            ? "bg-white dark:bg-[#182229] text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        🌸 Sunflower
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep1CutoutActive(!step1CutoutActive)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-['Space_Grotesk'] transition-all cursor-pointer ${
                        step1CutoutActive
                          ? "bg-[#25D366] text-slate-950 font-black"
                          : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {step1CutoutActive ? "AI Cutout ON" : "Original Photo"}
                    </button>
                  </div>
                </div>

                {/* Display Canvas with Checkerboard */}
                <div
                  className="relative aspect-square max-h-[300px] w-full mx-auto rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10"
                  style={{
                    backgroundColor: step1CutoutActive ? "#1e2428" : "#0f172a",
                    backgroundImage: step1CutoutActive
                      ? "linear-gradient(45deg, #252d32 25%, transparent 25%), linear-gradient(-45deg, #252d32 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #252d32 75%), linear-gradient(-45deg, transparent 75%, #252d32 75%)"
                      : "none",
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  }}
                >
                  <motion.div
                    key={`${sampleType}-${step1CutoutActive}`}
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="relative flex items-center justify-center"
                  >
                    <svg
                      viewBox="0 0 512 512"
                      className="w-48 h-48 sm:w-56 sm:h-56 overflow-visible"
                    >
                      <defs>
                        <clipPath id="dog-photo-cutout-clip">
                          <path d="M 195 95 C 135 80, 80 150, 110 235 C 120 265, 140 305, 160 355 C 190 425, 322 425, 352 355 C 372 305, 392 265, 402 235 C 432 150, 377 80, 317 95 C 285 70, 227 70, 195 95 Z" />
                        </clipPath>
                        <clipPath id="flower-photo-cutout-clip">
                          <path d="M 256 65 C 275 115, 315 95, 345 118 C 375 138, 380 178, 415 190 C 450 202, 445 240, 452 270 C 460 300, 425 330, 425 365 C 425 405, 375 408, 345 428 C 315 448, 275 428, 256 455 C 237 428, 197 448, 167 428 C 137 408, 87 405, 87 365 C 87 330, 52 300, 60 270 C 67 240, 62 202, 97 190 C 132 178, 137 138, 167 118 C 197 95, 237 115, 256 65 Z" />
                        </clipPath>
                        <clipPath id="square-raw-photo-clip">
                          <rect width="480" height="480" rx="36" x="16" y="16" />
                        </clipPath>
                        <filter id="sticker-diecut-shadow" x="-30%" y="-30%" width="160%" height="160%">
                          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#000000" floodOpacity="0.6" />
                        </filter>
                      </defs>

                      {!step1CutoutActive ? (
                        /* RAW CAMERA PHOTO VIEW */
                        <g>
                          <rect x="16" y="16" width="480" height="480" rx="36" fill="#1e293b" />
                          <g clipPath="url(#square-raw-photo-clip)">
                            <image
                              href={
                                sampleType === "dog"
                                  ? "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=700&q=80"
                                  : "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=700&q=80"
                              }
                              x="16"
                              y="16"
                              width="480"
                              height="480"
                              preserveAspectRatio="xMidYMid slice"
                            />
                          </g>
                          <rect
                            x="16"
                            y="16"
                            width="480"
                            height="480"
                            rx="36"
                            fill="none"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="3"
                          />
                        </g>
                      ) : (
                        /* ISOLATED REAL PHOTO STICKER WITH DIE-CUT OUTLINE */
                        <g filter="url(#sticker-diecut-shadow)">
                          {/* Die-Cut White Outline Backing Layer */}
                          {step1BorderThickness > 0 && (
                            <path
                              d={
                                sampleType === "dog"
                                  ? "M 195 95 C 135 80, 80 150, 110 235 C 120 265, 140 305, 160 355 C 190 425, 322 425, 352 355 C 372 305, 392 265, 402 235 C 432 150, 377 80, 317 95 C 285 70, 227 70, 195 95 Z"
                                  : "M 256 65 C 275 115, 315 95, 345 118 C 375 138, 380 178, 415 190 C 450 202, 445 240, 452 270 C 460 300, 425 330, 425 365 C 425 405, 375 408, 345 428 C 315 448, 275 428, 256 455 C 237 428, 197 448, 167 428 C 137 408, 87 405, 87 365 C 87 330, 52 300, 60 270 C 67 240, 62 202, 97 190 C 132 178, 137 138, 167 118 C 197 95, 237 115, 256 65 Z"
                              }
                              fill="#FFFFFF"
                              stroke="#FFFFFF"
                              strokeWidth={step1BorderThickness * 2}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          )}

                          {/* Clipped Real Photograph */}
                          <g
                            clipPath={
                              sampleType === "dog"
                                ? "url(#dog-photo-cutout-clip)"
                                : "url(#flower-photo-cutout-clip)"
                            }
                          >
                            <image
                              href={
                                sampleType === "dog"
                                  ? "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=700&q=80"
                                  : "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=700&q=80"
                              }
                              x="16"
                              y="16"
                              width="480"
                              height="480"
                              preserveAspectRatio="xMidYMid slice"
                            />
                          </g>
                        </g>
                      )}
                    </svg>

                    {step1CutoutActive ? (
                      <span className="absolute -bottom-2 rounded-full bg-black/85 px-3 py-1 font-['Space_Grotesk'] text-[11px] font-black uppercase tracking-wider text-white shadow-lg border border-white/20 backdrop-blur-xs">
                        {sampleType === "dog" ? "REAL PUPPY • 512×512" : "REAL SUNFLOWER • 512×512"}
                      </span>
                    ) : (
                      <span className="absolute -bottom-2 rounded-full bg-slate-900/90 px-3 py-1 font-['Space_Grotesk'] text-[11px] font-bold text-slate-300 shadow-lg border border-white/10 backdrop-blur-xs">
                        📸 RAW PHOTO (WITH BACKGROUND)
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* Die-Cut Thickness Controls */}
                <div className="mt-4 flex items-center justify-between gap-3 bg-white dark:bg-[#1a2329] p-3 rounded-xl border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Palette className="h-4 w-4 text-[#25D366]" />
                    <span>White Die-Cut Outline:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[0, 4, 8, 12].map((thickness) => (
                      <button
                        key={thickness}
                        type="button"
                        onClick={() => {
                          setStep1BorderThickness(thickness);
                          setStep1CutoutActive(true);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-['Space_Grotesk'] font-bold cursor-pointer transition-all ${
                          step1BorderThickness === thickness && step1CutoutActive
                            ? "bg-[#25D366] text-slate-950 font-black"
                            : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {thickness === 0 ? "Off" : `${thickness}px`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column */}
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-bold text-purple-400 font-['Space_Grotesk'] mb-3">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Step 02 / Pack Management</span>
                  </div>
                  <h3 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    Pack Organization &amp; Quality Check
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    WhatsApp sticker packs can hold up to 30 custom stickers with a cover icon and title. OMOJI automatically optimizes each sticker so they load fast and look ultra-crisp in every chat.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-900 dark:text-white">Flexible Sticker Grid:</strong> Add up to 30 stickers with ease. The visual counter keeps you informed of your pack progress.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-900 dark:text-white">Pack Cover Icon:</strong> Automatically select any sticker or upload a custom image for your WhatsApp sticker drawer.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-900 dark:text-white">Smart Quality Optimization:</strong> High resolution with tiny file sizes guaranteeing lightning-fast delivery in chats.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={onStartPack}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 font-['Space_Grotesk'] text-xs font-black text-slate-950 shadow-md hover:bg-[#20bd5a] transition-all cursor-pointer"
                  >
                    <span>Create Sticker Pack</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="inline-flex items-center gap-1.5 font-['Space_Grotesk'] text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>Next: 1-Tap Transfer</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive 30-Slot Pack Mockup */}
              <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-xs">
                      🐾
                    </div>
                    <div>
                      <h4 className="font-['Space_Grotesk'] text-xs font-black text-slate-900 dark:text-white">
                        Squad Memes 2026
                      </h4>
                      <span className="text-[11px] text-slate-500">by @creative_dev</span>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-[#25D366] font-['Space_Grotesk']">
                    {filledSlotsCount}/30 Ready
                  </span>
                </div>

                {/* 30-Slot Mini Grid */}
                <div className="grid grid-cols-6 gap-2 p-3 rounded-xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-white/5">
                  {Array.from({ length: 18 }).map((_, idx) => {
                    const isFilled = idx < filledSlotsCount;
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all border ${
                          isFilled
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-300 shadow-sm"
                            : "bg-slate-100 dark:bg-white/5 border-dashed border-slate-300 dark:border-white/10 text-slate-400"
                        }`}
                      >
                        {isFilled ? (
                          <span>{["🐶", "🔥", "✨", "🚀", "😂", "😎", "💯", "🎉", "👑", "🥑", "⚡", "🌮", "🍕", "🎮", "🌟", "🐱", "🏆", "❤️"][idx % 18]}</span>
                        ) : (
                          <span>+{idx + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Interactive Simulator Controls */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-['Space_Grotesk']">
                    Simulate slot filling:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[5, 12, 20, 30].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFilledSlotsCount(num)}
                        className={`px-2 py-1 rounded-lg text-xs font-['Space_Grotesk'] font-bold cursor-pointer transition-all ${
                          filledSlotsCount === num
                            ? "bg-purple-500 text-white"
                            : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {num} slots
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column */}
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400 font-['Space_Grotesk'] mb-3">
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Step 03 / WhatsApp Export</span>
                  </div>
                  <h3 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    1-Tap Export to WhatsApp
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Designed specifically for fast sticker exports to WhatsApp. In just moments, add your newly crafted stickers straight to your WhatsApp chats on any device with zero hassle.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-900 dark:text-white">WhatsApp Integration:</strong> Direct support for standard WhatsApp and WhatsApp Business.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-900 dark:text-white">Instant Keyboard Access:</strong> Your pack instantly appears in your WhatsApp sticker tray.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-900 dark:text-white">Cross-Device Access:</strong> Create on desktop and easily transfer your stickers to your phone with a quick QR scan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={onStartPack}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 font-['Space_Grotesk'] text-xs font-black text-slate-950 shadow-md hover:bg-[#20bd5a] transition-all cursor-pointer"
                  >
                    <span>Start Your Pack Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="inline-flex items-center gap-1.5 font-['Space_Grotesk'] text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Step 1</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive Android Dialog Simulator */}
              <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 p-5 flex flex-col items-center">
                <span className="text-xs font-bold font-['Space_Grotesk'] text-slate-700 dark:text-slate-300 self-start mb-4">
                  Android Native WhatsApp Handoff Preview
                </span>

                {/* Simulated Android Screen / Dialog */}
                <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1f2c34] border border-slate-300 dark:border-white/10 shadow-2xl overflow-hidden">
                  {/* Android Dialog Header */}
                  <div className="bg-[#075E54] dark:bg-[#128C7E] px-4 py-3 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-[#25D366] flex items-center justify-center text-slate-950 text-xs font-bold">
                        WA
                      </div>
                      <span className="font-['Space_Grotesk'] text-xs font-bold">WhatsApp</span>
                    </div>
                    <span className="text-[10px] text-emerald-100">Android Intent</span>
                  </div>

                  {/* Dialog Body */}
                  <div className="p-5 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/20 text-[#25D366]">
                      <Smartphone className="h-7 w-7" />
                    </div>

                    <h4 className="font-['Space_Grotesk'] text-base font-black text-slate-900 dark:text-white">
                      Would you like to add &quot;Squad Memes 2026&quot; to WhatsApp?
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Pack contains 18 stickers • 1.2 MB total
                    </p>

                    {/* Mini Sticker Previews in Dialog */}
                    <div className="mt-4 flex items-center justify-center gap-2">
                      {["🐶", "🔥", "✨", "🥑"].map((emoji, idx) => (
                        <div
                          key={idx}
                          className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-[#111b21] border border-slate-200 dark:border-white/10 flex items-center justify-center text-lg shadow-sm"
                        >
                          {emoji}
                        </div>
                      ))}
                    </div>

                    {/* Dialog Buttons */}
                    <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setWhatsappAdded(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        CANCEL
                      </button>

                      <button
                        type="button"
                        onClick={() => setWhatsappAdded(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-black font-['Space_Grotesk'] cursor-pointer transition-all ${
                          whatsappAdded
                            ? "bg-emerald-600 text-white"
                            : "bg-[#25D366] text-slate-950 hover:bg-[#20bd5a]"
                        }`}
                      >
                        {whatsappAdded ? "ADDED TO WHATSAPP ✓" : "ADD (1-TAP)"}
                      </button>
                    </div>

                    {whatsappAdded && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-xs font-bold text-[#25D366] font-['Space_Grotesk']"
                      >
                        🎉 Added! Open WhatsApp to send your new stickers.
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
