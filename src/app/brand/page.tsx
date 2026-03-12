"use client";

import { useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import GuidelineCard from "@/components/brand/GuidelineCard";
import GuidelineForm from "@/components/brand/GuidelineForm";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  loadProfile,
  addGuideline,
  removeGuideline,
  toggleGuideline,
  updateGuideline,
  buildBrandDirective,
  GUIDELINE_CATEGORIES,
} from "@/lib/brand-store";
import { BrandGuideline, BrandProfile, GuidelineCategory } from "@/types";

type FilterCat = GuidelineCategory | "all";

export default function BrandPage() {
  const [profile, setProfile] = useState<BrandProfile | null>(() => {
    if (typeof window === "undefined") return null;
    return loadProfile();
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BrandGuideline | null>(null);
  const [filter, setFilter] = useState<FilterCat>("all");
  const [showPreview, setShowPreview] = useState(false);

  const handleAdd = useCallback(
    (data: { category: GuidelineCategory; title: string; directive: string }) => {
      if (!profile) return;
      const updated = addGuideline(profile, {
        ...data,
        enabled: true,
      });
      setProfile(updated);
      setShowForm(false);
    },
    [profile]
  );

  const handleEdit = useCallback(
    (data: { category: GuidelineCategory; title: string; directive: string }) => {
      if (!profile || !editing) return;
      const updated = updateGuideline(profile, editing.id, data);
      setProfile(updated);
      setEditing(null);
      setShowForm(false);
    },
    [profile, editing]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (!profile) return;
      setProfile(removeGuideline(profile, id));
    },
    [profile]
  );

  const handleToggle = useCallback(
    (id: string) => {
      if (!profile) return;
      setProfile(toggleGuideline(profile, id));
    },
    [profile]
  );

  const startEdit = useCallback((g: BrandGuideline) => {
    setEditing(g);
    setShowForm(true);
  }, []);

  if (!profile) return null;

  const filtered =
    filter === "all"
      ? profile.guidelines
      : profile.guidelines.filter((g) => g.category === filter);

  const enabledCount = profile.guidelines.filter((g) => g.enabled).length;
  const directivePreview = buildBrandDirective(profile);

  return (
    <div className="flex h-screen flex-col">
      <Header
        title="Brand Guidelines"
        description={`${profile.name} \u2014 ${enabledCount}/${profile.guidelines.length} active`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {showPreview ? "Hide" : "Preview"} Prompt
            </Button>
            <Button
              size="sm"
              onClick={() => { setEditing(null); setShowForm(true); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Guideline
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Prompt Preview */}
        {showPreview && (
          <div className="rounded-2xl border border-accent/30 bg-accent-light/20 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-accent">
                AI Prompt Preview
              </h3>
              <Badge variant="accent">{enabledCount} directives active</Badge>
            </div>
            <pre className="text-xs text-muted leading-relaxed whitespace-pre-wrap font-mono bg-card-bg rounded-xl p-4 border border-border max-h-[200px] overflow-y-auto">
              {directivePreview || "(No active guidelines)"}
            </pre>
            <p className="text-[10px] text-muted/60 mt-2">
              This block is injected at the beginning of every generation prompt for all AI models.
            </p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                ${filter === "all" ? "bg-accent text-white" : "text-muted hover:text-foreground hover:bg-muted-bg"}`}
            >
              All ({profile.guidelines.length})
            </button>
            {GUIDELINE_CATEGORIES.map((cat) => {
              const count = profile.guidelines.filter(
                (g) => g.category === cat.id
              ).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                    ${filter === cat.id ? "bg-accent text-white" : "text-muted hover:text-foreground hover:bg-muted-bg"}`}
                >
                  <span>{cat.icon}</span>
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <GuidelineForm
            initial={editing}
            onSave={editing ? handleEdit : handleAdd}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        )}

        {/* Guidelines Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted-bg mb-4">
              <span className="text-2xl">{filter === "all" ? "\ud83d\udcdd" : GUIDELINE_CATEGORIES.find((c) => c.id === filter)?.icon}</span>
            </div>
            <p className="text-sm font-medium text-muted">No guidelines yet</p>
            <p className="text-xs text-muted/60 mt-1">Add your first brand directive to guide AI generation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((g) => (
              <GuidelineCard
                key={g.id}
                guideline={g}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={startEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
