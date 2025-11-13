// Shared file validation utilities for attachments
// Centralizes allowed types, size checks, and basic file signature sniffing.

export const ALLOWED_MIME_TYPES = new Set<string>([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB per file
export const MAX_TOTAL_BYTES = 25 * 1024 * 1024; // 25MB all selected files

// Minimal signature checks for a few formats. Not a replacement for server-side scanning.
export async function sniffSignature(file: File): Promise<{
  ok: boolean;
  reason?: string;
}> {
  try {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const isPDF =
      header[0] === 0x25 &&
      header[1] === 0x50 &&
      header[2] === 0x44 &&
      header[3] === 0x46; // %PDF
    const isPNG =
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47; // \x89PNG
    const isJPG =
      header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff; // JFIF/EXIF
    const isGIF =
      header[0] === 0x47 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x38; // GIF8
    const isRIFF =
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46; // RIFF (WEBP)

    if (file.type === "application/pdf" && !isPDF) {
      return { ok: false, reason: "Signature mismatch for PDF" };
    }
    if (file.type === "image/png" && !isPNG) {
      return { ok: false, reason: "Signature mismatch for PNG" };
    }
    if (file.type === "image/jpeg" && !isJPG) {
      return { ok: false, reason: "Signature mismatch for JPEG" };
    }
    if (file.type === "image/gif" && !isGIF) {
      return { ok: false, reason: "Signature mismatch for GIF" };
    }
    if (file.type === "image/webp" && !isRIFF) {
      return { ok: false, reason: "Signature mismatch for WEBP" };
    }
    return { ok: true };
  } catch {
    // If we can't read the header, allow by default and rely on server scan.
    return { ok: true };
  }
}

export function validateFileBasic(file: File): {
  ok: boolean;
  reason?: string;
} {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { ok: false, reason: `Type ${file.type || "unknown"} not allowed` };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      reason: `Exceeds per-file limit of ${Math.round(
        MAX_FILE_BYTES / (1024 * 1024)
      )}MB`,
    };
  }
  return { ok: true };
}

export async function filterAcceptableFiles(
  incoming: File[],
  existingTotalBytes: number
): Promise<File[]> {
  const accepted: File[] = [];
  let added = 0;
  for (const f of incoming) {
    const basic = validateFileBasic(f);
    if (!basic.ok) {
      alert(`Rejected ${f.name}: ${basic.reason}`);
      continue;
    }
    if (existingTotalBytes + added + f.size > MAX_TOTAL_BYTES) {
      alert(
        `Rejected ${f.name}: total size would exceed ${Math.round(
          MAX_TOTAL_BYTES / (1024 * 1024)
        )}MB limit`
      );
      continue;
    }
    const sig = await sniffSignature(f);
    if (!sig.ok) {
      alert(`Rejected ${f.name}: ${sig.reason}`);
      continue;
    }
    accepted.push(f);
    added += f.size;
  }
  return accepted;
}
