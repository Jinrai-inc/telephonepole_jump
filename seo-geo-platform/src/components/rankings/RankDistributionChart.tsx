"use client";

import React from "react";

interface Distribution {
  top3: number;
  top10: number;
  top50: number;
  top100: number;
  outOfRange: number;
}

interface RankDistributionChartProps {
  distribution: Distribution;
  total: number;
}

const segments = [
  { key: "top3" as const, label: "TOP 3", color: "#00E4B8" },
  { key: "top10" as const, label: "4-10位", color: "#4CA4FF" },
  { key: "top50" as const, label: "11-50位", color: "#FFAA40" },
  { key: "top100" as const, label: "51-100位", color: "#B07CFF" },
  { key: "outOfRange" as const, label: "圏外", color: "#5C6F82" },
];

export function RankDistributionChart({ distribution, total }: RankDistributionChartProps) {
  if (total === 0) {
    return <p className="text-text-dim text-sm text-center py-8">データがありません</p>;
  }

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-6 rounded-full overflow-hidden bg-bg-soft">
        {segments.map((seg) => {
          const count = distribution[seg.key];
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={seg.key}
              className="transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${count}件 (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>

      {/* Legend rows */}
      <div className="space-y-2">
        {segments.map((seg) => {
          const count = distribution[seg.key];
          const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
          return (
            <div key={seg.key} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-text-mid">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-text">{count}</span>
                <span className="text-text-dim text-xs w-8 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
