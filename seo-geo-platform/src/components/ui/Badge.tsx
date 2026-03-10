import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  color?: "accent" | "blue" | "orange" | "warn" | "purple" | "green" | "dim";
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

export function Badge({ children, color = "accent", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[color]} ${className}`}>
      {children}
    </span>
  );
}
