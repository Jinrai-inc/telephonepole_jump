"use client";

import React, { useMemo } from "react";

interface GeoScoreChartProps {
  keyword: string;
  height?: number;
}

// Generate demo time-series data
function generateData(keyword: string) {
  const days = 30;
  const data = [];
  let score = 50 + Math.floor(keyword.length * 3);
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    score = Math.max(0, Math.min(100, score + Math.floor(Math.random() * 10) - 4));
    data.push({
      date: date.toISOString().split("T")[0],
      score,
    });
  }
  return data;
}

export function GeoScoreChart({ keyword, height = 200 }: GeoScoreChartProps) {
  const data = useMemo(() => generateData(keyword), [keyword]);

  const padding = { top: 16, right: 12, bottom: 28, left: 36 };
  const chartWidth = 560;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const getX = (i: number) => padding.left + (i / Math.max(1, data.length - 1)) * innerWidth;
  const getY = (score: number) => padding.top + ((100 - score) / 100) * innerHeight;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${getX(i).toFixed(1)},${getY(d.score).toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L${getX(data.length - 1).toFixed(1)},${(chartHeight - padding.bottom).toFixed(1)} L${padding.left},${(chartHeight - padding.bottom).toFixed(1)} Z`;

  const yTicks = [0, 25, 50, 75, 100];
  const labelStep = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data.filter((_, i) => i % labelStep === 0 || i === data.length - 1);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={padding.left} y1={getY(tick)} x2={chartWidth - padding.right} y2={getY(tick)} stroke="#1E2D3D" strokeWidth={0.5} />
            <text x={padding.left - 8} y={getY(tick) + 4} textAnchor="end" fill="#5C6F82" fontSize={10}>
              {tick}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map((d) => (
          <text key={d.date} x={getX(data.indexOf(d))} y={chartHeight - 6} textAnchor="middle" fill="#5C6F82" fontSize={10}>
            {d.date.slice(5)}
          </text>
        ))}

        {/* Area fill */}
        <defs>
          <linearGradient id="geoGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B07CFF" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#B07CFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#geoGradient)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#B07CFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Latest dot */}
        {data.length > 0 && (
          <circle
            cx={getX(data.length - 1)}
            cy={getY(data[data.length - 1].score)}
            r={4}
            fill="#B07CFF"
            stroke="#080E17"
            strokeWidth={2}
          />
        )}
      </svg>
    </div>
  );
}
