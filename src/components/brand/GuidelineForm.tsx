"use client";

import { useState } from "react";
import { BrandGuideline, GuidelineCategory } from "@/types";
import { GUIDELINE_CATEGORIES } from "@/lib/brand-store";
import Button from "@/components/ui/Button";

interface GuidelineFormProps {
  initial?: BrandGuideline | null;
  onSave: (data: {
    category: GuidelineCategory;
    title: string;
    directive: string;
  }) => void;
  onCancel: () => void;
}

export default function GuidelineForm({ initial, onSave, onCancel }: GuidelineFormProps) {
  const [category, setCategory] = useState<GuidelineCategory>(initial?.category || "custom");
  const [title, setTitle] = useState(initial?.title || "");
  const [directive, setDirective] = useState(initial?.directive || "");

  const selectedCat = GUIDELINE_CATEGORIES.find((c) => c.id === category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !directive.trim()) return;
    onSave({ category, title: title.trim(), directive: directive.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border-2 border-accent/30 bg-accent-light/20 p-5 space-y-4">
      <h3 className="text-sm font-bold">
        {initial ? "Edit Guideline" : "New Guideline"}
      </h3>

      {/* Category Selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          {GUIDELINE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer
                ${
                  category === cat.id
                    ? "border-accent bg-accent text-white"
                    : "border-border text-muted hover:border-accent/40"
                }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give this guideline a short name"
          className="w-full rounded-xl border border-border bg-card-bg px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Directive */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          Directive <span className="normal-case text-muted/60">(AI instruction)</span>
        </label>
        <textarea
          value={directive}
          onChange={(e) => setDirective(e.target.value)}
          placeholder={selectedCat?.placeholder || "Write a directive for the AI..."}
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-card-bg px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors"
        />
        <p className="text-[10px] text-muted/60 mt-1.5">
          This instruction will be sent to all AI models when generating graphics.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!title.trim() || !directive.trim()}>
          {initial ? "Update" : "Add Guideline"}
        </Button>
      </div>
    </form>
  );
}
