import React, { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface VirtualListProps<T> {
  items: T[];
  itemHeight?: number; // estimated row height in px
  autoMeasure?: boolean; // measure first item height on mount
  height: number; // container height in px
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  autoMeasure = true,
  height,
  renderItem,
  className,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const sampleRef = useRef<HTMLDivElement | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<number>(itemHeight || 100);

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

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedSize,
    overscan: 6,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        height,
        overflow: "auto",
        position: "relative",
      }}
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
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((vi) => {
          const item = items[vi.index];
          return (
            <div
              key={vi.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${vi.start}px)`,
              }}
            >
              {renderItem(item, vi.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
