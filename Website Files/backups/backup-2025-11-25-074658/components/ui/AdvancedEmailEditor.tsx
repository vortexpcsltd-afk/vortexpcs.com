import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./button";
import { Card } from "./card";
import { Input } from "./input";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List as ListIcon,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Eraser,
  MousePointerClick,
  Minus,
  Table,
  Code,
} from "lucide-react";
import { uploadEmailAsset } from "../../services/storage";
import { storage, app } from "../../config/firebase";

interface AdvancedEmailEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const FONTS = [
  {
    label: "System",
    value: "system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif",
  },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Roboto", value: "Roboto, Helvetica, Arial, sans-serif" },
];

const SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

const AdvancedEmailEditor: React.FC<AdvancedEmailEditorProps> = ({
  value,
  onChange,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [font, setFont] = useState(FONTS[0].value);
  const [size, setSize] = useState<number>(16);
  const [color, setColor] = useState<string>("#e5e7eb");
  const [bg, setBg] = useState<string>("transparent");

  const hasStorage = useMemo(
    () =>
      !!storage &&
      Boolean(
        app &&
          (app as unknown as { options?: { storageBucket?: string } }).options
            ?.storageBucket
      ),
    []
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

  const getSelectionHtml = (): string | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0).cloneRange();
    const container = document.createElement("div");
    container.appendChild(range.cloneContents());
    return container.innerHTML;
  };

  const applyInlineStyle = (style: Partial<CSSStyleDeclaration>) => {
    const html = getSelectionHtml();
    if (!html) return;
    const span = document.createElement("span");
    Object.assign(span.style, style);
    span.innerHTML = html;
    document.execCommand("insertHTML", false, span.outerHTML);
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

  const insertTable = () => {
    const rows = prompt("Number of rows", "3");
    const cols = prompt("Number of columns", "3");
    if (!rows || !cols) return;
    const r = parseInt(rows, 10);
    const c = parseInt(cols, 10);
    if (isNaN(r) || isNaN(c) || r < 1 || c < 1) {
      setError("Invalid table dimensions.");
      return;
    }
    let tableHtml = `<table style="border-collapse:collapse;width:100%;margin:12px 0;">`;
    for (let i = 0; i < r; i++) {
      tableHtml += `<tr>`;
      for (let j = 0; j < c; j++) {
        tableHtml += `<td style="border:1px solid #374151;padding:8px;background:#0f172a;color:#e5e7eb;">${
          i === 0 ? `Header ${j + 1}` : `Cell`
        }</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</table>`;
    document.execCommand("insertHTML", false, tableHtml);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const insertCodeBlock = () => {
    const code = prompt("Enter code snippet");
    if (!code) return;
    const escaped = escapeHtml(code);
    const html = `<pre style="background:#0b1220;border:1px solid #374151;padding:12px;border-radius:6px;overflow-x:auto;font-family:'Courier New',Courier,monospace;font-size:13px;color:#e5e7eb;margin:12px 0;">${escaped}</pre>`;
    document.execCommand("insertHTML", false, html);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const alignImage = (alignment: "left" | "center" | "right") => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.focusNode?.parentElement;
    if (node && node.tagName === "IMG") {
      const img = node as HTMLImageElement;
      let style = "max-width:100%;border-radius:8px;";
      if (alignment === "center") style += "display:block;margin:0 auto;";
      else if (alignment === "left")
        style += "float:left;margin:0 12px 12px 0;";
      else if (alignment === "right")
        style += "float:right;margin:0 0 12px 12px;";
      img.setAttribute("style", style);
      if (ref.current) onChange(ref.current.innerHTML);
    }
  };

  const handlePaste: React.ClipboardEventHandler<HTMLDivElement> = (e) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Font family */}
        <select
          value={font}
          onChange={(e) => {
            setFont(e.target.value);
            applyInlineStyle({ fontFamily: e.target.value });
          }}
          className="h-8 bg-black/30 border border-white/10 text-white text-xs rounded px-2"
          title="Font family"
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value} className="bg-slate-900">
              {f.label}
            </option>
          ))}
        </select>
        {/* Font size */}
        <select
          value={size}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            setSize(v);
            applyInlineStyle({ fontSize: `${v}px` });
          }}
          className="h-8 bg-black/30 border border-white/10 text-white text-xs rounded px-2"
          title="Font size"
        >
          {SIZES.map((s) => (
            <option key={s} value={s} className="bg-slate-900">
              {s}px
            </option>
          ))}
        </select>
        {/* Color pickers */}
        <label className="flex items-center gap-1 text-xs text-gray-300">
          Text
          <Input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              applyInlineStyle({ color: e.target.value });
            }}
            className="h-8 w-10 bg-transparent border-white/10 p-0"
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-300">
          Background
          <Input
            type="color"
            value={bg}
            onChange={(e) => {
              setBg(e.target.value);
              applyInlineStyle({ backgroundColor: e.target.value });
            }}
            className="h-8 w-10 bg-transparent border-white/10 p-0"
          />
        </label>

        {/* Basic formatting */}
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => exec("bold")}
        >
          {" "}
          <Bold className="w-4 h-4" />{" "}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => exec("italic")}
        >
          {" "}
          <Italic className="w-4 h-4" />{" "}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => exec("underline")}
        >
          {" "}
          <Underline className="w-4 h-4" />{" "}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => exec("strikeThrough")}
        >
          {" "}
          <Strikethrough className="w-4 h-4" />{" "}
        </Button>

        {/* Alignment */}
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => exec("justifyLeft")}
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => exec("justifyCenter")}
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => exec("justifyRight")}
        >
          <AlignRight className="w-4 h-4" />
        </Button>

        {/* Lists */}
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => exec("insertUnorderedList")}
        >
          <ListIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => exec("insertOrderedList")}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        {/* Block */}
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => exec("formatBlock", "blockquote")}
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => exec("insertHorizontalRule")}
        >
          <Minus className="w-4 h-4" />
        </Button>

        {/* Undo/Redo & Clear */}
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => exec("undo")}
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => exec("redo")}
        >
          <Redo2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          title="Clear formatting"
          onClick={() => exec("removeFormat")}
        >
          <Eraser className="w-4 h-4" />
        </Button>

        {/* Link / Image / CTA */}
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={insertLink}
        >
          <LinkIcon className="w-4 h-4 mr-1" /> Link
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={insertImageByUrl}
        >
          <ImageIcon className="w-4 h-4 mr-1" /> Img URL
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={insertCTAButton}
        >
          <MousePointerClick className="w-4 h-4 mr-1" /> CTA
        </Button>

        {/* Table & Code */}
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={insertTable}
          title="Insert table"
        >
          <Table className="w-4 h-4 mr-1" /> Table
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={insertCodeBlock}
          title="Insert code block"
        >
          <Code className="w-4 h-4 mr-1" /> Code
        </Button>

        {/* Image alignment (select image first) */}
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => alignImage("left")}
          title="Align image left"
        >
          Img ←
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => alignImage("center")}
          title="Align image center"
        >
          Img ↔
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 h-8 px-2"
          onClick={() => alignImage("right")}
          title="Align image right"
        >
          Img →
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
              className="border-sky-500/30 text-sky-300 hover:bg-sky-500/10 h-8 px-2"
            >
              <ImageIcon className="w-4 h-4 mr-1" /> Upload
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
        className="min-h-[260px] rounded-md border border-white/10 bg-black/20 p-3 focus:outline-none text-sm text-gray-200"
        contentEditable
        suppressContentEditableWarning
        aria-label="Advanced email editor"
      />
      <div className="mt-2 text-[10px] text-gray-400 space-y-1 leading-relaxed">
        <div>Tips:</div>
        <div>
          • Use font, size, color, alignment for fine control. Clear removes
          formatting on selection.
        </div>
        <div>
          • Table: Creates styled table. Code: Inserts monospace code block.
        </div>
        <div>
          • Image alignment: Select an inserted image, then click Img ←/↔/→ to
          position it.
        </div>
        <div>
          • CTA inserts a styled gradient button (transformed to bulletproof
          markup on send).
        </div>
        <div>
          • For best email client support, keep layout simple and prefer inline
          styles.
        </div>
      </div>
    </Card>
  );
};

export default AdvancedEmailEditor;
