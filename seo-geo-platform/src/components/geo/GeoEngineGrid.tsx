"use client";

import React from "react";
import { Eye, EyeOff } from "lucide-react";

interface Check {
  engine: string;
  isMentioned: boolean;
  mentionType: string;
  sentiment: string;
  shareOfVoice: number;
  checkedAt: Date;
}

const engineMeta: Record<string, { label: string; color: string; icon: string }> = {
  CHATGPT: { label: "ChatGPT", color: "#10A37F", icon: "C" },
  GEMINI: { label: "Gemini", color: "#4285F4", icon: "G" },
  PERPLEXITY: { label: "Perplexity", color: "#20B2AA", icon: "P" },
  COPILOT: { label: "Copilot", color: "#7B68EE", icon: "Co" },
  CLAUDE: { label: "Claude", color: "#D4A574", icon: "Cl" },
};

const mentionLabels: Record<string, string> = {
  DIRECT: "直接言及",
  INDIRECT: "間接言及",
  NOT_MENTIONED: "未言及",
};

const sentimentLabels: Record<string, { label: string; color: string }> = {
  POSITIVE: { label: "ポジティブ", color: "text-accent" },
  NEUTRAL: { label: "ニュートラル", color: "text-text-mid" },
  NEGATIVE: { label: "ネガティブ", color: "text-warn" },
  NONE: { label: "-", color: "text-text-dim" },
};

interface GeoEngineGridProps {
  checks: Check[];
}

export function GeoEngineGrid({ checks }: GeoEngineGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {checks.map((check) => {
        const meta = engineMeta[check.engine] || { label: check.engine, color: "#666", icon: "?" };
        const sentMeta = sentimentLabels[check.sentiment] || sentimentLabels.NONE;

        return (
          <div
            key={check.engine}
            className={`border rounded-lg p-3 transition-colors ${
              check.isMentioned
                ? "border-accent/30 bg-accent/5"
                : "border-border bg-bg-soft"
            }`}
          >
            {/* Engine Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: meta.color }}
                >
                  {meta.icon}
                </span>
                <span className="text-sm font-medium text-text">{meta.label}</span>
              </div>
              {check.isMentioned ? (
                <Eye size={16} className="text-accent" />
              ) : (
                <EyeOff size={16} className="text-text-dim" />
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-text-dim">言及タイプ</span>
                <span className={check.isMentioned ? (check.mentionType === "DIRECT" ? "text-accent font-medium" : "text-orange") : "text-text-dim"}>
                  {mentionLabels[check.mentionType] || check.mentionType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">感情分析</span>
                <span className={sentMeta.color}>{sentMeta.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">シェア</span>
                <span className="text-text font-medium">{check.shareOfVoice}%</span>
              </div>

              {/* Share bar */}
              <div className="h-1.5 bg-bg rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${check.shareOfVoice}%`,
                    backgroundColor: check.isMentioned ? meta.color : "#5C6F82",
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
