"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import ModelSelector from "@/components/create/ModelSelector";
import PromptInput from "@/components/create/PromptInput";
import GenerationPreview from "@/components/create/GenerationPreview";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { AIModel, BrandProfile, GeneratedAsset, GenerationStatus, OutputFormat } from "@/types";
import { loadProfile, buildBrandDirective } from "@/lib/brand-store";
import { addToHistory, loadHistory, clearHistory } from "@/lib/asset-store";
import { addAsset, loadAssets } from "@/lib/asset-store";

export default function CreatePage() {
  const [selectedModel, setSelectedModel] = useState<AIModel>("claude");
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [currentAsset, setCurrentAsset] = useState<GeneratedAsset | null>(null);
  const [error, setError] = useState<string>();
  const [history, setHistory] = useState<GeneratedAsset[]>([]);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [savedAssetIds, setSavedAssetIds] = useState<Set<string>>(new Set());

  // Load persistent data on mount
  useEffect(() => {
    setBrandProfile(loadProfile());
    setHistory(loadHistory());
    // Load saved asset IDs to track which ones are already in library
    const libraryAssets = loadAssets();
    setSavedAssetIds(new Set(libraryAssets.map((a) => a.id)));
  }, []);

  const activeGuidelines = brandProfile?.guidelines.filter((g) => g.enabled) || [];

  const handleGenerate = async (prompt: string, style: string, format: OutputFormat) => {
    setStatus("generating");
    setError(undefined);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          prompt,
          style,
          outputFormat: format,
          brandGuidelines: activeGuidelines,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setCurrentAsset(data.asset);
      // Save to persistent history
      const updatedHistory = addToHistory(data.asset);
      setHistory(updatedHistory);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  const handleSaveToLibrary = useCallback((asset: GeneratedAsset) => {
    addAsset(asset);
    setSavedAssetIds((prev) => new Set([...prev, asset.id]));
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  const isSaved = currentAsset ? savedAssetIds.has(currentAsset.id) : false;

  return (
    <div className="flex h-screen flex-col">
      <Header
        title="Create"
        description="Generate unique graphic objects with AI"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-[440px] flex-shrink-0 overflow-y-auto border-r border-border p-6 space-y-6">
          {/* Active Brand Guidelines Banner */}
          {brandProfile && (
            <Link
              href="/brand"
              className="flex items-center justify-between rounded-2xl border border-accent/20 bg-accent-light/30 px-4 py-3 transition-all hover:border-accent/40 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{brandProfile.name} Brand</p>
                  <p className="text-[10px] text-muted">
                    {activeGuidelines.length} guideline{activeGuidelines.length !== 1 ? "s" : ""} active
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={activeGuidelines.length > 0 ? "success" : "warning"}>
                  {activeGuidelines.length > 0 ? "ON" : "OFF"}
                </Badge>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted group-hover:text-accent transition-colors" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          )}

          {/* Active Guideline Pills */}
          {activeGuidelines.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeGuidelines.map((g) => (
                <span
                  key={g.id}
                  className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-medium text-accent"
                  title={g.directive}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {g.title}
                </span>
              ))}
            </div>
          )}

          <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
          <PromptInput status={status} onGenerate={handleGenerate} />

          {/* Generation History */}
          {history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  History ({history.length})
                </label>
                <button
                  onClick={handleClearHistory}
                  className="text-[10px] text-muted hover:text-red-500 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {history.slice(0, 9).map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => { setCurrentAsset(asset); setStatus("done"); }}
                    className={`aspect-square rounded-xl border overflow-hidden transition-all cursor-pointer relative group
                      ${currentAsset?.id === asset.id ? "border-accent ring-2 ring-accent/20" : "border-border hover:border-accent/30"}`}
                  >
                    {asset.svgCode ? (
                      <div
                        className="w-full h-full flex items-center justify-center p-1"
                        dangerouslySetInnerHTML={{ __html: asset.svgCode }}
                      />
                    ) : (
                      <img src={asset.url} alt="" className="w-full h-full object-contain p-1" />
                    )}
                    {/* Saved indicator */}
                    {savedAssetIds.has(asset.id) && (
                      <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {history.length > 9 && (
                <p className="text-[10px] text-muted text-center mt-2">
                  +{history.length - 9} more in history
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <GenerationPreview
            status={status}
            asset={currentAsset}
            error={error}
            onSaveToLibrary={handleSaveToLibrary}
            isSaved={isSaved}
          />
        </div>
      </div>
    </div>
  );
}
