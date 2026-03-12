"use client";

import { AIModel } from "@/types";
import { AI_MODELS } from "@/lib/ai-models";
import Badge from "@/components/ui/Badge";

interface ModelSelectorProps {
  selected: AIModel;
  onChange: (model: AIModel) => void;
}

export default function ModelSelector({ selected, onChange }: ModelSelectorProps) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-3">
        AI Model
      </label>
      <div className="grid grid-cols-3 gap-3">
        {AI_MODELS.map((model) => {
          const isSelected = selected === model.id;
          return (
            <button
              key={model.id}
              onClick={() => onChange(model.id)}
              className={`model-card relative flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer
                ${
                  isSelected
                    ? "selected border-accent bg-accent-light"
                    : "border-border bg-card-bg hover:border-accent/30"
                }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-2xl">{model.icon}</span>
                {isSelected && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent">
                    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                    <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">{model.name}</p>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{model.description}</p>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {model.capabilities.map((cap) => (
                  <Badge key={cap} variant={isSelected ? "accent" : "default"}>
                    {cap}
                  </Badge>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
