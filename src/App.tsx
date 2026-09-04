import React from "react";
import HomePage from "../app/page";
import { HeroUIProvider } from "../app/layout";
import { PWAInstallBanner } from "../components/PWAInstallBanner";

export default function App() {
  return (
    <HeroUIProvider>
      <div className="relative min-h-screen overflow-x-hidden transition-colors duration-300">
        {/* Grainy Noise Overlay sitting over background but behind content */}
        <div 
          id="grainy-overlay"
          className="pointer-events-none fixed inset-0 z-0 bg-grainy opacity-40 dark:opacity-40 light:opacity-20 mix-blend-overlay" 
          aria-hidden="true"
        />

        {/* Ambient blurred glowing blobs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-emerald-600/20 dark:bg-emerald-600/20 light:bg-emerald-400/25 blur-[120px]" />
          <div className="absolute -right-40 top-1/4 h-[550px] w-[550px] rounded-full bg-teal-600/15 dark:bg-teal-600/15 light:bg-teal-300/30 blur-[140px]" />
          <div className="absolute bottom-0 left-1/3 h-[450px] w-[450px] rounded-full bg-green-500/15 dark:bg-green-500/15 light:bg-emerald-300/20 blur-[130px]" />
        </div>

        {/* PWA Mobile Offline & Install Prompt Engine */}
        <PWAInstallBanner />

        {/* Main Content Area */}
        <main className="relative z-10 min-h-screen flex flex-col">
          <HomePage />
        </main>
      </div>
    </HeroUIProvider>
  );
}
