/**
 * Creator Profile & Social Ecosystem Engine
 * Manages creator dossiers, statistics, badge systems, social links, and pack associations.
 */

import { DetailedCreatorProfile, CreatorBadge } from "../src/types/creator";
import { ExplorePack, ExploreSticker } from "../src/types/explore";
import { getAllExplorePacks } from "./exploreEngine";
import { getAllFollowedCreatorUsernames, isCreatorFollowed, toggleFollowCreator } from "./exploreDb";

// Reusable standard creator badges
export const CREATOR_BADGES: Record<string, CreatorBadge> = {
  verified: {
    id: "badge-verified",
    label: "Verified Artist",
    icon: "BadgeCheck",
    description: "Official verified sticker artist recognized by the Omoji community",
    colorClass: "text-blue-500 fill-blue-500/20",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/20",
  },
  trending: {
    id: "badge-trending",
    label: "Trending Maker",
    icon: "Flame",
    description: "Packs currently dominating group chats and trending lists",
    colorClass: "text-orange-500 fill-orange-500/20",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/20",
  },
  og: {
    id: "badge-og",
    label: "OG Contributor",
    icon: "Zap",
    description: "Early ecosystem creator who contributed founding sticker collections",
    colorClass: "text-amber-500 fill-amber-500/20",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
  },
  meme_king: {
    id: "badge-meme-king",
    label: "Meme Maestro",
    icon: "Crown",
    description: "Master of dank internet lore and viral cultural moments",
    colorClass: "text-purple-500 fill-purple-500/20",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/20",
  },
  animator: {
    id: "badge-animator",
    label: "Motion Specialist",
    icon: "Sparkles",
    description: "Expert in high-frame-rate animated WebP stickers",
    colorClass: "text-pink-500 fill-pink-500/20",
    bgClass: "bg-pink-500/10",
    borderClass: "border-pink-500/20",
  },
  daily_craft: {
    id: "badge-daily-craft",
    label: "Cozy Aesthetic",
    icon: "Coffee",
    description: "Renowned for soft color palettes and soothing lifestyle stickers",
    colorClass: "text-emerald-500 fill-emerald-500/20",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
  },
};

