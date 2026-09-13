"use client";

import React, { useState, useEffect } from "react";
import {
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Download,
  Terminal,
  Smartphone,
  Check,
  RefreshCw,
  Layers,
} from "lucide-react";
import { StickerPackRecord, WhatsAppManifestResponse } from "../../src/types/pack";
import { ResponsiveDialog } from "../UI/ResponsiveDialog";

interface WhatsAppManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: StickerPackRecord;
}

export function WhatsAppManifestModal({
  isOpen,
  onClose,
  pack,
}: WhatsAppManifestModalProps) {
  const [data, setData] = useState<WhatsAppManifestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"contents" | "full" | "integration">("contents");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchManifest = async () => {
    if (!pack?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/packs/${pack.id}/whatsapp-manifest`);
      if (!res.ok) {
        throw new Error(`Failed to load manifest (${res.status})`);
      }
      const json: WhatsAppManifestResponse = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed to load WhatsApp manifest.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchManifest();
    }
  }, [isOpen, pack?.id]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadJson = (obj: any, filename: string) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCodeSnippet = () => {
    if (!data) return "";
    if (activeTab === "contents") {
      return JSON.stringify(data.contents, null, 2);
    }
    if (activeTab === "full") {
      return JSON.stringify(data, null, 2);
    }
    return JSON.stringify(data.integration, null, 2);
  };

  const isCompliant = data?.diagnostics?.status === "compliant";
  const hasWarnings = data?.diagnostics?.status === "warning";

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title="WhatsApp Pack Details & Info"
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-4 p-1">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-[#25D366] border border-emerald-500/20">
              <FileCode2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
                  WhatsApp Sticker Pack Info
                </h3>
                {data?.diagnostics && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                      isCompliant
                        ? "bg-emerald-500/15 border-emerald-500/30 text-[#25D366]"
                        : hasWarnings
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-500"
                        : "bg-rose-500/15 border-rose-500/30 text-rose-500"
                    }`}
                  >
                    {isCompliant ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {isCompliant
                      ? "100% WhatsApp Compliant"
                      : hasWarnings
                      ? "Compliant with Warnings"
                      : "Non-Compliant"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Standardized JSON schema conforming to WhatsApp Android ContentProvider &amp; iOS Pasteboard handoff.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={fetchManifest}
              disabled={loading}
              title="Refresh Manifest"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/15 cursor-pointer transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <a
              href={`/api/packs/${pack.id}/whatsapp-manifest`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-[#25D366] hover:bg-emerald-500/20 cursor-pointer transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Raw API</span>
            </a>
          </div>
        </div>

        {/* Diagnostics Banners if errors or warnings exist */}
        {data?.diagnostics?.errors && data.diagnostics.errors.length > 0 && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>WhatsApp Validation Errors:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
              {data.diagnostics.errors.map((e, idx) => (
                <li key={idx}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {data?.diagnostics?.warnings && data.diagnostics.warnings.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>WhatsApp Validation Warnings:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
              {data.diagnostics.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* View Selection Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("contents")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "contents"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              contents.json
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("integration")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "integration"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Bridge &amp; Deep Links
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("full")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "full"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Full Diagnostics
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(getCodeSnippet(), "code")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/15 cursor-pointer transition-all"
            >
              {copiedKey === "code" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => downloadJson(data?.contents, `${pack.title.toLowerCase().replace(/\s+/g, "_")}_contents.json`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/15 cursor-pointer transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Integration Details Panel if active */}
        {activeTab === "integration" && data?.integration && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
                <Smartphone className="h-4 w-4 text-emerald-500" />
                <span>Android ContentProvider Contract</span>
              </div>
              <div className="text-[11px] font-mono bg-black/5 dark:bg-black/40 p-2 rounded-xl text-slate-700 dark:text-zinc-300 space-y-1 overflow-x-auto">
                <div><span className="text-slate-400">Action:</span> {data.integration.android.action}</div>
                <div><span className="text-slate-400">Authority:</span> {data.integration.android.authority}</div>
                <div><span className="text-slate-400">Pack ID:</span> {data.integration.android.pack_id}</div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(data.integration.android.intent_uri, "intent")}
                className="w-full text-left inline-flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-[#25D366] hover:underline cursor-pointer"
              >
                <span>{copiedKey === "intent" ? "Copied Intent URI!" : "Copy Android Intent URI"}</span>
                <Copy className="h-3 w-3" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
                <Terminal className="h-4 w-4 text-blue-500" />
                <span>iOS Pasteboard &amp; URL Scheme</span>
              </div>
              <div className="text-[11px] font-mono bg-black/5 dark:bg-black/40 p-2 rounded-xl text-slate-700 dark:text-zinc-300 space-y-1 overflow-x-auto">
                <div><span className="text-slate-400">URL Scheme:</span> {data.integration.ios.url_scheme}</div>
                <div><span className="text-slate-400">Pasteboard Key:</span> {data.integration.ios.pasteboard_key}</div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(data.integration.ios.url_scheme, "ios")}
                className="w-full text-left inline-flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <span>{copiedKey === "ios" ? "Copied iOS Scheme!" : "Copy iOS URL Scheme"}</span>
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Code Display Area */}
        <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-900 p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[380px] shadow-inner">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-[#25D366]" />
              <span>Generating conforming WhatsApp manifest...</span>
            </div>
          ) : error ? (
            <div className="text-rose-400 py-8 text-center">{error}</div>
          ) : (
            <pre className="whitespace-pre">{getCodeSnippet()}</pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-3">
          <div className="text-[11px] text-slate-500 dark:text-zinc-400">
            Endpoint: <code className="font-mono text-emerald-600 dark:text-[#25D366]">/api/packs/{pack.id}/whatsapp-manifest</code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
