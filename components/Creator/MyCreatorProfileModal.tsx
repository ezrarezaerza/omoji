"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Sparkles,
  Camera,
  Twitter,
  Instagram,
  Globe,
  Coffee,
  CheckCircle2,
  X,
  Palette,
  ExternalLink,
  Shield,
  BadgeCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BaseModal } from "../UI/BaseModal";
import { DetailedCreatorProfile } from "../../src/types/creator";
import { getMyCreatorProfile, saveMyCreatorProfile } from "../../utils/creatorEngine";

interface MyCreatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewPublicProfile?: (username: string) => void;
  onPreviewPublicPage?: (username: string) => void;
  onProfileSaved?: (updated: DetailedCreatorProfile) => void;
  onShowNotice?: (message: string) => void;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80",
];

const GRADIENT_PRESETS: [string, string][] = [
  ["#10B981", "#059669"], // Emerald
  ["#6366F1", "#A855F7"], // Cyberpunk Purple
  ["#F97316", "#EF4444"], // Sunset Flame
  ["#EC4899", "#8B5CF6"], // Neon Pink
  ["#06B6D4", "#3B82F6"], // Electric Cyan
  ["#1E293B", "#0F172A"], // Obsidian Dark
];

export function MyCreatorProfileModal({
  isOpen,
  onClose,
  onViewPublicProfile,
  onPreviewPublicPage,
  onProfileSaved,
  onShowNotice,
}: MyCreatorProfileModalProps) {
  const [profile, setProfile] = useState<DetailedCreatorProfile>(getMyCreatorProfile());
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [specialtyTag, setSpecialtyTag] = useState(profile.specialtyTag);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [bannerGradient, setBannerGradient] = useState<[string, string]>(profile.bannerGradient);
  const [location, setLocation] = useState(profile.location || "Global");
  const [twitter, setTwitter] = useState(profile.socialLinks.twitter || "");
  const [instagram, setInstagram] = useState(profile.socialLinks.instagram || "");
  const [website, setWebsite] = useState(profile.socialLinks.website || "");
  const [tipLink, setTipLink] = useState(profile.socialLinks.tipLink || "");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const p = getMyCreatorProfile();
      setProfile(p);
      setName(p.name);
      setUsername(p.username);
      setBio(p.bio);
      setSpecialtyTag(p.specialtyTag);
      setAvatarUrl(p.avatarUrl);
      setBannerGradient(p.bannerGradient);
      setLocation(p.location || "Global");
      setTwitter(p.socialLinks.twitter || "");
      setInstagram(p.socialLinks.instagram || "");
      setWebsite(p.socialLinks.website || "");
      setTipLink(p.socialLinks.tipLink || "");
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "").trim() || "creator";
    const updated: DetailedCreatorProfile = {
      ...profile,
      name: name.trim() || "Sticker Artist",
      username: cleanUsername,
      bio: bio.trim() || "Independent sticker designer on Omoji.",
      specialtyTag: specialtyTag.trim() || "Custom Stickers",
      avatarUrl,
      bannerGradient,
      location: location.trim() || "Global",
      socialLinks: {
        twitter: twitter.trim() || undefined,
        instagram: instagram.trim() || undefined,
        website: website.trim() || undefined,
        tipLink: tipLink.trim() || undefined,
      },
    };

    saveMyCreatorProfile(updated);
    setProfile(updated);
    setIsSaved(true);
    onProfileSaved?.(updated);
    onShowNotice?.("✨ Creator Profile updated successfully!");
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handlePreviewClick = () => {
    onClose();
    if (onPreviewPublicPage) {
      onPreviewPublicPage(username);
    } else if (onViewPublicProfile) {
      onViewPublicProfile(username);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="My Creator Dossier"
      subtitle="Customize your public persona, avatar, and social presence across Omoji"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1 pr-2 no-scrollbar">
        {/* Live Preview Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] shadow-md">
          {/* Banner Mesh */}
          <div
            className="h-24 w-full transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${bannerGradient[0]} 0%, ${bannerGradient[1]} 100%)`,
            }}
          />

          <div className="px-5 pb-5 pt-0">
            <div className="flex items-end justify-between -mt-10 mb-3">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="h-20 w-20 rounded-2xl border-4 border-white dark:border-[#111b21] object-cover shadow-lg bg-slate-100 dark:bg-white/10"
                />
              </div>

              {(onViewPublicProfile || onPreviewPublicPage) && (
                <button
                  type="button"
                  onClick={handlePreviewClick}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer shadow-xs"
                >
                  <span>Preview Public Page</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
                  {name || "Your Artist Name"}
                </h3>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-[#25D366] border border-emerald-500/20">
                  {specialtyTag || "Sticker Artist"}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                @{username || "username"}
              </p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                {bio || "Add your bio..."}
              </p>
            </div>
          </div>
        </div>

        {/* Identity Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Neon Scribe"
              className="w-full rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#25D366]"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
              Creator Handle (@username)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="handle"
                className="w-full rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] pl-8 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#25D366]"
              />
            </div>
          </div>
        </div>

        {/* Bio & Specialty Tag */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
              Artist Bio / Description
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell sticker fans about your artistic style and theme..."
              className="w-full rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#25D366] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
              Specialty Badge Tag
            </label>
            <input
              type="text"
              value={specialtyTag}
              onChange={(e) => setSpecialtyTag(e.target.value)}
              placeholder="e.g. Cyberpunk & 3D"
              className="w-full rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#25D366]"
            />
          </div>
        </div>

        {/* Avatar Preset Picker */}
        <div>
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-2">
            Choose Avatar Preset or Custom Image URL
          </label>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
            {AVATAR_PRESETS.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatarUrl(url)}
                className={`relative shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer p-0.5 ${
                  avatarUrl === url
                    ? "border-[#25D366] scale-105 shadow-md"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={url}
                  alt={`Preset ${idx + 1}`}
                  className="h-12 w-12 rounded-xl object-cover"
                />
              </button>
            ))}
          </div>

          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="Or paste custom image URL (https://...)"
            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-[#25D366]"
          />
        </div>

        {/* Banner Gradient Picker */}
        <div>
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-2">
            Banner Gradient Mood
          </label>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {GRADIENT_PRESETS.map((grad, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setBannerGradient(grad)}
                style={{
                  background: `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 100%)`,
                }}
                className={`h-9 w-14 shrink-0 rounded-xl border-2 transition-all cursor-pointer ${
                  bannerGradient[0] === grad[0]
                    ? "border-slate-900 dark:border-white scale-110 shadow-md"
                    : "border-transparent opacity-80 hover:opacity-100"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Social Links & Support */}
        <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-white/10">
          <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider font-['Space_Grotesk']">
            Socials &amp; Community Support
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3 py-1.5">
              <Twitter className="h-4 w-4 text-sky-500 shrink-0" />
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="X/Twitter handle or URL"
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3 py-1.5">
              <Instagram className="h-4 w-4 text-pink-500 shrink-0" />
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="Instagram handle or URL"
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3 py-1.5">
              <Globe className="h-4 w-4 text-indigo-500 shrink-0" />
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Portfolio or Website URL"
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3 py-1.5">
              <Coffee className="h-4 w-4 text-amber-500 shrink-0" />
              <input
                type="text"
                value={tipLink}
                onChange={(e) => setTipLink(e.target.value)}
                placeholder="Buy Me A Coffee or Tip Jar"
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 dark:border-white/15 px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaved}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-2.5 text-xs font-black text-black shadow-lg shadow-emerald-600/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer font-['Space_Grotesk']"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-black" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-black" />
                <span>Save Creator Profile</span>
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
