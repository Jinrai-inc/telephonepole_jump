import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  color?: "accent" | "blue" | "orange" | "warn" | "purple" | "green" | "dim";
  size?: "sm" | "md";
  className?: string;
}

const colorMap = {
  accent: "bg-accent-soft text-accent",
  blue: "bg-blue-soft text-blue",
  orange: "bg-orange-soft text-orange",
  warn: "bg-warn-soft text-warn",
  purple: "bg-purple-soft text-purple",
  green: "bg-green-soft text-green",
  dim: "bg-card-alt text-text-dim",
};

const sizeMap = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-xs",
};

export function Badge({ children, color = "accent", size = "md", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorMap[color]} ${sizeMap[size]} ${className}`}>
      {children}
    </span>
  );
}
