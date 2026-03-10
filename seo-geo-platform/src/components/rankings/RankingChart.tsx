"use client";

import React, { useMemo } from "react";

interface RankingDataPoint {
  date: string;
  positionGoogle: number | null;
  positionMobile?: number | null;
  hasAiOverview?: boolean;
}

interface RankingChartProps {
  data: RankingDataPoint[];
  height?: number;
}

export function RankingChart({ data, height = 280 }: RankingChartProps) {
  const padding = { top: 20, right: 16, bottom: 32, left: 40 };
  const chartWidth = 600;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const { minPos, maxPos, points, mobilePoints, aiOverlayDots, yTicks, xLabels } = useMemo(() => {
    const positions = data
      .map((d) => d.positionGoogle)
      .filter((p): p is number => p !== null);
    if (positions.length === 0) return { minPos: 1, maxPos: 50, points: "", mobilePoints: "", aiOverlayDots: [], yTicks: [], xLabels: [] };

    const min = Math.max(1, Math.min(...positions) - 2);
    const max = Math.min(100, Math.max(...positions) + 3);
    const range = max - min || 1;

    const getX = (i: number) => padding.left + (i / Math.max(1, data.length - 1)) * innerWidth;
    // Note: lower position = higher on chart (inverted Y)
    const getY = (pos: number) => padding.top + ((pos - min) / range) * innerHeight;

    const googlePts = data
      .map((d, i) => (d.positionGoogle !== null ? `${i === 0 ? "M" : "L"}${getX(i).toFixed(1)},${getY(d.positionGoogle).toFixed(1)}` : ""))
      .filter(Boolean)
      .join(" ");

    const mobilePts = data
      .map((d, i) => (d.positionMobile !== null && d.positionMobile !== undefined ? `${i === 0 ? "M" : "L"}${getX(i).toFixed(1)},${getY(d.positionMobile).toFixed(1)}` : ""))
      .filter(Boolean)
      .join(" ");

    const aiDots = data
      .map((d, i) => (d.hasAiOverview ? { x: getX(i), y: getY(d.positionGoogle ?? min) } : null))
      .filter(Boolean) as { x: number; y: number }[];

    // Y axis ticks
    const step = Math.max(1, Math.round(range / 5));
    const ticks: number[] = [];
    for (let t = min; t <= max; t += step) {
      ticks.push(t);
    }

    // X axis labels (show ~6 dates)
    const labelStep = Math.max(1, Math.floor(data.length / 6));
    const labels = data
      .filter((_, i) => i % labelStep === 0 || i === data.length - 1)
      .map((d, _, arr) => ({
        label: d.date.slice(5), // MM-DD
        x: getX(data.indexOf(d)),
      }));

    return { minPos: min, maxPos: max, points: googlePts, mobilePoints: mobilePts, aiOverlayDots: aiDots, yTicks: ticks.map((t) => ({ value: t, y: getY(t) })), xLabels: labels };
  }, [data, innerWidth, innerHeight]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-text-dim text-sm" style={{ height }}>
        データがありません
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <g key={tick.value}>
            <line x1={padding.left} y1={tick.y} x2={chartWidth - padding.right} y2={tick.y} stroke="#1E2D3D" strokeWidth={0.5} />
            <text x={padding.left - 8} y={tick.y + 4} textAnchor="end" fill="#5C6F82" fontSize={10}>
              {tick.value}
            </text>
          </g>
        ))}

        {/* X axis labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={chartHeight - 8} textAnchor="middle" fill="#5C6F82" fontSize={10}>
            {l.label}
          </text>
        ))}

        {/* Mobile line */}
        {mobilePoints && (
          <path d={mobilePoints} fill="none" stroke="#B07CFF" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.5} />
        )}

        {/* Google line */}
        <path d={points} fill="none" stroke="#00E4B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* AI Overview dots */}
        {aiOverlayDots.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={3} fill="#FFAA40" opacity={0.8} />
        ))}

        {/* Current position dot */}
        {data.length > 0 && data[data.length - 1].positionGoogle !== null && (
          <circle
            cx={padding.left + innerWidth}
            cy={padding.top + ((data[data.length - 1].positionGoogle! - minPos) / (maxPos - minPos || 1)) * innerHeight}
            r={4}
            fill="#00E4B8"
            stroke="#080E17"
            strokeWidth={2}
          />
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-text-dim px-2">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-0.5 bg-accent inline-block rounded" /> Google
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-0.5 bg-purple inline-block rounded opacity-50" style={{ borderBottom: "1px dashed" }} /> Mobile
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 bg-orange rounded-full inline-block opacity-80" /> AI Overview
        </span>
      </div>
    </div>
  );
}
