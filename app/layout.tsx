import React, { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "../src/context/ThemeContext";

// Minimal HeroUI / NextUI Provider wrapper compatible with App Router & React 19
export function HeroUIProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <div className="heroui-theme min-h-screen text-foreground antialiased selection:bg-[#25D366] selection:text-black">
        {children}
      </div>
    </ThemeProvider>
  );
}

export const metadata = {
  title: "Omoji - Sticker Studio | WhatsApp Sticker Maker",
  description: "Turn your photos and memes into fun custom WhatsApp stickers with instant background magic and vibrant outlines.",
  manifest: "/manifest.json",
  themeColor: "#0b141a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Omoji",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b141a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Omoji" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Bangers&family=Fredoka:wght@600;700&family=Permanent+Marker&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="relative min-h-screen overflow-x-hidden bg-[#0b141a] dark:bg-[#0b141a] light:bg-[#f0f2f5] text-white dark:text-white light:text-[#111b21]">
        <HeroUIProvider>
          {/* Grainy Noise Overlay */}
          <div 
            id="grainy-overlay"
            className="pointer-events-none fixed inset-0 z-0 bg-grainy opacity-40 dark:opacity-40 light:opacity-20 mix-blend-overlay" 
            aria-hidden="true"
          />

          {/* Ambient blurred glowing blobs for depth */}
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-emerald-600/20 dark:bg-emerald-600/20 light:bg-emerald-400/25 blur-[120px]" />
            <div className="absolute -right-40 top-1/4 h-[550px] w-[550px] rounded-full bg-teal-600/15 dark:bg-teal-600/15 light:bg-teal-300/30 blur-[140px]" />
            <div className="absolute bottom-0 left-1/3 h-[450px] w-[450px] rounded-full bg-green-500/15 dark:bg-green-500/15 light:bg-emerald-300/20 blur-[130px]" />
          </div>

          {/* Main Content Area */}
          <main className="relative z-10 min-h-screen flex flex-col">
            {children}
          </main>
        </HeroUIProvider>
      </body>
    </html>
  );
}
