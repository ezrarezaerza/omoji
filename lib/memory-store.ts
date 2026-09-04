/**
 * In-Memory fallback store for environments where PostgreSQL / Prisma
 * is not yet provisioned or unreachable (e.g. quick Vercel preview deploys).
 */

export interface MemoryUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

export interface MemorySticker {
  id: string;
  packId: string;
  slotIndex: number;
  imageUrl: string;
  emojis: string[];
  isAnimated: boolean;
  createdAt: Date;
}

export interface MemoryPack {
  id: string;
  title: string;
  publisher: string;
  trayIconUrl: string;
  isPublic: boolean;
  isPublished: boolean;
  downloadCount: number;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  stickers: MemorySticker[];
  author?: {
    id: string;
    username: string;
    email: string;
  };
}

// Global in-memory singleton
const globalMemoryStore = globalThis as unknown as {
  _omojiMemoryUsers?: Map<string, MemoryUser>;
  _omojiMemoryPacks?: Map<string, MemoryPack>;
};

if (!globalMemoryStore._omojiMemoryUsers) {
  globalMemoryStore._omojiMemoryUsers = new Map<string, MemoryUser>();
}
if (!globalMemoryStore._omojiMemoryPacks) {
  globalMemoryStore._omojiMemoryPacks = new Map<string, MemoryPack>();
}

export const memoryUsers = globalMemoryStore._omojiMemoryUsers;
export const memoryPacks = globalMemoryStore._omojiMemoryPacks;

export function isPrismaAvailable(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "");
}
