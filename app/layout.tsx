import React, { ReactNode } from "react";
import "./globals.css";

// Minimal HeroUI / NextUI Provider wrapper compatible with App Router & React 19
export function HeroUIProvider({ children }: { children: ReactNode }) {
  return (
    <div className="heroui-theme dark min-h-screen text-foreground antialiased selection:bg-orange-500 selection:text-white">
      {children}
    </div>
  );
}

export const metadata = {
  title: "Omoji - Sticker Studio | WhatsApp Sticker Maker",
  description: "Turn your photos and memes into fun custom WhatsApp stickers with instant background magic and vibrant outlines.",
  manifest: "/manifest.json",
  themeColor: "#0b0914",
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
        <meta name="theme-color" content="#0b0914" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Omoji" />
      </head>
      <body className="relative min-h-screen overflow-x-hidden bg-[#0b0914] text-white">
        <HeroUIProvider>
          {/* Grainy Noise Overlay sitting over background but behind content */}
          <div 
            id="grainy-overlay"
            className="pointer-events-none fixed inset-0 z-0 bg-grainy opacity-40 mix-blend-overlay" 
            aria-hidden="true"
          />

          {/* Decorative ambient blurred glowing blobs for depth */}
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-purple-600/25 blur-[120px]" />
            <div className="absolute -right-40 top-1/4 h-[550px] w-[550px] rounded-full bg-orange-600/20 blur-[140px]" />
            <div className="absolute bottom-0 left-1/3 h-[450px] w-[450px] rounded-full bg-pink-600/20 blur-[130px]" />
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