// Curated verified creator dossiers
export const CURATED_CREATORS: Record<string, DetailedCreatorProfile> = {
  cyberpixel: {
    id: "creator-cyberpix",
    name: "CyberPixel Art",
    username: "cyberpixel",
    avatarUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80",
    bannerGradient: ["#6366F1", "#A855F7"],
    bio: "Cyberpunk retro-futurism and 16-bit neon pixel emojis. Crafting high-contrast digital stickers for the modern metaverse.",
    verified: true,
    joinedDate: "October 2024",
    location: "Tokyo / Cyberspace",
    specialtyTag: "Pixel Art & Cyberpunk",
    badges: [CREATOR_BADGES.verified, CREATOR_BADGES.trending, CREATOR_BADGES.og],
    socialLinks: {
      twitter: "https://x.com/cyberpixel_art",
      instagram: "https://instagram.com/cyberpixel.stickers",
      website: "https://cyberpixel.art",
      tipLink: "https://buymeacoffee.com/cyberpixel",
    },
    stats: {
      followersCount: 14200,
      totalDownloads: 145000,
      totalLikes: 42100,
      packsCount: 1,
      viralityScore: 98,
    },
    featuredPackId: "pack-cyberpunk-pixels",
  },
  meme_lord: {
    id: "creator-meme-overlord",
    name: "Meme Overlord",
    username: "meme_lord",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
    bannerGradient: ["#E11D48", "#881337"],
    bio: "Certified Internet Culture Historian. Curating and illustrating the highest quality Chad, Doge, and viral reaction stickers.",
    verified: true,
    joinedDate: "August 2024",
    location: "Everywhere Online",
    specialtyTag: "Viral & Dank Memes",
    badges: [CREATOR_BADGES.verified, CREATOR_BADGES.meme_king, CREATOR_BADGES.trending],
    socialLinks: {
      twitter: "https://x.com/the_meme_lord",
      instagram: "https://instagram.com/memelord.official",
      website: "https://memelord.fun",
      tipLink: "https://buymeacoffee.com/memelord",
    },
    stats: {
      followersCount: 28900,
      totalDownloads: 230000,
      totalLikes: 68500,
      packsCount: 1,
      viralityScore: 99,
    },
    featuredPackId: "pack-gigachad-memes",
  },
  archive_memes: {
    id: "creator-vintage-memes",
    name: "Internet Archive Memes",
    username: "archive_memes",
    avatarUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&auto=format&fit=crop&q=80",
    bannerGradient: ["#D97706", "#78350F"],
    bio: "Archiving the golden era of Web 1.0 & 2.0. Derp, Trollface, Forever Alone, and the timeless rage comics that started it all.",
    verified: true,
    joinedDate: "December 2024",
    location: "Internet WayBack Machine",
    specialtyTag: "Vintage Internet Nostalgia",
    badges: [CREATOR_BADGES.verified, CREATOR_BADGES.og],
    socialLinks: {
      twitter: "https://x.com/web_archive_memes",
      website: "https://archive.org",
    },
    stats: {
      followersCount: 8400,
      totalDownloads: 92000,
      totalLikes: 25400,
      packsCount: 1,
      viralityScore: 88,
    },
    featuredPackId: "pack-rage-comics",
  },
  feels_good: {
    id: "creator-wojak-lab",
    name: "Feels Good Studios",
    username: "feels_good",
    avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80",
    bannerGradient: ["#15803D", "#166534"],
    bio: "Illustrating the emotional spectrum of modern life through frog philosopher portraits and relatable Wojak archetypes.",
    verified: false,
    joinedDate: "January 2025",
    location: "The Lily Pad",
    specialtyTag: "Wojaks & Reaction Comics",
    badges: [CREATOR_BADGES.meme_king],
    socialLinks: {
      twitter: "https://x.com/feels_good_art",
    },
    stats: {
      followersCount: 6200,
      totalDownloads: 64000,
      totalLikes: 19800,
      packsCount: 1,
      viralityScore: 84,
    },
    featuredPackId: "pack-pepe-wojaks",
  },
  paw_loaf: {
    id: "creator-paw-paradise",
    name: "Paw & Loaf Studio",
    username: "paw_loaf",
    avatarUrl: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=200&auto=format&fit=crop&q=80",
    bannerGradient: ["#F43F5E", "#BE123C"],
    bio: "Dedicated to the noble art of pet loafing. Corgi booties, golden retriever smiles, and paws of pure dopamine for WhatsApp.",
    verified: true,
    joinedDate: "September 2024",
    location: "Seattle, WA",
    specialtyTag: "Corgis & Cute Dogs",
    badges: [CREATOR_BADGES.verified, CREATOR_BADGES.trending, CREATOR_BADGES.daily_craft],
    socialLinks: {
      instagram: "https://instagram.com/pawandloaf",
      twitter: "https://x.com/paw_loaf",
      tipLink: "https://buymeacoffee.com/pawloaf",
    },
    stats: {
      followersCount: 19800,
      totalDownloads: 165000,
      totalLikes: 53200,
      packsCount: 1,
      viralityScore: 96,
    },
    featuredPackId: "pack-corgi-loafs",
  },
  purrcafe: {
    id: "creator-purr-cafe",
    name: "Purr Cafe Art",
    username: "purrcafe",
    avatarUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80",
    bannerGradient: ["#DB2777", "#9D174D"],
    bio: "Warm tea, purring cats, and mischievous kittens. Drawing feline chaotic energy and peaceful naps one sticker at a time.",
    verified: true,
    joinedDate: "November 2024",
    location: "Kyoto / Paris",
    specialtyTag: "Cats & Kittens",
    badges: [CREATOR_BADGES.verified, CREATOR_BADGES.daily_craft],
    socialLinks: {
      instagram: "https://instagram.com/purrcafe_stickers",
      website: "https://purrcafe.design",
    },
    stats: {
      followersCount: 22100,
      totalDownloads: 180000,
      totalLikes: 61000,
      packsCount: 1,
      viralityScore: 97,
    },
    featuredPackId: "pack-cute-kittens",
  },
  typelab: {
    id: "creator-bubble-type",
    name: "Type & Drop Lab",
    username: "typelab",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    bannerGradient: ["#06B6D4", "#0E7490"],
    bio: "Expressive bold typography stickers. Gen-Z lingo, 3D chrome letters, and punchy comebacks crafted for instant message replies.",
    verified: true,
    joinedDate: "July 2024",
    location: "London / Berlin",
    specialtyTag: "Typography & Slang",
    badges: [CREATOR_BADGES.verified, CREATOR_BADGES.trending, CREATOR_BADGES.og],
    socialLinks: {
      twitter: "https://x.com/typedroplab",
      instagram: "https://instagram.com/typelab.design",
      website: "https://typelab.io",
    },
    stats: {
      followersCount: 16700,
      totalDownloads: 140000,
      totalLikes: 46300,
      packsCount: 1,
      viralityScore: 94,
    },
    featuredPackId: "pack-genz-slang",
  },
  office_drone: {
    id: "creator-office-drone",
    name: "Desk Survival Kit",
    username: "office_drone",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    bannerGradient: ["#3B82F6", "#1E40AF"],
    bio: "Coping with endless Slack pings, calendar invites, and corporate jargon through therapy-by-stickers.",
    verified: true,
    joinedDate: "October 2024",
    location: "Inside a Zoom Meeting",
    specialtyTag: "Office Humor & Work Vibes",
    badges: [CREATOR_BADGES.verified, CREATOR_BADGES.trending],
    socialLinks: {
      twitter: "https://x.com/desk_survival",
      website: "https://desksurvival.com",
    },
    stats: {
      followersCount: 18400,
      totalDownloads: 155000,
      totalLikes: 49000,
      packsCount: 1,
      viralityScore: 95,
    },
    featuredPackId: "pack-office-humor",
  },
  sakura_manga: {
    id: "creator-sakura-manga",
    name: "Sakura Manga Studio",
    username: "sakura_manga",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    bannerGradient: ["#F43F5E", "#BE123C"],
    bio: "Manga illustrator drawing high-emotion chibi expressions, glittering kawaii eyes, and dramatic anime reactions.",
    verified: true,
    joinedDate: "September 2024",
    location: "Osaka, Japan",
    specialtyTag: "Chibi & Kawaii Anime",
    badges: [CREATOR_BADGES.verified, CREATOR_BADGES.animator],
    socialLinks: {
      twitter: "https://x.com/sakura_manga_art",
      instagram: "https://instagram.com/sakuramanga.chibi",
      tipLink: "https://buymeacoffee.com/sakuramanga",
    },
    stats: {
      followersCount: 24500,
      totalDownloads: 195000,
      totalLikes: 64200,
      packsCount: 1,
      viralityScore: 97,
    },
    featuredPackId: "pack-kawaii-chibi",
  },
  shonen_blast: {
    id: "creator-shonen-blast",
    name: "Ultra Power Media",
    username: "shonen_blast",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
    bannerGradient: ["#EA580C", "#9A3412"],
    bio: "Power levels over 9,000! Supercharged anime speedlines, dramatic gasps, and fierce battle shonen stickers.",
    verified: true,
    joinedDate: "January 2025",
    location: "Neo Tokyo",
    specialtyTag: "Shonen & Action Drama",
    badges: [CREATOR_BADGES.verified, CREATOR_BADGES.animator],
    socialLinks: {
      twitter: "https://x.com/shonen_blast",
    },
    stats: {
      followersCount: 11200,
      totalDownloads: 88000,
      totalLikes: 29000,
      packsCount: 1,
      viralityScore: 90,
    },
    featuredPackId: "pack-anime-gasps",
  },
  morning_brew: {
    id: "creator-cozy-habit",
    name: "Morning Brew Co.",
    username: "morning_brew",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80",
    bannerGradient: ["#10B981", "#047857"],
    bio: "For the coffee devotees, matcha sippers, and gentle morning risers. Cozy daily moments rendered in warm earthy tones.",
    verified: true,
    joinedDate: "November 2024",
    location: "Portland, OR",
    specialtyTag: "Coffee & Morning Rituals",
    badges: [CREATOR_BADGES.verified, CREATOR_BADGES.daily_craft],
    socialLinks: {
      instagram: "https://instagram.com/morningbrewco",
      website: "https://morningbrew.design",
    },
    stats: {
      followersCount: 13900,
      totalDownloads: 118000,
      totalLikes: 37500,
      packsCount: 1,
      viralityScore: 91,
    },
    featuredPackId: "pack-morning-coffee",
  },
  chill_corner: {
    id: "creator-chill-corner",
    name: "Lazy Weekend Art",
    username: "chill_corner",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    bannerGradient: ["#8B5CF6", "#6D28D9"],
    bio: "Mastering the fine art of staying in bed, binge-watching series, and postponing plans guilt-free.",
    verified: false,
    joinedDate: "February 2025",
    location: "Under a Warm Blanket",
    specialtyTag: "Cozy Lazy Vibes",
    badges: [CREATOR_BADGES.daily_craft],
    socialLinks: {
      twitter: "https://x.com/chillcorner_art",
    },
    stats: {
      followersCount: 7900,
      totalDownloads: 72000,
      totalLikes: 23100,
      packsCount: 1,
      viralityScore: 87,
    },
    featuredPackId: "pack-lazy-weekend",
  },
};

