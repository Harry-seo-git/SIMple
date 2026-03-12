"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import AssetGrid from "@/components/library/AssetGrid";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { GeneratedAsset, AIModel } from "@/types";
import { loadAssets, removeAsset } from "@/lib/asset-store";

type FilterModel = AIModel | "all";

export default function LibraryPage() {
  const [assets, setAssets] = useState<GeneratedAsset[]>(() => {
    if (typeof window === "undefined") return [];
    return loadAssets();
  });
  const [filter, setFilter] = useState<FilterModel>("all");
  const [search, setSearch] = useState("");

  const handleDelete = useCallback((assetId: string) => {
    const updated = removeAsset(assetId);
    setAssets(updated);
  }, []);

  const filtered = assets.filter((a) => {
    const matchModel = filter === "all" || a.model === filter;
    const matchSearch =
      !search ||
      a.prompt.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchModel && matchSearch;
  });

  // Model counts
  const modelCounts = {
    all: assets.length,
    claude: assets.filter((a) => a.model === "claude").length,
    openai: assets.filter((a) => a.model === "openai").length,
    gemini: assets.filter((a) => a.model === "gemini").length,
  };

  return (
    <div className="flex h-screen flex-col">
      <Header
        title="Library"
        description={`${assets.length} asset${assets.length !== 1 ? "s" : ""} saved`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/create">
              <Button variant="secondary" size="sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18M3 12h18" />
                </svg>
                Create New
              </Button>
            </Link>
            <Button variant="secondary" size="sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
                <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
                <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
                <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
                <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
              </svg>
              Export to Figma
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search assets by prompt or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-card-bg pl-10 pr-4 py-2 text-sm outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex gap-1.5">
            {(["all", "claude", "openai", "gemini"] as FilterModel[]).map((m) => (
              <button
                key={m}
                onClick={() => setFilter(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                  ${filter === m ? "bg-accent text-white" : "text-muted hover:text-foreground hover:bg-muted-bg"}`}
              >
                {m === "all" ? "All" : m.charAt(0).toUpperCase() + m.slice(1)}
                <span className="ml-1 opacity-60">({modelCounts[m]})</span>
              </button>
            ))}
          </div>

          <Badge variant="default">{filtered.length} results</Badge>
        </div>

        <AssetGrid assets={filtered} onDelete={handleDelete} />
      </div>
    </div>
  );
}
