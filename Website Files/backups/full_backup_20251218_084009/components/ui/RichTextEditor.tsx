import React, { useRef, useState, useEffect } from "react";
import { Button } from "./button";
import { Card } from "./card";
import {
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  MousePointerClick,
} from "lucide-react";
import { storage, app } from "../../config/firebase";
import { uploadEmailAsset } from "../../services/storage";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onImageInsert?: (url: string) => void;
}

// Minimal toolbar commands mapping
const COMMANDS: Array<{ label: string; cmd: string; arg?: string }> = [
  { label: "Bold", cmd: "bold" },
  { label: "Italic", cmd: "italic" },
  { label: "Underline", cmd: "underline" },
  { label: "H1", cmd: "formatBlock", arg: "h1" },
  { label: "H2", cmd: "formatBlock", arg: "h2" },
  { label: "List", cmd: "insertUnorderedList" },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onImageInsert,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Narrow access to app options to detect storage bucket without using 'any'
  const hasStorage =
    !!storage &&
    Boolean(
      app &&
        (app as unknown as { options?: { storageBucket?: string } }).options
          ?.storageBucket
    );

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const insertLink = () => {
    const url = prompt("Enter URL (https://...)");
    if (!url) return;
    const safe = sanitizeUrl(url);
    if (!safe) {
      setError("Invalid URL. Must start with http:// or https://");
      return;
    }
    const sel = window.getSelection();
    const text =
      sel && sel.toString() ? sel.toString() : prompt("Link text") || safe;
    document.execCommand(
      "insertHTML",
      false,
      `<a href="${safe}" style="color:#0ea5e9;text-decoration:none;" target="_blank" rel="noopener noreferrer">${escapeHtml(
        text
      )}</a>`
    );
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const insertImageByUrl = () => {
    const url = prompt("Enter image URL (https://...)");
    if (!url) return;
    const safe = sanitizeUrl(url);
    if (!safe) {
      setError("Invalid image URL. Must start with http:// or https://");
      return;
    }
    document.execCommand(
      "insertHTML",
      false,
      `<img src="${safe}" alt="Image" style="max-width:100%;border-radius:8px;" />`
    );
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const insertCTAButton = () => {
    const url = prompt("CTA button URL (https://...)");
    if (!url) return;
    const safeUrl = sanitizeUrl(url);
    if (!safeUrl) {
      setError("Invalid URL for CTA button.");
      return;
    }
    const label = prompt("Button label", "Learn More") || "Learn More";
    const safeLabel = escapeHtml(label);
    const html = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:linear-gradient(90deg,#0ea5e9,#2563eb);color:#ffffff;font-weight:600;padding:12px 20px;border-radius:8px;text-decoration:none;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:14px;">${safeLabel}</a>`;
    document.execCommand("insertHTML", false, html);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handlePaste: React.ClipboardEventHandler<HTMLDivElement> = (e) => {
    // Basic paste sanitation: strip scripts/styles
    const html = e.clipboardData.getData("text/html");
    if (html) {
      e.preventDefault();
      const cleaned = sanitize(html);
      document.execCommand("insertHTML", false, cleaned);
      if (ref.current) onChange(ref.current.innerHTML);
    }
  };

  const sanitize = (html: string) => {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/on\w+="[^"]*"/g, "")
      .replace(/javascript:/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  };

  const sanitizeUrl = (url: string): string | null => {
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) return null;
    // Basic XSS guard: disallow javascript:, data: except images maybe (skip for now)
    if (/^javascript:/i.test(trimmed)) return null;
    return trimmed.replace(/"/g, "%22");
  };

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setUploading(true);
      const asset = await uploadEmailAsset(file);
      if (ref.current) {
        document.execCommand(
          "insertHTML",
          false,
          `<img src="${asset.url}" alt="${asset.name}" style="max-width:100%;border-radius:8px;" />`
        );
        onChange(ref.current.innerHTML);
      }
      onImageInsert?.(asset.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
      <div className="flex flex-wrap gap-2 mb-3">
        {COMMANDS.map((c) => (
          <Button
            key={c.label}
            type="button"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 text-xs py-1 px-2"
            onClick={() => exec(c.cmd, c.arg)}
          >
            {c.label}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 text-xs py-1 px-2"
          onClick={insertLink}
        >
          <LinkIcon className="w-4 h-4 mr-1" /> Link
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 text-xs py-1 px-2"
          onClick={insertImageByUrl}
        >
          <ImageIcon className="w-4 h-4 mr-1" /> Img URL
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 text-xs py-1 px-2"
          onClick={insertCTAButton}
        >
          <MousePointerClick className="w-4 h-4 mr-1" /> CTA
        </Button>
        {hasStorage && (
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title="Upload image"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="border-sky-500/30 text-sky-300 hover:bg-sky-500/10 text-xs py-1 px-2"
            >
              <Upload className="w-4 h-4 mr-1" /> Upload
            </Button>
          </div>
        )}
        {uploading && (
          <span className="text-xs text-sky-400">Uploading...</span>
        )}
      </div>
      {error && <div className="text-xs text-red-400 mb-2">{error}</div>}
      <div
        ref={ref}
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        onPaste={handlePaste}
        className="min-h-[220px] rounded-md border border-white/10 bg-black/20 p-3 focus:outline-none text-sm text-gray-200"
        contentEditable
        suppressContentEditableWarning
        aria-label="Rich text editor"
      />
      <div className="mt-2 text-[10px] text-gray-400 space-y-1 leading-relaxed">
        <div>Tips:</div>
        <div>
          • Select text then click Link, or click Link and enter both URL and
          text.
        </div>
        <div>
          • Use Img URL for external images.{" "}
          {hasStorage
            ? " Upload stores in Firebase."
            : " Upload hidden (no storage)."}
        </div>
        <div>• CTA adds a styled gradient button.</div>
        <div>
          • Only http/https URLs accepted; scripts/styles stripped
          automatically.
        </div>
      </div>
    </Card>
  );
};

export default RichTextEditor;
