"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Loader2,
  Trash2,
  CheckCircle2,
  User,
  FolderEdit,
} from "lucide-react";
import { StickerPackRecord } from "../../src/types/pack";
import { ResponsiveDialog } from "../UI/ResponsiveDialog";
import { ConfirmModal } from "../UI/ConfirmModal";

interface EditPackModalProps {
  pack: StickerPackRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; publisher: string }) => Promise<void>;
  onDeletePack: () => Promise<void>;
}

export function EditPackModal({
  pack,
  isOpen,
  onClose,
  onSave,
  onDeletePack,
}: EditPackModalProps) {
  const [title, setTitle] = useState(pack.title || "");
  const [publisher, setPublisher] = useState(pack.publisher || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a pack title.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        publisher: publisher.trim() || "Omoji Creator",
      });
      onClose();
    } catch (err: any) {
      console.error("Failed to update pack:", err);
      setError(err.message || "Failed to update sticker pack metadata.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeletePack();
      setShowConfirmDelete(false);
      onClose();
    } catch (err: any) {
      console.error("Failed to delete pack:", err);
      setError(err.message || "Failed to delete sticker pack.");
      setShowConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Pack Settings"
      description="Update title and creator details for WhatsApp"
      icon={
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-[#25D366] border border-emerald-500/20">
          <FolderEdit className="h-5 w-5" />
        </div>
      }
      maxWidthClass="max-w-lg"
    >
      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-50 dark:bg-red-950/20 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Pack Name <span className="text-[#25D366]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sticker Pack Name"
            maxLength={45}
            required
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#182229] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 transition-all"
          />
        </div>

        {/* Publisher Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Creator / Publisher
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <User className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="Creator Name or @handle"
              maxLength={30}
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#182229] pl-10 pr-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 transition-all"
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-5">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>Delete Pack</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="rounded-2xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || isDeleting || !title.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#128C7E] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal for Permanent Pack Deletion */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={executeDelete}
        title={`Delete "${pack.title}"?`}
        description={
          <span>
            This will permanently delete the sticker pack <strong>"{pack.title}"</strong> and all stickers stored within it. This action cannot be reversed.
          </span>
        }
        confirmLabel="Delete Pack"
        variant="danger"
        isLoading={isDeleting}
      />
    </ResponsiveDialog>
  );
}
