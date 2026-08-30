/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "blob.vercel-storage.com",
      },
    ],
  },
};

// PWA Configuration using @ducanh2912/next-pwa
const withPWAConfig = async () => {
  try {
    const withPWA = (await import("@ducanh2912/next-pwa")).default({
      dest: "public",
      disable: process.env.NODE_ENV === "development",
      register: true,
      skipWaiting: true,
      cacheOnFrontEndNav: true,
      aggressiveFrontEndNavCaching: true,
      reloadOnOnline: true,
      workboxOptions: {
        disableDevLogs: true,
      },
    });
    return withPWA(nextConfig);
  } catch {
    // Graceful fallback if next-pwa wrapper runs in custom compiler
    return nextConfig;
  }
};

export default withPWAConfig();
