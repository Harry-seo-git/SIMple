"use client";

import { GeneratedAsset } from "@/types";
import AssetCard from "./AssetCard";

interface AssetGridProps {
  assets: GeneratedAsset[];
  onDelete?: (assetId: string) => void;
}

export default function AssetGrid({ assets, onDelete }: AssetGridProps) {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-muted-bg mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-medium text-muted">No assets yet</p>
        <p className="text-xs text-muted/60 mt-1">Create your first graphic to see it here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} onDelete={onDelete} />
      ))}
    </div>
  );
}
