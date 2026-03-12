"use client";

import { GeneratedAsset } from "@/types";
import Badge from "@/components/ui/Badge";
import { downloadSVG, downloadPNG } from "@/lib/export-utils";

interface AssetCardProps {
  asset: GeneratedAsset;
  onDelete?: (assetId: string) => void;
}

export default function AssetCard({ asset, onDelete }: AssetCardProps) {
  const handleDownload = async () => {
    if (asset.format === "svg") {
      downloadSVG(asset);
    } else {
      await downloadPNG(asset);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card-bg transition-all hover:shadow-lg hover:border-accent/30">
      {/* Preview */}
      <div className="relative aspect-square bg-muted-bg/30 flex items-center justify-center p-4 overflow-hidden">
        {asset.format === "svg" && asset.svgCode ? (
          <div
            className="w-full h-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: asset.svgCode }}
          />
        ) : (
          <img
            src={asset.url}
            alt={asset.prompt}
            className="max-w-full max-h-full object-contain"
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={handleDownload}
            title="Download"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(asset.id)}
              title="Remove from library"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/30 text-white hover:bg-red-500/50 transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-foreground font-medium truncate">{asset.prompt}</p>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <Badge variant="accent">{asset.model}</Badge>
          <Badge>{asset.format.toUpperCase()}</Badge>
          {asset.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <p className="text-[10px] text-muted mt-1.5">
          {new Date(asset.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
