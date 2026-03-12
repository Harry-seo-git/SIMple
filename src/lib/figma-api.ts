import { GeneratedAsset } from "@/types";

/**
 * Figma REST API integration for SIMple.
 * Handles pushing assets to Figma files and managing design system components.
 */

// ── Types ──

export interface FigmaFile {
  key: string;
  name: string;
  lastModified: string;
  thumbnailUrl?: string;
}

export interface FigmaProject {
  id: string;
  name: string;
}

export interface FigmaPushResult {
  success: boolean;
  nodeId?: string;
  error?: string;
}

// ── API Helpers ──

function getFigmaToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("simple-figma-token");
}

async function figmaFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const token = getFigmaToken();
  if (!token) throw new Error("Figma not connected");

  return fetch(`https://api.figma.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

// ── Public API ──

/**
 * Get current user info
 */
export async function getFigmaUser(): Promise<{ handle: string; email: string; img_url: string } | null> {
  try {
    const res = await figmaFetch("/me");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * List recent Figma files for the user's teams
 */
export async function getFigmaTeamProjects(teamId: string): Promise<FigmaProject[]> {
  try {
    const res = await figmaFetch(`/teams/${teamId}/projects`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.projects || [];
  } catch {
    return [];
  }
}

/**
 * List files in a project
 */
export async function getFigmaProjectFiles(projectId: string): Promise<FigmaFile[]> {
  try {
    const res = await figmaFetch(`/projects/${projectId}/files`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch {
    return [];
  }
}

/**
 * Get a specific Figma file's metadata
 */
export async function getFigmaFile(fileKey: string): Promise<{ name: string; pages: { id: string; name: string }[] } | null> {
  try {
    const res = await figmaFetch(`/files/${fileKey}?depth=1`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      name: data.name,
      pages: (data.document?.children || []).map((p: { id: string; name: string }) => ({
        id: p.id,
        name: p.name,
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Upload an image to Figma as a fill for a node.
 * Uses the Figma Images API.
 */
export async function uploadImageToFigma(
  fileKey: string,
  imageBytes: Blob
): Promise<{ imageRef: string } | null> {
  const token = getFigmaToken();
  if (!token) return null;

  try {
    const res = await fetch(`https://api.figma.com/v1/images/${fileKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "image/png",
      },
      body: imageBytes,
    });

    if (!res.ok) return null;
    const data = await res.json();
    return { imageRef: data.meta?.image_ref || "" };
  } catch {
    return null;
  }
}

/**
 * Convert SVG asset to PNG blob for Figma upload
 */
export async function assetToPngBlob(asset: GeneratedAsset, scale: number = 2): Promise<Blob | null> {
  const svgCode = asset.svgCode;
  if (!svgCode) return null;

  return new Promise((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([svgCode], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = asset.width * scale;
      canvas.height = asset.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        resolve(null);
        return;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(svgUrl);
          resolve(blob);
        },
        "image/png",
        1.0
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      resolve(null);
    };

    img.src = svgUrl;
  });
}

/**
 * Push an asset to a Figma file.
 * This is the main integration point.
 *
 * Flow:
 * 1. Convert SVG to PNG
 * 2. Upload PNG to Figma
 * 3. Use Figma Plugin API (via plugin) to place the image
 *
 * Note: Direct node creation requires the Figma Plugin API,
 * so we provide the image upload part here and let the plugin handle placement.
 */
export async function pushAssetToFigma(
  asset: GeneratedAsset,
  fileKey: string
): Promise<FigmaPushResult> {
  try {
    // 1. Convert to PNG
    const pngBlob = await assetToPngBlob(asset);
    if (!pngBlob) {
      return { success: false, error: "Failed to convert asset to PNG" };
    }

    // 2. Upload to Figma
    const uploadResult = await uploadImageToFigma(fileKey, pngBlob);
    if (!uploadResult) {
      return { success: false, error: "Failed to upload image to Figma" };
    }

    return {
      success: true,
      nodeId: uploadResult.imageRef,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ── Demo mode ──

/**
 * Demo push (when Figma is not actually connected)
 */
export async function demoPushToFigma(asset: GeneratedAsset): Promise<FigmaPushResult> {
  // Simulate a delay
  await new Promise((r) => setTimeout(r, 1000));
  return {
    success: true,
    nodeId: `demo-${asset.id.slice(0, 8)}`,
  };
}
