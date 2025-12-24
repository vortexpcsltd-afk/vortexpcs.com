import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../../ui/dialog";
import { VisuallyHidden } from "../../ui/visually-hidden";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { ProductSchema } from "../../seo/ProductSchema";
import { BrandLogo } from "../../ui/brand-logo";
import { FeaturedTag } from "../FeaturedTag";
import { PCBuilderComponent } from "../types";
import { PLACEHOLDER_IMAGE } from "../../data/pcBuilderComponents";
import { logger } from "../../../services/logger";
import { getSessionId } from "../../../services/sessionTracker";
import {
  Settings,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Star,
  Download,
} from "lucide-react";
import { Document } from "@contentful/rich-text-types";

interface ComponentDetailModalProps {
  component: PCBuilderComponent;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: string, componentId: string) => void;
  isSelected: boolean;
  renderRichText: (content?: string | Document) => React.ReactNode;
}

type ImageRef = string | { url?: string; src?: string };

const getImageUrl = (img: ImageRef): string =>
  typeof img === "string" ? img : img.url || img.src || PLACEHOLDER_IMAGE;

export const ComponentDetailModal = ({
  component,
  category,
  isOpen,
  onClose,
  onSelect,
  isSelected,
  renderRichText,
}: ComponentDetailModalProps) => {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const optionFields = ["colour", "color", "size", "style", "storage", "type"];
  const availableOptions = optionFields
    .map((field) => {
      const value = component[field as keyof typeof component];
      if (Array.isArray(value) && value.length > 1) {
        return { key: field, values: value };
      }
      if (typeof value === "string" && value.includes(",")) {
        return { key: field, values: value.split(",").map((v) => v.trim()) };
      }
      return null;
    })
    .filter(Boolean) as { key: string; values: string[] }[];

  const uniqueOptions = availableOptions.filter((opt, _index, self) => {
    if (opt.key === "color") {
      return !self.some((o) => o.key === "colour");
    }
    return true;
  });

  useEffect(() => {
    const defaults: Record<string, string> = {};
    uniqueOptions.forEach((opt) => {
      if (!selectedOptions[opt.key]) {
        defaults[opt.key] = opt.values[0];
      }
    });
    if (Object.keys(defaults).length > 0) {
      setSelectedOptions((prev) => ({ ...prev, ...defaults }));
    }
  }, [component?.id, selectedOptions, uniqueOptions]);

  const displayPrice = (() => {
    if (!component.pricesByOption) return component.price;

    const pricesByOpt = component.pricesByOption as Record<
      string,
      Record<string, number | { price: number; ean?: string }>
    >;

    for (const opt of uniqueOptions) {
      const sel = selectedOptions[opt.key];
      if (
        sel &&
        pricesByOpt[opt.key] &&
        pricesByOpt[opt.key][sel] !== undefined
      ) {
        const priceData = pricesByOpt[opt.key][sel];
        return typeof priceData === "number" ? priceData : priceData.price;
      }

      const altKey =
        opt.key === "colour" ? "color" : opt.key === "color" ? "colour" : null;
      if (
        altKey &&
        sel &&
        pricesByOpt[altKey] &&
        pricesByOpt[altKey][sel] !== undefined
      ) {
        const priceData = pricesByOpt[altKey][sel];
        return typeof priceData === "number" ? priceData : priceData.price;
      }
    }

    return component.price;
  })();

  const displayEan = (() => {
    if (!component.pricesByOption) return component.ean;

    const pricesByOpt = component.pricesByOption as Record<
      string,
      Record<string, number | { price: number; ean?: string }>
    >;

    for (const opt of uniqueOptions) {
      const sel = selectedOptions[opt.key];
      if (
        sel &&
        pricesByOpt[opt.key] &&
        pricesByOpt[opt.key][sel] !== undefined
      ) {
        const priceData = pricesByOpt[opt.key][sel];
        if (typeof priceData === "object" && priceData.ean) {
          return priceData.ean;
        }
      }

      const altKey =
        opt.key === "colour" ? "color" : opt.key === "color" ? "colour" : null;
      if (
        altKey &&
        sel &&
        pricesByOpt[altKey] &&
        pricesByOpt[altKey][sel] !== undefined
      ) {
        const priceData = pricesByOpt[altKey][sel];
        if (typeof priceData === "object" && priceData.ean) {
          return priceData.ean;
        }
      }
    }

    return component.ean;
  })();

  const detailImages: string[] = (() => {
    for (const opt of uniqueOptions) {
      const sel = selectedOptions[opt.key];
      if (sel && component.imagesByOption) {
        const imagesByOpt = component.imagesByOption as Record<
          string,
          Record<string, string[]>
        >;

        if (imagesByOpt[opt.key] && imagesByOpt[opt.key][sel]) {
          const imgs = imagesByOpt[opt.key][sel];
          if (imgs && imgs.length) return imgs;
        }

        const altKey =
          opt.key === "colour"
            ? "color"
            : opt.key === "color"
            ? "colour"
            : null;
        if (altKey && imagesByOpt[altKey] && imagesByOpt[altKey][sel]) {
          const imgs = imagesByOpt[altKey][sel];
          if (imgs && imgs.length) return imgs;
        }
      }
    }

    if (component?.images && component.images.length > 0) {
      return component.images.map((img) => getImageUrl(img as ImageRef));
    }

    return Array(4).fill(PLACEHOLDER_IMAGE);
  })();

  const selectedOptionsStr = JSON.stringify(selectedOptions);
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [component?.id, selectedOptionsStr]);

  if (!component) return null;

  const getSpecifications = () => {
    const specs: { label: string; value: string | number }[] = [];

    if (component.name) specs.push({ label: "Name", value: component.name });
    if (component.brand) specs.push({ label: "Brand", value: component.brand });
    if (component.model) specs.push({ label: "Model", value: component.model });
    if (component.price)
      specs.push({
        label: "Price",
        value: `£${(typeof displayPrice === "number"
          ? displayPrice
          : component.price
        ).toFixed(2)}`,
      });
    if (component.rating)
      specs.push({ label: "Rating", value: `${component.rating}/5` });

    switch (category) {
      case "case":
        if (component.brand)
          specs.push({ label: "Brand", value: component.brand });
        if (component.model)
          specs.push({ label: "Model", value: component.model });
        if (component.colourOptions)
          specs.push({
            label: "Colour Options",
            value: Array.isArray(component.colourOptions)
              ? component.colourOptions.join(", ")
              : component.colourOptions,
          });
        if (component.formFactor)
          specs.push({ label: "Form Factor", value: component.formFactor });
        if (component.style)
          specs.push({ label: "Style", value: component.style });
        if (component.maxGpuLength)
          specs.push({
            label: "Max GPU Length",
            value: `${component.maxGpuLength}mm`,
          });
        if (component.maxCpuCoolerHeight)
          specs.push({
            label: "Max CPU Cooler Height",
            value: `${component.maxCpuCoolerHeight}mm`,
          });
        if (component.maxPsuLength)
          specs.push({
            label: "Max PSU Length",
            value: `${component.maxPsuLength}mm`,
          });
        if (component.frontPanelPorts)
          specs.push({
            label: "Front Panel Ports",
            value: Array.isArray(component.frontPanelPorts)
              ? component.frontPanelPorts.join(", ")
              : component.frontPanelPorts,
          });
        if (component.compatibility)
          specs.push({
            label: "Compatibility",
            value: Array.isArray(component.compatibility)
              ? component.compatibility.join(", ")
              : String(component.compatibility || ""),
          });
        break;

      case "motherboard":
        if (component.formFactor)
          specs.push({ label: "Form Factor", value: component.formFactor });
        if (component.socket)
          specs.push({ label: "Socket", value: component.socket });
        if (component.chipset)
          specs.push({ label: "Chipset", value: component.chipset });
        if (component.cpuCompatability)
          specs.push({
            label: "CPU Compatability",
            value: Array.isArray(component.cpuCompatability)
              ? component.cpuCompatability.join(", ")
              : String(component.cpuCompatability),
          });
        if (component.ramSupport)
          specs.push({
            label: "RAM Support",
            value: Array.isArray(component.ramSupport)
              ? component.ramSupport.join(", ")
              : component.ramSupport,
          });
        if (component.maxRam)
          specs.push({ label: "Max RAM", value: `${component.maxRam}GB` });
        if (component.ramSlots)
          specs.push({ label: "RAM Slots", value: component.ramSlots });
        if (component.pciSlots)
          specs.push({ label: "PCIe Slots", value: component.pciSlots });
        if (component.m2Slots)
          specs.push({ label: "M.2 Slots", value: component.m2Slots });
        if (component.internalIOConnectors)
          specs.push({
            label: "Internal I/O Connectors",
            value: component.internalIOConnectors.join(", "),
          });
        if (component.backPanelIOPorts)
          specs.push({
            label: "Back Panel I/O Ports",
            value: component.backPanelIOPorts.join(", "),
          });
        break;

      case "cpu":
        if (component.socket)
          specs.push({ label: "Socket", value: component.socket });
        if (component.cores)
          specs.push({ label: "Cores", value: component.cores });
        if (component.threads)
          specs.push({ label: "Threads", value: component.threads });
        if (component.tdp)
          specs.push({ label: "TDP", value: `${component.tdp}W` });
        if (component.processorFamily)
          specs.push({
            label: "Processor Family",
            value: component.processorFamily,
          });
        if (component.processorGeneration)
          specs.push({
            label: "Generation",
            value: component.processorGeneration,
          });
        if (component.baseClock)
          specs.push({
            label: "Base Clock",
            value: `${component.baseClock} GHz`,
          });
        if (component.boostClock)
          specs.push({
            label: "Boost Clock",
            value: `${component.boostClock} GHz`,
          });
        if (component.processorOperatingModes)
          specs.push({
            label: "Operating Modes",
            value: Array.isArray(component.processorOperatingModes)
              ? component.processorOperatingModes.join(", ")
              : component.processorOperatingModes,
          });
        if (component.processorCache)
          specs.push({ label: "Cache", value: component.processorCache });
        if (component.performanceCores)
          specs.push({ label: "P-Cores", value: component.performanceCores });
        if (component.efficientCores)
          specs.push({ label: "E-Cores", value: component.efficientCores });
        if (component.integratedGraphics !== undefined)
          specs.push({
            label: "Integrated Graphics",
            value: component.integratedGraphics ? "Yes" : "No",
          });
        if (component.onBoardGraphicsCardModel)
          specs.push({
            label: "iGPU Model",
            value: component.onBoardGraphicsCardModel,
          });
        if (component.processorBasePower)
          specs.push({
            label: "Base Power",
            value: component.processorBasePower,
          });
        if (component.maximumTurboPower)
          specs.push({
            label: "Max Turbo Power",
            value: component.maximumTurboPower,
          });
        if (component.coolerIncluded !== undefined)
          specs.push({
            label: "Cooler Included",
            value: component.coolerIncluded ? "Yes" : "No",
          });
        if (component.generation)
          specs.push({ label: "Generation", value: component.generation });
        if (component.platform)
          specs.push({ label: "Platform", value: component.platform });
        break;

      case "gpu":
        if (component.chipsetManufacturer)
          specs.push({
            label: "Chipset Manufacturer",
            value: component.chipsetManufacturer,
          });
        if (component.graphicsChipset)
          specs.push({
            label: "Graphics Chipset",
            value: component.graphicsChipset,
          });
        if (component.memorySize)
          specs.push({ label: "Memory Size", value: component.memorySize });
        if (component.vram)
          specs.push({ label: "VRAM", value: `${component.vram}GB` });
        if (component.memoryType)
          specs.push({ label: "Memory Type", value: component.memoryType });
        if (component.cudaCores)
          specs.push({ label: "CUDA Cores", value: component.cudaCores });
        if (component.gpuBaseClock)
          specs.push({
            label: "Base Clock",
            value: `${component.gpuBaseClock} MHz`,
          });
        if (component.gpuBoostClock)
          specs.push({
            label: "Boost Clock",
            value: `${component.gpuBoostClock} MHz`,
          });
        if (component.interface)
          specs.push({ label: "Interface", value: component.interface });
        if (component.outputs)
          specs.push({
            label: "Outputs",
            value: Array.isArray(component.outputs)
              ? component.outputs.join(", ")
              : component.outputs,
          });
        if (component.maxDisplaySupport)
          specs.push({
            label: "Max Display Support",
            value: component.maxDisplaySupport,
          });
        if (component.powerConnecters)
          specs.push({
            label: "Power Connectors",
            value: component.powerConnecters.join(", "),
          });
        if (component.gpuCooling)
          specs.push({ label: "Cooling", value: component.gpuCooling });
        if (component.psuRequirements)
          specs.push({
            label: "PSU Requirements",
            value: component.psuRequirements,
          });
        if (component.connectorsRequired)
          specs.push({
            label: "Connectors Required",
            value: Array.isArray(component.connectorsRequired)
              ? component.connectorsRequired.join(", ")
              : component.connectorsRequired,
          });
        if (
          component.powerConsumption !== undefined ||
          component.power !== undefined ||
          component.powerDraw !== undefined
        ) {
          const gpuPower =
            (typeof component.powerConsumption === "number"
              ? component.powerConsumption
              : undefined) ??
            (typeof component.power === "number"
              ? component.power
              : undefined) ??
            (typeof component.powerDraw === "number"
              ? component.powerDraw
              : undefined);
          if (gpuPower !== undefined) {
            specs.push({ label: "Power Consumption", value: `${gpuPower}W` });
          }
        }
        if (component.length)
          specs.push({ label: "Length", value: `${component.length}mm` });
        if (component.height)
          specs.push({ label: "Height", value: `${component.height}mm` });
        if (component.slots)
          specs.push({ label: "Slots", value: component.slots });
        if (component.performance)
          specs.push({
            label: "Performance Tier",
            value: component.performance,
          });
        break;

      case "ram":
        if (component.capacity)
          specs.push({ label: "Capacity", value: `${component.capacity}GB` });
        if (component.type)
          specs.push({ label: "Type", value: component.type });
        if (component.speed)
          specs.push({ label: "Speed", value: `${component.speed}MHz` });
        if (component.modules)
          specs.push({ label: "Modules", value: component.modules });
        if (component.latency)
          specs.push({ label: "Latency", value: `CL${component.latency}` });
        if (component.voltage)
          specs.push({ label: "Voltage", value: `${component.voltage}V` });
        if (component.compliance)
          specs.push({ label: "Compliance", value: component.compliance });
        if (component.pins)
          specs.push({ label: "Pins", value: `${component.pins}-pin` });
        if (component.casLatency)
          specs.push({ label: "CAS Latency", value: component.casLatency });
        if (component.timings)
          specs.push({ label: "Timings", value: component.timings });
        if (component.intelXmpCertified !== undefined)
          specs.push({
            label: "Intel XMP Certified",
            value:
              typeof component.intelXmpCertified === "boolean"
                ? component.intelXmpCertified
                  ? "Yes"
                  : "No"
                : String(component.intelXmpCertified),
          });
        if (component.dataIntegrityCheck !== undefined)
          specs.push({
            label: "Data Integrity Check",
            value: String(component.dataIntegrityCheck),
          });
        if (component.heatsink !== undefined)
          specs.push({
            label: "Heatsink",
            value: component.heatsink ? "Yes" : "No",
          });
        if (component.rgb !== undefined)
          specs.push({
            label: "RGB Lighting",
            value: component.rgb ? "Yes" : "No",
          });
        break;

      case "storage":
        if (component.capacity)
          specs.push({ label: "Capacity", value: `${component.capacity}GB` });
        if (component.type)
          specs.push({ label: "Type", value: component.type });
        if (component.driveType)
          specs.push({ label: "Drive Type", value: component.driveType });
        if (component.interface)
          specs.push({ label: "Interface", value: component.interface });
        if (component.readSpeed)
          specs.push({
            label: "Read Speed",
            value: `${component.readSpeed}MB/s`,
          });
        if (component.writeSpeed)
          specs.push({
            label: "Write Speed",
            value: `${component.writeSpeed}MB/s`,
          });
        if (component.nand)
          specs.push({ label: "NAND Type", value: component.nand });
        if (component.storageMtbf)
          specs.push({
            label: "MTBF",
            value: `${component.storageMtbf} hours`,
          });
        if (component.totalBytesWritten)
          specs.push({ label: "TBW", value: component.totalBytesWritten });
        if (component.operatingTemperatures)
          specs.push({
            label: "Operating Temperatures",
            value: component.operatingTemperatures,
          });
        if (component.storageTemperatures)
          specs.push({
            label: "Storage Temperatures",
            value: component.storageTemperatures,
          });
        if (component.shockResistance)
          specs.push({
            label: "Shock Resistance",
            value: `${component.shockResistance}G`,
          });
        break;

      case "psu":
        if (component.wattage)
          specs.push({ label: "Wattage", value: `${component.wattage}W` });
        if (component.efficiency)
          specs.push({ label: "Efficiency", value: component.efficiency });
        if (component.modular !== undefined)
          specs.push({
            label: "Modular",
            value:
              typeof component.modular === "boolean"
                ? component.modular
                  ? "Modular"
                  : "Non-modular"
                : component.modular,
          });
        if (component.connectors)
          specs.push({
            label: "Connectors",
            value: component.connectors.join(", "),
          });
        if (component.psuCompatibility)
          specs.push({
            label: "Compatibility",
            value: component.psuCompatibility,
          });
        if (component.pfc !== undefined)
          specs.push({
            label: "PFC",
            value:
              typeof component.pfc === "boolean"
                ? component.pfc
                  ? "Active"
                  : "Passive"
                : component.pfc,
          });
        if (component.acInput)
          specs.push({ label: "AC Input", value: component.acInput });
        if (component.fanType)
          specs.push({ label: "Fan Type", value: component.fanType });
        if (component.fanBearing)
          specs.push({ label: "Fan Bearing", value: component.fanBearing });
        if (component.maxCertification)
          specs.push({
            label: "Max Certification",
            value: component.maxCertification,
          });
        if (component.mtbf)
          specs.push({ label: "MTBF", value: `${component.mtbf} hours` });
        if (component.protection)
          specs.push({
            label: "Protection",
            value: component.protection.join(", "),
          });
        if (component.length)
          specs.push({ label: "Length", value: `${component.length}mm` });
        break;

      case "cooling":
        if (component.coolerType)
          specs.push({ label: "Type", value: component.coolerType });
        if (component.socketCompatibility)
          specs.push({
            label: "Socket Compatibility",
            value: component.socketCompatibility.join(", "),
          });
        if (component.radiatorSize)
          specs.push({
            label: "Radiator Size",
            value: `${component.radiatorSize}mm`,
          });
        if (component.fanSize)
          specs.push({ label: "Fan Size", value: `${component.fanSize}mm` });
        if (component.tdpSupport)
          specs.push({
            label: "TDP Support",
            value: `${component.tdpSupport}W`,
          });
        if (component.height)
          specs.push({ label: "Height", value: `${component.height}mm` });
        if (component.rgbLighting !== undefined)
          specs.push({
            label: "RGB Lighting",
            value: component.rgbLighting ? "Yes" : "No",
          });
        break;

      case "caseFans":
        if (component.rpm)
          specs.push({ label: "Fan RPM", value: component.rpm });
        if (component.airflow)
          specs.push({ label: "Airflow", value: component.airflow });
        if (component.noiseLevel)
          specs.push({
            label: "Noise Level",
            value: `${component.noiseLevel} dBA`,
          });
        if (component.fanCount)
          specs.push({ label: "Fan Count", value: component.fanCount });
        if (component.connector)
          specs.push({ label: "Connector", value: component.connector });
        if (component.ledType)
          specs.push({ label: "LED Type", value: component.ledType });
        break;
    }

    return specs;
  };

  const specs = getSpecifications();
  const technicalSpecs = specs.filter(
    (spec) =>
      !["Name", "Brand", "Model", "Price", "Rating"].includes(spec.label)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-950 to-black border-2 border-sky-500/40 p-0"
        style={{ maxWidth: "min(1200px, 95vw)" }}
      >
        <VisuallyHidden>
          <DialogTitle>{component.name} - Component Details</DialogTitle>
        </VisuallyHidden>
        <ProductSchema product={component} />
        <div className="overflow-y-auto max-h-[90vh] p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <div className="relative w-full bg-slate-900/50 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-sky-500/20">
              <img
                src={detailImages[currentImageIndex]}
                alt={component.name}
                className="w-full h-auto object-contain"
                style={{ minHeight: "300px", maxHeight: "min(400px, 50vh)" }}
              />

              {component.featured && (
                <div className="absolute top-3 right-3 z-30">
                  <FeaturedTag />
                </div>
              )}

              {detailImages.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(
                        (prev) =>
                          (prev - 1 + detailImages.length) % detailImages.length
                      );
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/25 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(
                        (prev) => (prev + 1) % detailImages.length
                      );
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/25 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20">
                  {currentImageIndex + 1}/{detailImages.length}
                </Badge>
              </div>
            </div>

            {detailImages.length > 1 && (
              <div className="flex gap-3 mt-4 justify-center flex-wrap p-2">
                {detailImages.slice(0, 4).map((img: string, idx: number) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      idx === currentImageIndex
                        ? "border-sky-500 ring-2 ring-sky-500/30"
                        : "border-white/10 hover:border-white/30"
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={img}
                      alt={`${component.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <BrandLogo
                  src={component.brandLogo}
                  brand={component.brand}
                  size="lg"
                  className="mb-4"
                  withBackground
                />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 break-words">
                  {component.name}
                </h2>
                <div className="text-gray-400">
                  {renderRichText(component.description)}
                </div>

                {uniqueOptions.length > 0 && (
                  <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/60 rounded-xl p-4 mt-6 border border-sky-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="w-4 h-4 text-sky-400" />
                      <h4 className="text-sm font-semibold text-sky-300 uppercase tracking-wider">
                        Configuration Options
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {uniqueOptions.map((opt) => (
                        <div key={opt.key} className="group">
                          <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-sky-500/60"></div>
                            {opt.key.charAt(0).toUpperCase() + opt.key.slice(1)}
                          </label>
                          <div className="relative">
                            <select
                              className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm font-medium appearance-none cursor-pointer transition-all duration-300 hover:border-sky-400/50 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 focus:outline-none backdrop-blur-sm shadow-lg"
                              value={selectedOptions[opt.key] || opt.values[0]}
                              onChange={(e) => {
                                const prevPrice = displayPrice;
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [opt.key]: e.target.value,
                                }));
                                const updated = {
                                  ...selectedOptions,
                                  [opt.key]: e.target.value,
                                };
                                try {
                                  sessionStorage.setItem(
                                    `optionSelections_${component.id}`,
                                    JSON.stringify(updated)
                                  );
                                } catch {
                                  /* ignore storage errors */
                                }
                                try {
                                  const newPrice = (() => {
                                    if (!component.pricesByOption)
                                      return component.price ?? 0;
                                    const precedence = [
                                      "size",
                                      "storage",
                                      "colour",
                                      "color",
                                      "type",
                                      "style",
                                    ];
                                    for (const key of precedence) {
                                      const sel: string | undefined =
                                        updated[key];
                                      if (
                                        sel &&
                                        component.pricesByOption[key] &&
                                        component.pricesByOption[key][sel] !==
                                          undefined
                                      ) {
                                        const priceData =
                                          component.pricesByOption[key][sel];
                                        return typeof priceData === "number"
                                          ? priceData
                                          : priceData.price;
                                      }
                                      const alt =
                                        key === "colour"
                                          ? "color"
                                          : key === "color"
                                          ? "colour"
                                          : null;
                                      if (
                                        alt &&
                                        sel &&
                                        component.pricesByOption[alt] &&
                                        component.pricesByOption[alt][sel] !==
                                          undefined
                                      ) {
                                        const priceData =
                                          component.pricesByOption[alt][sel];
                                        return typeof priceData === "number"
                                          ? priceData
                                          : priceData.price;
                                      }
                                    }
                                    return component.price ?? 0;
                                  })();
                                  if (newPrice !== prevPrice) {
                                    const payload = {
                                      kind: "event",
                                      payload: {
                                        eventType: "price_change",
                                        eventData: {
                                          componentId: component.id,
                                          componentName: component.name,
                                          optionKey: opt.key,
                                          optionValue: e.target.value,
                                          previousPrice: prevPrice,
                                          newPrice,
                                        },
                                        timestamp: new Date().toISOString(),
                                        page: window.location.pathname,
                                      },
                                    };
                                    const data = JSON.stringify(payload);
                                    if (navigator.sendBeacon) {
                                      navigator.sendBeacon(
                                        "/api/analytics/track",
                                        data
                                      );
                                    } else {
                                      void fetch("/api/analytics/track", {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: data,
                                        keepalive: true,
                                      });
                                    }
                                  }
                                } catch {
                                  /* ignore analytics errors */
                                }
                              }}
                            >
                              {opt.values.map((val) => (
                                <option
                                  key={val}
                                  value={val}
                                  className="bg-slate-900 text-white py-1"
                                >
                                  {val}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg
                                className="w-4 h-4 text-sky-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-3">
                  {component.rating && (
                    <>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 text-amber-400 ${
                              i < Math.floor(component.rating ?? 0)
                                ? "fill-amber-400"
                                : ""
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-400">
                        ({component.rating}/5)
                      </span>
                    </>
                  )}
                  {component.ean && typeof component.ean === "string" ? (
                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                      EAN: {String(displayEan || component.ean)}
                    </span>
                  ) : displayEan ? (
                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                      EAN: {String(displayEan)}
                    </span>
                  ) : null}
                  <Badge
                    className={
                      component.inStock !== false &&
                      (component.stockLevel ?? 0) > 0
                        ? (component.stockLevel ?? 0) <= 5
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                          : "bg-green-500/20 text-green-400 border-green-500/40"
                        : "bg-red-500/20 text-red-400 border-red-500/40"
                    }
                  >
                    {component.inStock !== false &&
                    (component.stockLevel ?? 0) > 0
                      ? (component.stockLevel ?? 0) <= 5
                        ? "Low Stock"
                        : "✓ In Stock"
                      : "Out of Stock"}
                  </Badge>
                </div>
              </div>

              <div className="text-right bg-gradient-to-br from-sky-500/20 to-blue-500/20 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-xl border-2 border-sky-400/40 w-full sm:w-auto">
                <div className="text-xs text-sky-400 uppercase tracking-wider mb-2">
                  Price
                </div>
                <div className="flex items-start justify-end gap-1">
                  <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white break-all">
                    £{Math.floor((displayPrice ?? component.price) || 0)}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-sky-300 mt-1">
                    .
                    {
                      ((displayPrice ?? component.price) || 0)
                        .toFixed(2)
                        .split(".")[1]
                    }
                  </span>
                </div>
                {!component.brandLogo && component.brand && (
                  <Badge className="mt-3 bg-sky-500/30 text-sky-300 border-sky-400/50">
                    {component.brand}
                  </Badge>
                )}
                <Button
                  onClick={() => {
                    onSelect(category, component.id);
                    onClose();
                  }}
                  className={`w-full mt-4 h-11 ${
                    isSelected
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                      : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isSelected ? "Remove from Build" : "Add to Build"}
                </Button>
              </div>
            </div>

            {component.mainProductDescription && (
              <div className="bg-slate-900/60 rounded-xl p-6 border border-sky-500/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-sky-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Product Description
                </h3>
                <div className="text-base text-gray-300 leading-relaxed">
                  {renderRichText(component.mainProductDescription)}
                </div>
              </div>
            )}

            <div className="bg-slate-900/60 rounded-xl p-6 border border-sky-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-sky-400" />
                  Technical Specifications
                </h3>
                {component.techSheet && (
                  <a
                    href={component.techSheet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-sky-500/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      logger.info("[PCBuilder] Tech sheet download clicked", {
                        component: component.name,
                        category,
                      });
                      try {
                        const sessionId =
                          sessionStorage.getItem("vortex_session_id") ||
                          getSessionId() ||
                          "unknown";
                        const eventPayload = {
                          kind: "event",
                          payload: {
                            sessionId,
                            eventType: "download",
                            eventData: {
                              componentType: category,
                              componentName: component.name,
                              componentId: component.id,
                              url: component.techSheet,
                              kind: "tech_sheet",
                            },
                            timestamp: new Date().toISOString(),
                            page: window.location.pathname,
                          },
                        };
                        const data = JSON.stringify(eventPayload);
                        if (navigator.sendBeacon) {
                          const ok = navigator.sendBeacon(
                            "/api/analytics/track",
                            data
                          );
                          if (!ok) throw new Error("sendBeacon failed");
                        } else {
                          void fetch("/api/analytics/track", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: data,
                            keepalive: true,
                            cache: "no-store",
                          });
                        }
                      } catch (err) {
                        logger.warn("Fallback analytics tracking failed", {
                          error: err,
                        });
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download Full Tech Sheet
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {technicalSpecs.map((spec, index) => (
                  <div
                    key={index}
                    className="bg-slate-800/60 rounded-lg p-4 border border-white/5"
                  >
                    <div className="text-xs text-gray-500 uppercase mb-1">
                      {spec.label}
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {typeof spec.value === "string" ||
                      typeof spec.value === "number"
                        ? spec.value
                        : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {component.features && component.features.length > 0 && (
              <div className="bg-gradient-to-br from-sky-900/20 to-blue-900/20 rounded-xl p-6 border border-sky-500/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-sky-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Key Features
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {component.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="flex-1 h-11 sm:h-12 bg-white/5 border-white/20 hover:bg-white/10 text-sm sm:text-base"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  onSelect(category, component.id);
                  onClose();
                }}
                className={`flex-1 h-11 sm:h-12 text-sm sm:text-base ${
                  isSelected
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                    : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                }`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isSelected ? "Remove from Build" : "Add to Build"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
