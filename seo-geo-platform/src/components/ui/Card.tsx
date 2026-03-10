import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`bg-card border border-border rounded-xl p-4 ${
        hover ? "hover:border-accent/30 transition-colors cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
