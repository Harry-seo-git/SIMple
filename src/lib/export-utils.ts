import { GeneratedAsset } from "@/types";

/**
 * Download SVG as .svg file
 */
export function downloadSVG(asset: GeneratedAsset): void {
  const svgCode = asset.svgCode;
  if (!svgCode) return;

  const blob = new Blob([svgCode], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${sanitizeFilename(asset.prompt)}.svg`);
  URL.revokeObjectURL(url);
}

/**
 * Download asset as PNG (renders SVG to canvas)
 */
export async function downloadPNG(
  asset: GeneratedAsset,
  scale: number = 2
): Promise<void> {
  const svgCode = asset.svgCode;
  if (!svgCode) return;

  const width = asset.width * scale;
  const height = asset.height * scale;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgCode], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        reject(new Error("Canvas context not available"));
        return;
      }

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create PNG blob"));
            return;
          }
          const url = URL.createObjectURL(blob);
          triggerDownload(url, `${sanitizeFilename(asset.prompt)}.png`);
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(svgUrl);
          resolve();
        },
        "image/png",
        1.0
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error("Failed to load SVG image"));
    };

    img.src = svgUrl;
  });
}

/**
 * Download asset as PDF (simple SVG-to-PDF wrapper)
 */
export async function downloadPDF(asset: GeneratedAsset): Promise<void> {
  const svgCode = asset.svgCode;
  if (!svgCode) return;

  // Simple PDF with embedded SVG as image
  const width = asset.width;
  const height = asset.height;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgCode], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imgDataUrl = canvas.toDataURL("image/png");

      // Build a minimal PDF
      const pdfContent = buildSimplePDF(imgDataUrl, width, height);
      const blob = new Blob([pdfContent.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${sanitizeFilename(asset.prompt)}.pdf`);
      URL.revokeObjectURL(url);
      URL.revokeObjectURL(svgUrl);
      resolve();
    };

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error("Failed to load SVG for PDF"));
    };

    img.src = svgUrl;
  });
}

/**
 * Copy SVG code to clipboard
 */
export async function copySVGToClipboard(asset: GeneratedAsset): Promise<boolean> {
  if (!asset.svgCode) return false;
  try {
    await navigator.clipboard.writeText(asset.svgCode);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a data URL from SVG code for preview
 */
export function svgToDataUrl(svgCode: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svgCode)}`;
}

// ── Internal helpers ──

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function sanitizeFilename(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\s\-_\uAC00-\uD7AF]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60) || "simple-graphic";
}

/**
 * Build a minimal valid PDF with an embedded PNG image.
 * This is a lightweight solution — for production, use a proper PDF library.
 */
function buildSimplePDF(imgDataUrl: string, width: number, height: number): Uint8Array {
  // Extract base64 data from data URL
  const base64 = imgDataUrl.split(",")[1];
  const imgBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  // PDF dimensions in points (1px ≈ 0.75pt at 96dpi)
  const ptW = width * 0.75;
  const ptH = height * 0.75;

  const encoder = new TextEncoder();

  // Build PDF objects
  const header = `%PDF-1.4\n`;
  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptW} ${ptH}] /Contents 4 0 R /Resources << /XObject << /Img 5 0 R >> >> >>\nendobj\n`;
  const stream4Content = `q ${ptW} 0 0 ${ptH} 0 0 cm /Img Do Q`;
  const obj4 = `4 0 obj\n<< /Length ${stream4Content.length} >>\nstream\n${stream4Content}\nendstream\nendobj\n`;
  const obj5Header = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width * 2} /Height ${height * 2} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`;
  const obj5Footer = `\nendstream\nendobj\n`;

  // Calculate offsets
  // For simplicity, concat everything and produce xref
  const offsets: number[] = [];
  let pos = 0;

  // Recalculate with offsets
  pos = header.length;
  offsets.push(pos - header.length); // won't use index 0
  offsets[1] = header.length;
  offsets[2] = offsets[1] + obj1.length;
  offsets[3] = offsets[2] + obj2.length;
  offsets[4] = offsets[3] + obj3.length;
  offsets[5] = offsets[4] + obj4.length;

  const xrefStart = offsets[5] + obj5Header.length + imgBytes.length + obj5Footer.length;

  const xref = `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((o) => String(o).padStart(10, "0") + " 00000 n ").join("\n")}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  // Since we have binary data, we need to assemble as bytes
  const textBefore = encoder.encode(header + obj1 + obj2 + obj3 + obj4 + obj5Header);
  const textAfter = encoder.encode(obj5Footer + xref);

  const result = new Uint8Array(textBefore.length + imgBytes.length + textAfter.length);
  result.set(textBefore, 0);
  result.set(imgBytes, textBefore.length);
  result.set(textAfter, textBefore.length + imgBytes.length);

  return result;
}