/**
 * Normalizes username for lookups (lowercased, stripped '@')
 */
export function cleanUsername(usernameOrHandle: string): string {
  return (usernameOrHandle || "")
    .toLowerCase()
    .replace(/^@/, "")
    .trim();
}

/**
 * Finds a detailed creator profile by username or id
 */
export async function getCreatorProfile(
  usernameOrId: string
): Promise<DetailedCreatorProfile | null> {
  const norm = cleanUsername(usernameOrId);
  if (!norm) return null;

  // Direct hit in curated database
  if (CURATED_CREATORS[norm]) {
    return CURATED_CREATORS[norm];
  }

  // Check if matches "My Creator Profile"
  const myProf = getMyCreatorProfile();
  if (norm === "me" || norm === cleanUsername(myProf.username) || usernameOrId === myProf.id) {
    return myProf;
  }

  // Look by ID in curated
  for (const creator of Object.values(CURATED_CREATORS)) {
    if (creator.id === usernameOrId || creator.username.toLowerCase() === norm) {
      return creator;
    }
  }

  // If not found in curated, dynamically inspect Explore catalog packs for custom published creators
  try {
    const allPacks = await getAllExplorePacks();
    const matchingPack = allPacks.find(
      (p) =>
        cleanUsername(p.creator.username) === norm ||
        p.creator.id === usernameOrId ||
        p.creator.name.toLowerCase() === norm
    );

    if (matchingPack) {
      const c = matchingPack.creator;
      const creatorPacks = allPacks.filter(
        (p) => cleanUsername(p.creator.username) === norm || p.creator.id === c.id
      );
      const totalDownloads = creatorPacks.reduce((sum, p) => sum + (p.downloadCount || 0), 0);
      const totalLikes = creatorPacks.reduce((sum, p) => sum + (p.likesCount || 0), 0);

      const dynamicProfile: DetailedCreatorProfile = {
        id: c.id,
        name: c.name,
        username: cleanUsername(c.username) || "creator",
        avatarUrl: c.avatarUrl,
        bannerGradient: ["#10B981", "#047857"],
        bio: c.bio || `Community creator on Omoji. Author of ${creatorPacks.length} sticker packs.`,
        verified: Boolean(c.verified),
        joinedDate: "Community Contributor",
        specialtyTag: matchingPack.category,
        badges: c.verified ? [CREATOR_BADGES.verified] : [CREATOR_BADGES.og],
        socialLinks: {},
        stats: {
          followersCount: 150 + creatorPacks.length * 45,
          totalDownloads,
          totalLikes,
          packsCount: creatorPacks.length,
          viralityScore: 85,
        },
        featuredPackId: matchingPack.id,
      };

      return dynamicProfile;
    }
  } catch (err) {
    console.warn("Error synthesizing creator profile:", err);
  }

  return null;
}

