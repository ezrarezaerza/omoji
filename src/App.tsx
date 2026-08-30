import React from "react";
import HomePage from "../app/page";
import { HeroUIProvider } from "../app/layout";

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0b0914] text-white">
      <HeroUIProvider>
        {/* Grainy Noise Overlay sitting over background but behind content */}
        <div 
          id="grainy-overlay"
          className="pointer-events-none fixed inset-0 z-0 bg-grainy opacity-40 mix-blend-overlay" 
          aria-hidden="true"
        />

        {/* Ambient blurred glowing blobs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-purple-600/25 blur-[120px]" />
          <div className="absolute -right-40 top-1/4 h-[550px] w-[550px] rounded-full bg-orange-600/20 blur-[140px]" />
          <div className="absolute bottom-0 left-1/3 h-[450px] w-[450px] rounded-full bg-pink-600/20 blur-[130px]" />
        </div>

        {/* Main Content Area */}
        <main className="relative z-10 min-h-screen flex flex-col">
          <HomePage />
        </main>
      </HeroUIProvider>
    </div>
  );
}
