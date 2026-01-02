import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface ShareBarProps {
  title: string;
  url?: string;
  className?: string;
}

export function ShareBar({ title, url, className }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => {
    if (url) return url;
    if (typeof window !== "undefined") return window.location.href;
    return "";
  }, [url]);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const links = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  } as const;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <Card
      className={`bg-white/5 backdrop-blur-xl border-white/10 p-3 flex flex-row flex-wrap items-center gap-2 sm:gap-3 ${
        className || ""
      }`}
    >
      <span className="text-xs text-gray-400 mr-2 shrink-0">Share:</span>
      <a
        className="inline-flex shrink-0"
        href={links.twitter}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button size="sm" className="bg-white/10 hover:bg-white/20">
          X / Twitter
        </Button>
      </a>
      <a
        className="inline-flex shrink-0"
        href={links.linkedin}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button size="sm" className="bg-white/10 hover:bg-white/20">
          LinkedIn
        </Button>
      </a>
      <a
        className="inline-flex shrink-0"
        href={links.facebook}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button size="sm" className="bg-white/10 hover:bg-white/20">
          Facebook
        </Button>
      </a>
      <span className="inline-flex shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={onCopy}
          className="border-white/20"
        >
          {copied ? "Copied" : "Copy link"}
        </Button>
      </span>
    </Card>
  );
}
