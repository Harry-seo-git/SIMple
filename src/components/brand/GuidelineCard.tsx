"use client";

import { BrandGuideline } from "@/types";
import { GUIDELINE_CATEGORIES } from "@/lib/brand-store";

interface GuidelineCardProps {
  guideline: BrandGuideline;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (guideline: BrandGuideline) => void;
}

export default function GuidelineCard({
  guideline,
  onToggle,
  onDelete,
  onEdit,
}: GuidelineCardProps) {
  const cat = GUIDELINE_CATEGORIES.find((c) => c.id === guideline.category);

  return (
    <div
      className={`group relative rounded-2xl border-2 p-4 transition-all
        ${
          guideline.enabled
            ? "border-border bg-card-bg"
            : "border-border/50 bg-muted-bg/30 opacity-60"
        }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm
              ${guideline.enabled ? "bg-accent-light" : "bg-muted-bg"}`}
          >
            {cat?.icon || "\u270f\ufe0f"}
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold truncate">{guideline.title}</h4>
            <span
              className={`text-[10px] uppercase tracking-wider font-medium
                ${guideline.enabled ? "text-accent" : "text-muted"}`}
            >
              {cat?.label || guideline.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Toggle */}
          <button
            onClick={() => onToggle(guideline.id)}
            className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer
              ${guideline.enabled ? "bg-accent" : "bg-muted-bg"}`}
            title={guideline.enabled ? "Disable" : "Enable"}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform
                ${guideline.enabled ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>

      {/* Directive */}
      <p className="text-xs text-muted leading-relaxed mt-2 line-clamp-3">
        {guideline.directive}
      </p>

      {/* Actions (hover) */}
      <div className="absolute top-3 right-14 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(guideline)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
          title="Edit"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(guideline.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
          title="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
