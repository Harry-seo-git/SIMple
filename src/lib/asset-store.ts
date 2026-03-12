import { GeneratedAsset, AIModel } from "@/types";

const STORAGE_KEY = "simple-assets";
const HISTORY_KEY = "simple-history";
const MAX_HISTORY = 50;

// ── Asset Library Store ──

export function loadAssets(): GeneratedAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAssets(assets: GeneratedAsset[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

export function addAsset(asset: GeneratedAsset): GeneratedAsset[] {
  const assets = loadAssets();
  // Avoid duplicates
  if (assets.some((a) => a.id === asset.id)) return assets;
  const updated = [asset, ...assets];
  saveAssets(updated);
  return updated;
}

export function removeAsset(assetId: string): GeneratedAsset[] {
  const assets = loadAssets().filter((a) => a.id !== assetId);
  saveAssets(assets);
  return assets;
}

export function getAsset(assetId: string): GeneratedAsset | undefined {
  return loadAssets().find((a) => a.id === assetId);
}

export function updateAssetTags(assetId: string, tags: string[]): GeneratedAsset[] {
  const assets = loadAssets().map((a) =>
    a.id === assetId ? { ...a, tags } : a
  );
  saveAssets(assets);
  return assets;
}

export function getAssetsByModel(model: AIModel): GeneratedAsset[] {
  return loadAssets().filter((a) => a.model === model);
}

export function searchAssets(query: string): GeneratedAsset[] {
  const q = query.toLowerCase();
  return loadAssets().filter(
    (a) =>
      a.prompt.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function getAssetCount(): number {
  return loadAssets().length;
}

// ── Generation History (Create page) ──

export function loadHistory(): GeneratedAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: GeneratedAsset[]): void {
  if (typeof window === "undefined") return;
  // Cap at MAX_HISTORY
  const capped = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(capped));
}

export function addToHistory(asset: GeneratedAsset): GeneratedAsset[] {
  const history = loadHistory();
  const updated = [asset, ...history.filter((a) => a.id !== asset.id)].slice(0, MAX_HISTORY);
  saveHistory(updated);
  return updated;
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}
