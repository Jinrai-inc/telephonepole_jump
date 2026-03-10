import React from "react";

interface BarProps {
  value: number;
  maxValue?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export function Bar({ value, maxValue = 100, color = "bg-accent", label, showValue = true }: BarProps) {
  const percent = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-text-mid">{label}</span>
          {showValue && <span className="text-sm font-mono text-text">{value}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-card-alt rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