/**
 * Returns all creators from both curated and community published packs
 */
export async function getAllCreators(): Promise<DetailedCreatorProfile[]> {
  const list = Object.values(CURATED_CREATORS);
  try {
    const allPacks = await getAllExplorePacks();
    const seenUsernames = new Set(list.map((c) => c.username.toLowerCase()));

    for (const pack of allPacks) {
      const u = cleanUsername(pack.creator.username);
      if (u && !seenUsernames.has(u)) {
        seenUsernames.add(u);
        const dynamic = await getCreatorProfile(u);
        if (dynamic) list.push(dynamic);
      }
    }
  } catch (err) {
    console.warn("getAllCreators error:", err);
  }

  return list;
}

/**
 * Returns top trending creators sorted by virality and downloads
 */
export async function getTrendingCreators(limit: number = 6): Promise<DetailedCreatorProfile[]> {
  const all = await getAllCreators();
  return all
    .sort((a, b) => (b.stats.viralityScore || 0) - (a.stats.viralityScore || 0))
    .slice(0, limit);
}

/**
 * Returns all Explore packs authored by a creator
 */
export async function getCreatorPacks(usernameOrId: string): Promise<ExplorePack[]> {
  const norm = cleanUsername(usernameOrId);
  const allPacks = await getAllExplorePacks();
  return allPacks.filter(
    (p) =>
      cleanUsername(p.creator.username) === norm ||
      p.creator.id === usernameOrId ||
      cleanUsername(p.creator.name) === norm
  );
}

