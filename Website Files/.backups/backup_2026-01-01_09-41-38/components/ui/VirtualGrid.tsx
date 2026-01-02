import React, { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface VirtualGridProps<T> {
  items: T[];
  columnCount?: number; // fixed column count
  responsive?: boolean; // when true, use 1/2/3 columns based on viewport
  itemHeight?: number; // estimated card height
  autoMeasure?: boolean; // measure first card height on mount
  rowGap?: number;
  columnGap?: number;
  height: number; // container height
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  columnCount,
  responsive = false,
  itemHeight,
  autoMeasure = true,
  rowGap = 24,
  columnGap = 24,
  height,
  renderItem,
  className,
}: VirtualGridProps<T>) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [computedCols, setComputedCols] = useState<number>(columnCount ?? 3);
  const sampleRef = useRef<HTMLDivElement | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<number>(itemHeight || 160);

  useEffect(() => {
    if (!responsive) return;
    const updateCols = () => {
      const w = window.innerWidth;
      // Tailwind breakpoints approximation: md >= 768, xl >= 1280
      if (w >= 1280) setComputedCols(3);
      else if (w >= 768) setComputedCols(2);
      else setComputedCols(1);
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, [responsive]);

  useEffect(() => {
    if (itemHeight) setEstimatedSize(itemHeight);
  }, [itemHeight]);

  useEffect(() => {
    if (!autoMeasure || !sampleRef.current) return;
    const el = sampleRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = Math.ceil(entry.contentRect.height);
        if (h && h !== estimatedSize) setEstimatedSize(h);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [autoMeasure, estimatedSize]);

  const cols = responsive ? computedCols : columnCount ?? 3;
  const rows = Math.ceil(items.length / cols);

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedSize + rowGap,
    // Ensure rows are re-measured when column count changes
    getItemKey: (index) => `${cols}-${index}`,
    // Measure actual row height to support variable-height cards
    measureElement: (el) => (el as HTMLElement).getBoundingClientRect().height,
    overscan: 6,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const totalHeight = rowVirtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      className={className}
      style={{ height, overflow: "auto", position: "relative" }}
    >
      {autoMeasure && items.length > 0 && (
        <div
          ref={sampleRef}
          style={{
            position: "absolute",
            visibility: "hidden",
            pointerEvents: "none",
            width: "100%",
          }}
        >
          {renderItem(items[0], 0)}
        </div>
      )}
      <div style={{ height: totalHeight, position: "relative" }}>
        {virtualRows.map((vr) => {
          const startIdx = vr.index * cols;
          const endIdx = Math.min(startIdx + cols, items.length);
          const rowItems = items.slice(startIdx, endIdx);
          return (
            <div
              key={vr.key}
              ref={rowVirtualizer.measureElement}
              data-index={vr.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${vr.start}px)`,
                paddingBottom: rowGap,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gap: `0px ${columnGap}px`,
                }}
              >
                {rowItems.map((item, i) => {
                  const idx = startIdx + i;
                  return (
                    <React.Fragment key={idx}>
                      {renderItem(item, idx)}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
