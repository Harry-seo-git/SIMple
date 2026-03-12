"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { GenerationStatus, OutputFormat } from "@/types";
import { STYLE_PRESETS } from "@/lib/ai-models";

interface PromptInputProps {
  status: GenerationStatus;
  onGenerate: (prompt: string, style: string, format: OutputFormat) => void;
}

export default function PromptInput({ status, onGenerate }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [format, setFormat] = useState<OutputFormat>("svg");

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt, selectedStyle, format);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-5">
      {/* Prompt Input */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-3">
          Prompt
        </label>
        <div className={`relative rounded-2xl border-2 transition-colors ${status === "generating" ? "border-accent generating-pulse" : "border-border focus-within:border-accent"}`}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the graphic you want to create..."
            rows={4}
            className="w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted/50"
            disabled={status === "generating"}
          />
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5">
            <span className="text-xs text-muted">
              {prompt.length > 0 ? `${prompt.length} chars` : "Cmd+Enter to generate"}
            </span>
            <Button
              size="sm"
              onClick={handleSubmit}
              loading={status === "generating"}
              disabled={!prompt.trim()}
            >
              {status === "generating" ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
      </div>

      {/* Style Presets */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-3">
          Style Preset
        </label>
        <div className="flex flex-wrap gap-2">
          {STYLE_PRESETS.map((style) => {
            const isActive = selectedStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(isActive ? "" : style.id)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer
                  ${
                    isActive
                      ? "border-accent bg-accent text-white"
                      : "border-border text-muted hover:border-accent/40 hover:text-foreground"
                  }`}
              >
                {style.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Output Format */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-3">
          Output Format
        </label>
        <div className="flex gap-2">
          {(["svg", "png"] as OutputFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold uppercase transition-all cursor-pointer
                ${
                  format === f
                    ? "border-accent bg-accent-light text-accent"
                    : "border-border text-muted hover:border-accent/40"
                }`}
            >
              {f === "svg" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              )}
              {f === "png" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              )}
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
