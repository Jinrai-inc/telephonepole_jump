"use client";

import React from "react";

interface CircleScoreProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
}

export function CircleScore({
  score,
  maxScore = 100,
  size = 80,
  strokeWidth = 6,
  label,
  color = "#00E4B8",
}: CircleScoreProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(score / maxScore, 1);
  const offset = circumference - percent * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1E2D3D"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-lg font-bold font-mono text-text">{score}</span>
      </div>
      {label && <span className="text-xs text-text-dim mt-1">{label}</span>}
    </div>
  );
}
