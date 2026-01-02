import React, { memo } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Wind,
  ChevronUp,
  Settings,
  Thermometer,
  Monitor,
  Usb,
  RefreshCw,
  HelpCircle,
} from "lucide-react";

export interface EnvironmentState {
  ambientTemp: number;
  usb: {
    captureCard: boolean;
    externalSSD: boolean;
    webcam4k: boolean;
    audioInterface: boolean;
    keyboard: boolean;
    mouse: boolean;
  };
  displays: { resolution: string; refreshRate: number; connection: string }[];
  showPanel: boolean;
}

interface EnvironmentSettingsProps {
  environment: EnvironmentState;
  setEnvironment: React.Dispatch<React.SetStateAction<EnvironmentState>>;
  showPriceSubTierTag: boolean;
  setShowPriceSubTierTag: (v: boolean) => void;
}

export const EnvironmentSettings = memo(
  ({
    environment,
    setEnvironment,
    showPriceSubTierTag,
    setShowPriceSubTierTag,
  }: EnvironmentSettingsProps) => {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-sky-500/30 rounded-xl p-3 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-sky-400" />
            <h4 className="text-white font-semibold text-lg md:text-xl">
              Your Setup Details
            </h4>
          </div>
        </div>
        <div className="mt-3 mb-2 flex items-center gap-2">
          <Button
            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs px-3"
            size="sm"
            onClick={() =>
              setEnvironment((e) => ({
                ...e,
                showPanel: !e.showPanel,
              }))
            }
          >
            {environment.showPanel ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" /> Hide
              </>
            ) : (
              <>
                <Settings className="w-3 h-3 mr-1" /> Customise
              </>
            )}
          </Button>
          {environment.showPanel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white text-xs"
              onClick={() =>
                setEnvironment((env) => ({
                  ...env,
                  ambientTemp: 22,
                  usb: {
                    captureCard: false,
                    externalSSD: false,
                    webcam4k: false,
                    audioInterface: false,
                    keyboard: false,
                    mouse: false,
                  },
                  displays: [
                    {
                      resolution: "1920x1080",
                      refreshRate: 60,
                      connection: "HDMI 2.0",
                    },
                  ],
                }))
              }
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Reset to defaults
            </Button>
          )}
          {!environment.showPanel && (
            <p className="text-[11px] text-gray-400">
              Adjust room, devices & monitor for precise advice
            </p>
          )}
        </div>
        {!environment.showPanel && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-gray-400">
              Tell us about your room temperature, peripherals, and monitor for
              personalised recommendations
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
                  <Thermometer className="w-3 h-3 mr-1" /> Room{" "}
                  {environment.ambientTemp}°C
                </Badge>
                <Badge className="bg-blue-500/20 border-blue-500/40 text-blue-300">
                  <Monitor className="w-3 h-3 mr-1" />
                  {(environment.displays?.[0]?.resolution || "1080p")
                    .replace("1920x1080", "1080p")
                    .replace("2560x1440", "1440p")
                    .replace("3840x2160", "4K")}{" "}
                  {" @ "}
                  {String(environment.displays?.[0]?.refreshRate || 60)}Hz
                </Badge>
                <Badge className="bg-cyan-500/20 border-cyan-500/40 text-cyan-300">
                  <Usb className="w-3 h-3 mr-1" />
                  {(environment.usb.captureCard ? 1 : 0) +
                    (environment.usb.externalSSD ? 1 : 0) +
                    (environment.usb.webcam4k ? 1 : 0) +
                    (environment.usb.audioInterface ? 1 : 0)}{" "}
                  devices
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">
                    Price insight label
                  </span>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Show "Budget", "Mid-Range", or "Premium" labels in
                          build analysis
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  checked={showPriceSubTierTag}
                  onCheckedChange={(v) => setShowPriceSubTierTag(Boolean(v))}
                />
              </div>
            </div>
          </div>
        )}
        {/* Animated expand/collapse for the detailed panel */}
        <div
          className={`transition-all duration-300 grid ${
            environment.showPanel
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
          aria-expanded={environment.showPanel}
        >
          <div className="overflow-hidden">
            <div className="mt-3 space-y-4">
              <p className="text-xs text-gray-400">
                This helps us provide accurate cooling, connectivity, and
                performance advice tailored to your setup.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr] gap-x-4 gap-y-4 lg:items-start">
                {/* Ambient temperature */}
                <div className="flex flex-col">
                  <label className="block text-xs text-gray-300 mb-1 font-medium text-center">
                    Room Temperature
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={10}
                      max={40}
                      step={1}
                      value={environment.ambientTemp}
                      onChange={(e) =>
                        setEnvironment((env) => ({
                          ...env,
                          ambientTemp: Number(e.target.value || 0),
                        }))
                      }
                      className="bg-black/40 border-white/10 text-white pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      °C
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <button
                      onClick={() =>
                        setEnvironment((env) => ({
                          ...env,
                          ambientTemp: Math.max(10, (env.ambientTemp ?? 0) - 1),
                        }))
                      }
                      className="h-6 w-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-sm transition-all"
                    >
                      –
                    </button>
                    <button
                      onClick={() =>
                        setEnvironment((env) => ({
                          ...env,
                          ambientTemp: Math.min(40, (env.ambientTemp ?? 0) + 1),
                        }))
                      }
                      className="h-6 w-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-sm transition-all"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Warmer rooms need better cooling
                  </p>
                </div>

                {/* USB devices quick toggles with tooltips */}
                <div className="flex flex-col">
                  <label className="block text-xs text-gray-300 mb-1 font-medium text-center">
                    Devices You'll Connect
                  </label>
                  <TooltipProvider delayDuration={150}>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {[
                        {
                          k: "captureCard",
                          label: "Capture Card",
                          tip: "High bandwidth; use USB 3.2 Gen1+",
                        },
                        {
                          k: "externalSSD",
                          label: "External SSD",
                          tip: "Prefer USB 3.2 Gen2/4 or Thunderbolt",
                        },
                        {
                          k: "webcam4k",
                          label: "4K Webcam",
                          tip: "UHD webcams need high bitrate; USB 3.0+",
                        },
                        {
                          k: "audioInterface",
                          label: "Audio Interface",
                          tip: "Low-latency; USB 2.0 OK, avoid hubs",
                        },
                        {
                          k: "keyboard",
                          label: "Keyboard",
                          tip: "Wired keyboards use USB 2.0, wireless may need USB 3.0",
                        },
                        {
                          k: "mouse",
                          label: "Mouse",
                          tip: "Gaming mice benefit from USB 3.0 for lower latency",
                        },
                      ].map((opt) => (
                        <Tooltip key={opt.k}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() =>
                                setEnvironment((env) => ({
                                  ...env,
                                  usb: {
                                    ...env.usb,
                                    [opt.k]:
                                      !env.usb[opt.k as keyof typeof env.usb],
                                  },
                                }))
                              }
                              className={`min-w-[90px] h-10 px-3 rounded-md border transition-all text-center flex items-center justify-center ${
                                environment.usb[
                                  opt.k as keyof typeof environment.usb
                                ]
                                  ? "bg-sky-500/20 border-sky-500/40 text-sky-300"
                                  : "bg-black/30 border-white/10 text-gray-300 hover:border-white/20"
                              }`}
                            >
                              {opt.label}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="text-xs">{opt.tip}</span>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                  <p className="text-xs text-gray-500 mt-1">
                    Helps check USB bandwidth
                  </p>
                </div>

                {/* Your Main Monitor with dropdowns */}
                <div className="flex flex-col min-w-0">
                  <label className="block text-xs text-gray-300 mb-1 font-medium text-center whitespace-normal leading-tight">
                    Your Main Monitor
                  </label>
                  <div className="space-y-2">
                    {/* Resolution */}
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">
                        Resolution
                      </label>
                      <Select
                        value={
                          environment.displays[0]?.resolution || "1920x1080"
                        }
                        onValueChange={(v) =>
                          setEnvironment((env) => ({
                            ...env,
                            displays: [
                              { ...env.displays[0], resolution: v },
                              ...env.displays.slice(1),
                            ],
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 bg-black/40 border-white/10 text-white text-xs">
                          <SelectValue placeholder="Resolution" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1920x1080">1080p</SelectItem>
                          <SelectItem value="2560x1440">1440p</SelectItem>
                          <SelectItem value="3840x2160">4K</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Refresh Rate */}
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">
                        Refresh Rate
                      </label>
                      <Select
                        value={String(
                          environment.displays[0]?.refreshRate || 60
                        )}
                        onValueChange={(v) =>
                          setEnvironment((env) => ({
                            ...env,
                            displays: [
                              { ...env.displays[0], refreshRate: Number(v) },
                              ...env.displays.slice(1),
                            ],
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 bg-black/40 border-white/10 text-white text-xs">
                          <SelectValue placeholder="Refresh Rate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">60Hz</SelectItem>
                          <SelectItem value="120">120Hz</SelectItem>
                          <SelectItem value="144">144Hz</SelectItem>
                          <SelectItem value="165">165Hz</SelectItem>
                          <SelectItem value="240">240Hz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Connectivity */}
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">
                        Connectivity
                      </label>
                      <Select
                        value={
                          environment.displays[0]?.connection || "HDMI 2.0"
                        }
                        onValueChange={(v) =>
                          setEnvironment((env) => ({
                            ...env,
                            displays: [
                              { ...env.displays[0], connection: v },
                              ...env.displays.slice(1),
                            ],
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 bg-black/40 border-white/10 text-white text-xs">
                          <SelectValue placeholder="Connectivity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HDMI 2.0">HDMI 2.0</SelectItem>
                          <SelectItem value="HDMI 2.1">HDMI 2.1</SelectItem>
                          <SelectItem value="DisplayPort 1.4">
                            DisplayPort 1.4
                          </SelectItem>
                          <SelectItem value="DisplayPort 2.0">
                            DisplayPort 2.0
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

EnvironmentSettings.displayName = "EnvironmentSettings";
