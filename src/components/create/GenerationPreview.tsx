"use client";

import { useState } from "react";
import { GeneratedAsset, GenerationStatus } from "@/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { downloadSVG, downloadPNG, downloadPDF, copySVGToClipboard } from "@/lib/export-utils";

interface GenerationPreviewProps {
  status: GenerationStatus;
  asset: GeneratedAsset | null;
  error?: string;
  onSaveToLibrary?: (asset: GeneratedAsset) => void;
  isSaved?: boolean;
}

export default function GenerationPreview({ status, asset, error, onSaveToLibrary, isSaved }: GenerationPreviewProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleDownload = async (format: "svg" | "png" | "pdf") => {
    if (!asset) return;
    try {
      if (format === "svg") downloadSVG(asset);
      else if (format === "png") await downloadPNG(asset);
      else if (format === "pdf") await downloadPDF(asset);
    } catch (err) {
      console.error("Download failed:", err);
    }
    setShowExportMenu(false);
  };

  const handleCopy = async () => {
    if (!asset) return;
    const ok = await copySVGToClipboard(asset);
    if (ok) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Preview
        </label>
        {asset && (
          <div className="flex items-center gap-2">
            <Badge variant="accent">{asset.model}</Badge>
            <Badge variant="success">{asset.format.toUpperCase()}</Badge>
          </div>
        )}
      </div>

      {/* Preview Area */}
      <div
        className={`flex-1 flex items-center justify-center rounded-2xl border-2 border-dashed overflow-hidden min-h-[400px] transition-all
          ${status === "generating" ? "border-accent/50 bg-accent-light/30 generating-pulse" : "border-border bg-muted-bg/30"}`}
      >
        {status === "idle" && !asset && (
          <div className="text-center px-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted-bg mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 22V12M12 12L3.5 7M12 12l8.5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted">No graphic generated yet</p>
            <p className="text-xs text-muted/60 mt-1">Select a model and enter a prompt to begin</p>
          </div>
        )}

        {status === "generating" && (
          <div className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 mb-4">
              <svg className="animate-spin h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-accent">Generating graphic...</p>
            <p className="text-xs text-muted mt-1">This may take a few seconds</p>
          </div>
        )}

        {status === "error" && error && (
          <div className="text-center px-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950 mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-red-500">Generation failed</p>
            <p className="text-xs text-muted mt-1">{error}</p>
          </div>
        )}

        {status === "done" && asset && (
          <div className="relative w-full h-full flex items-center justify-center p-6">
            {asset.format === "svg" && asset.svgCode ? (
              <div
                className="max-w-full max-h-full"
                dangerouslySetInnerHTML={{ __html: asset.svgCode }}
              />
            ) : (
              <img
                src={asset.url}
                alt={asset.prompt}
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      {status === "done" && asset && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted truncate max-w-[50%]">
            &ldquo;{asset.prompt.length > 80 ? asset.prompt.slice(0, 80) + "..." : asset.prompt}&rdquo;
          </p>
          <div className="flex gap-2 relative">
            {/* Copy SVG */}
            <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy SVG code">
              {copySuccess ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-emerald-500">Copied!</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy SVG
                </>
              )}
            </Button>

            {/* Download with format selection */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 bottom-full mb-1 w-36 rounded-xl border border-border bg-card-bg shadow-xl z-50 overflow-hidden">
                  {[
                    { format: "svg" as const, label: "SVG (Vector)" },
                    { format: "png" as const, label: "PNG (2x)" },
                    { format: "pdf" as const, label: "PDF" },
                  ].map((opt) => (
                    <button
                      key={opt.format}
                      onClick={() => handleDownload(opt.format)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-xs hover:bg-muted-bg transition-colors cursor-pointer"
                    >
                      <span className="text-muted font-mono">{opt.format.toUpperCase()}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Save to Library */}
            <Button
              size="sm"
              onClick={() => onSaveToLibrary?.(asset)}
              disabled={isSaved}
            >
              {isSaved ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Saved
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save to Library
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
