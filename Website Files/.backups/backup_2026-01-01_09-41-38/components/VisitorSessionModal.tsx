import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Clock,
  Globe,
  MousePointer,
  Eye,
  ExternalLink,
  ChevronRight,
  MapPin,
  Monitor,
  Search,
  Share2,
} from "lucide-react";

export interface VisitorSession {
  sessionId: string;
  ip: string;
  referrerSource: string; // "Google", "Bing", "Facebook", "Direct", etc.
  referrerTerm?: string; // Search term if applicable
  referrerUrl?: string; // Full referrer URL
  startTime: Date;
  endTime?: Date;
  totalTime: number; // in seconds
  totalPageViews: number;
  pages: Array<{
    path: string;
    title: string;
    timestamp: Date;
    timeOnPage?: number; // in seconds
  }>;
  exitPage: string;
  location?: {
    city?: string;
    country?: string;
  };
  device?: {
    type: "mobile" | "tablet" | "desktop";
    browser: string;
    os: string;
  };
}

interface VisitorSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  sessions: VisitorSession[];
}

export function VisitorSessionModal({
  isOpen,
  onClose,
  date,
  sessions,
}: VisitorSessionModalProps) {
  const [selectedSession, setSelectedSession] = useState<VisitorSession | null>(
    null
  );

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getSourceIcon = (source: string) => {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes("google")) return <Search className="w-4 h-4" />;
    if (
      lowerSource.includes("facebook") ||
      lowerSource.includes("twitter") ||
      lowerSource.includes("linkedin")
    )
      return <Share2 className="w-4 h-4" />;
    if (lowerSource === "direct") return <Globe className="w-4 h-4" />;
    return <ExternalLink className="w-4 h-4" />;
  };

  const getSourceColor = (source: string) => {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes("google"))
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    if (lowerSource.includes("bing"))
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    if (lowerSource.includes("facebook"))
      return "bg-blue-600/20 text-blue-300 border-blue-600/30";
    if (lowerSource.includes("twitter"))
      return "bg-sky-500/20 text-sky-300 border-sky-500/30";
    if (lowerSource === "direct")
      return "bg-green-500/20 text-green-300 border-green-500/30";
    return "bg-purple-500/20 text-purple-300 border-purple-500/30";
  };

  type DisplayNamesCtor = new (
    locales: string | string[],
    options: { type: "region" }
  ) => { of(code: string): string | undefined };

  const getRegionName = (code: string): string | undefined => {
    try {
      const intl = (
        globalThis as unknown as {
          Intl?: { DisplayNames?: DisplayNamesCtor };
        }
      ).Intl;
      if (!intl || !intl.DisplayNames) return undefined;
      const dn = new intl.DisplayNames(["en"], { type: "region" });
      return typeof dn.of === "function" ? dn.of(code) : undefined;
    } catch {
      return undefined;
    }
  };

  const countryName = (codeOrName?: string): string | undefined => {
    if (!codeOrName) return undefined;
    // If it's a two-letter code, try Intl lookup; otherwise return as-is
    const maybeCode = codeOrName.trim();
    if (/^[A-Za-z]{2}$/.test(maybeCode)) {
      try {
        const name = getRegionName(maybeCode.toUpperCase());
        return name || maybeCode.toUpperCase();
      } catch {
        return maybeCode.toUpperCase();
      }
    }
    return codeOrName;
  };

  const countryFlag = (codeOrName?: string): string => {
    if (!codeOrName) return "";
    const maybeCode = codeOrName.trim();
    if (!/^[A-Za-z]{2}$/.test(maybeCode)) return "";
    try {
      const cc = maybeCode.toUpperCase();
      return cc
        .split("")
        .map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
        .join("");
    } catch {
      return "";
    }
  };

  const getPageName = (path: string) => {
    if (path === "/" || path === "/home") return "Home";
    if (path === "/pc-builder") return "PC Builder";
    if (path === "/pc-finder") return "PC Finder";
    if (path === "/about") return "About";
    if (path === "/contact") return "Contact";
    if (path === "/business-solutions") return "Business Solutions";
    if (path === "/repair") return "Repair Service";
    if (path === "/member") return "Member Area";
    if (path.startsWith("/blog/")) return "Blog Post";
    if (path === "/blog") return "Blog";
    return path;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-h-[90vh] bg-gray-900 border-white/10"
        style={{ width: "95vw", maxWidth: "1350px" }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Visitor Sessions -{" "}
            {new Date(date).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {sessions.length} total visitors
            </span>
            <span className="flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              {sessions.reduce((sum, s) => sum + s.totalPageViews, 0)} total
              views
            </span>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Visitor List */}
          <Card className="bg-white/5 border-white/10 p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-400" />
              All Visitors
            </h3>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {sessions.map((session, index) => (
                  <Card
                    key={session.sessionId}
                    onClick={() => setSelectedSession(session)}
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      selectedSession?.sessionId === session.sessionId
                        ? "bg-sky-500/20 border-sky-500/50 shadow-lg shadow-sky-500/20"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-sky-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-semibold">
                            Visitor #{index + 1}
                          </span>
                          <Badge
                            className={`text-xs ${getSourceColor(
                              session.referrerSource
                            )}`}
                          >
                            <span className="flex items-center gap-1">
                              {getSourceIcon(session.referrerSource)}
                              {session.referrerSource}
                            </span>
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {formatTime(session.startTime)}
                          </div>
                          {session.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {session.location.city},{" "}
                              {session.location.country}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 transition-all ${
                          selectedSession?.sessionId === session.sessionId
                            ? "text-sky-400 rotate-90"
                            : "text-gray-500"
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 pt-2 border-t border-white/10">
                      <span>{session.totalPageViews} pages</span>
                      <span>•</span>
                      <span>{formatDuration(session.totalTime)} duration</span>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Session Details */}
          <Card className="bg-white/5 border-white/10 p-4">
            {selectedSession ? (
              <>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-sky-400" />
                  Session Details
                </h3>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {/* Overview Section */}
                    <Card className="bg-white/5 border-white/10 p-4">
                      <h4 className="text-sm font-semibold text-sky-400 mb-3">
                        Overview
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">IP Address:</span>
                          <span className="text-white font-mono">
                            {selectedSession.ip}
                          </span>
                        </div>
                        {selectedSession.location?.country && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">
                              Country of Origin:
                            </span>
                            <span className="text-white">
                              {countryFlag(selectedSession.location.country)}
                              <span className="ml-1">
                                {countryName(selectedSession.location.country)}
                              </span>
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Arrived:</span>
                          <span className="text-white">
                            {formatTime(selectedSession.startTime)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Time:</span>
                          <span className="text-white">
                            {formatDuration(selectedSession.totalTime)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Pages:</span>
                          <span className="text-white">
                            {selectedSession.totalPageViews}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Exit Page:</span>
                          <span className="text-white">
                            {getPageName(selectedSession.exitPage)}
                          </span>
                        </div>
                      </div>
                    </Card>

                    {/* Source Section */}
                    <Card className="bg-white/5 border-white/10 p-4">
                      <h4 className="text-sm font-semibold text-sky-400 mb-3">
                        Traffic Source
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Source:</span>
                          <Badge
                            className={`${getSourceColor(
                              selectedSession.referrerSource
                            )}`}
                          >
                            <span className="flex items-center gap-1">
                              {getSourceIcon(selectedSession.referrerSource)}
                              {selectedSession.referrerSource}
                            </span>
                          </Badge>
                        </div>
                        {selectedSession.referrerTerm && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Search Term:</span>
                            <span className="text-white">
                              "{selectedSession.referrerTerm}"
                            </span>
                          </div>
                        )}
                        {selectedSession.referrerUrl && (
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-400">Referrer URL:</span>
                            <a
                              href={selectedSession.referrerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-400 hover:text-sky-300 text-xs break-all flex items-center gap-1"
                            >
                              {selectedSession.referrerUrl}
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Device Info */}
                    {selectedSession.device && (
                      <Card className="bg-white/5 border-white/10 p-4">
                        <h4 className="text-sm font-semibold text-sky-400 mb-3 flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          Device Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Type:</span>
                            <Badge className="bg-white/10 text-white border-white/20 capitalize">
                              {selectedSession.device.type}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Browser:</span>
                            <span className="text-white">
                              {selectedSession.device.browser}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">OS:</span>
                            <span className="text-white">
                              {selectedSession.device.os}
                            </span>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Location */}
                    {selectedSession.location && (
                      <Card className="bg-white/5 border-white/10 p-4">
                        <h4 className="text-sm font-semibold text-sky-400 mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location
                        </h4>
                        <div className="space-y-2 text-sm">
                          {selectedSession.location.city && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">City:</span>
                              <span className="text-white">
                                {selectedSession.location.city}
                              </span>
                            </div>
                          )}
                          {selectedSession.location.country && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Country:</span>
                              <span className="text-white">
                                {selectedSession.location.country}
                              </span>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    {/* Page Journey */}
                    <Card className="bg-white/5 border-white/10 p-4">
                      <h4 className="text-sm font-semibold text-sky-400 mb-3">
                        Page Journey
                      </h4>
                      <div className="space-y-3">
                        {selectedSession.pages.map((page, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 pb-3 border-b border-white/10 last:border-0"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xs font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium mb-1">
                                {getPageName(page.path)}
                              </div>
                              <div className="text-xs text-gray-400 space-y-1">
                                <div>
                                  {formatTime(page.timestamp)}
                                  {page.timeOnPage && (
                                    <span className="ml-2 text-sky-400">
                                      • {formatDuration(page.timeOnPage)}
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-500 break-all">
                                  {page.path}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="h-[500px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MousePointer className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a visitor to view details</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
