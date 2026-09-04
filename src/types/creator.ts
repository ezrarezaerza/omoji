/**
 * Creator Profile & Social Ecosystem Types
 */

import { ExplorePack, ExploreSticker } from "./explore";

export interface CreatorBadge {
  id: string;
  label: string;
  icon: string; // Lucide icon identifier or emoji
  description: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export interface CreatorSocialLinks {
  twitter?: string;
  instagram?: string;
  website?: string;
  tipLink?: string;
  github?: string;
}

export interface CreatorStats {
  followersCount: number;
  totalDownloads: number;
  totalLikes: number;
  packsCount: number;
  viralityScore?: number; // 0 - 100
}

export interface DetailedCreatorProfile {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  bannerGradient: [string, string];
  bio: string;
  verified: boolean;
  joinedDate: string;
  location?: string;
  badges: CreatorBadge[];
  socialLinks: CreatorSocialLinks;
  stats: CreatorStats;
  featuredPackId?: string;
  specialtyTag: string;
}

export interface CreatorFollowRecord {
  username: string;
  followedAt: number;
}