/**
 * Returns all individual stickers authored by a creator across all their packs
 */
export async function getCreatorStickers(usernameOrId: string): Promise<ExploreSticker[]> {
  const packs = await getCreatorPacks(usernameOrId);
  return packs.flatMap((p) => p.stickers);
}

/**
 * Follow / Unfollow helper for a creator
 */
export { isCreatorFollowed, toggleFollowCreator, getAllFollowedCreatorUsernames };

const LS_KEY_MY_CREATOR_PROFILE = "omoji_my_creator_profile";

/**
 * Retrieves the local user's own creator profile, falling back to authenticated credentials or defaults
 */
export function getMyCreatorProfile(): DetailedCreatorProfile {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LS_KEY_MY_CREATOR_PROFILE);
      if (raw) {
        return JSON.parse(raw);
      }
      const userSessionRaw = localStorage.getItem("omoji_user_session");
      if (userSessionRaw) {
        const u = JSON.parse(userSessionRaw);
        return {
          id: `creator-${(u.username || "me").toLowerCase()}`,
          name: u.username || "Sticker Artist",
          username: (u.username || "me").toLowerCase(),
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
          bannerGradient: ["#10B981", "#059669"],
          bio: "Independent sticker designer crafting custom WhatsApp sticker packs on Omoji.",
          verified: false,
          joinedDate: "2025",
          location: "Global",
          specialtyTag: "Original Packs",
          badges: [CREATOR_BADGES.og],
          socialLinks: {},
          stats: {
            followersCount: 1,
            totalDownloads: 0,
            totalLikes: 0,
            packsCount: 0,
            viralityScore: 50,
          },
        };
      }
    } catch (e) {
      console.warn("Could not read my creator profile:", e);
    }
  }

  return {
    id: "creator-me",
    name: "Sticker Artist",
    username: "me",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    bannerGradient: ["#10B981", "#059669"],
    bio: "Independent sticker designer crafting custom WhatsApp sticker packs on Omoji.",
    verified: false,
    joinedDate: "2025",
    location: "Global",
    specialtyTag: "Original Packs",
    badges: [CREATOR_BADGES.og],
    socialLinks: {},
    stats: {
      followersCount: 1,
      totalDownloads: 0,
      totalLikes: 0,
      packsCount: 0,
      viralityScore: 50,
    },
  };
}

/**
 * Saves and updates the local user's own creator profile
 */
export function saveMyCreatorProfile(profile: DetailedCreatorProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY_MY_CREATOR_PROFILE, JSON.stringify(profile));
    window.dispatchEvent(
      new CustomEvent("omoji:my_profile_updated", { detail: profile })
    );
  } catch (e) {
    console.warn("Could not save my creator profile:", e);
  }
}

