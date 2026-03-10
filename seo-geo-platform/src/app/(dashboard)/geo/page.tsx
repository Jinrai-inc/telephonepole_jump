"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { GeoEngineGrid } from "@/components/geo/GeoEngineGrid";
import { GeoScoreChart } from "@/components/geo/GeoScoreChart";
import { Bot, Eye, TrendingUp, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Demo data
const AI_ENGINES = ["ChatGPT", "Gemini", "Perplexity", "Copilot", "Claude"] as const;

const DEMO_GEO_RESULTS = [
  {
    keywordId: "1",
    keyword: "SEO対策 やり方",
    geoScore: 72,
    checks: [
      { engine: "CHATGPT" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 15, checkedAt: new Date() },
      { engine: "GEMINI" as const, isMentioned: true, mentionType: "INDIRECT" as const, sentiment: "NEUTRAL" as const, shareOfVoice: 8, checkedAt: new Date() },
      { engine: "PERPLEXITY" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 22, checkedAt: new Date() },
      { engine: "COPILOT" as const, isMentioned: false, mentionType: "NOT_MENTIONED" as const, sentiment: "NONE" as const, shareOfVoice: 0, checkedAt: new Date() },
      { engine: "CLAUDE" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 18, checkedAt: new Date() },
    ],
  },
  {
    keywordId: "2",
    keyword: "GEO対策とは",
    geoScore: 85,
    checks: [
      { engine: "CHATGPT" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 25, checkedAt: new Date() },
      { engine: "GEMINI" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 20, checkedAt: new Date() },
      { engine: "PERPLEXITY" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 30, checkedAt: new Date() },
      { engine: "COPILOT" as const, isMentioned: true, mentionType: "INDIRECT" as const, sentiment: "NEUTRAL" as const, shareOfVoice: 10, checkedAt: new Date() },
      { engine: "CLAUDE" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 28, checkedAt: new Date() },
    ],
  },
  {
    keywordId: "3",
    keyword: "検索順位チェックツール",
    geoScore: 45,
    checks: [
      { engine: "CHATGPT" as const, isMentioned: true, mentionType: "INDIRECT" as const, sentiment: "NEUTRAL" as const, shareOfVoice: 5, checkedAt: new Date() },
      { engine: "GEMINI" as const, isMentioned: false, mentionType: "NOT_MENTIONED" as const, sentiment: "NONE" as const, shareOfVoice: 0, checkedAt: new Date() },
      { engine: "PERPLEXITY" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 12, checkedAt: new Date() },
      { engine: "COPILOT" as const, isMentioned: false, mentionType: "NOT_MENTIONED" as const, sentiment: "NONE" as const, shareOfVoice: 0, checkedAt: new Date() },
      { engine: "CLAUDE" as const, isMentioned: false, mentionType: "NOT_MENTIONED" as const, sentiment: "NONE" as const, shareOfVoice: 0, checkedAt: new Date() },
    ],
  },
  {
    keywordId: "4",
    keyword: "LLMO 対策",
    geoScore: 90,
    checks: [
      { engine: "CHATGPT" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 30, checkedAt: new Date() },
      { engine: "GEMINI" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 25, checkedAt: new Date() },
      { engine: "PERPLEXITY" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 35, checkedAt: new Date() },
      { engine: "COPILOT" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 20, checkedAt: new Date() },
      { engine: "CLAUDE" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 32, checkedAt: new Date() },
    ],
  },
  {
    keywordId: "5",
    keyword: "AI検索 対策",
    geoScore: 68,
    checks: [
      { engine: "CHATGPT" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 18, checkedAt: new Date() },
      { engine: "GEMINI" as const, isMentioned: true, mentionType: "INDIRECT" as const, sentiment: "NEUTRAL" as const, shareOfVoice: 10, checkedAt: new Date() },
      { engine: "PERPLEXITY" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "POSITIVE" as const, shareOfVoice: 20, checkedAt: new Date() },
      { engine: "COPILOT" as const, isMentioned: false, mentionType: "NOT_MENTIONED" as const, sentiment: "NONE" as const, shareOfVoice: 0, checkedAt: new Date() },
      { engine: "CLAUDE" as const, isMentioned: true, mentionType: "DIRECT" as const, sentiment: "NEUTRAL" as const, shareOfVoice: 15, checkedAt: new Date() },
    ],
  },
];

export default function GeoPage() {
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const results = DEMO_GEO_RESULTS;
  const avgScore = Math.round(results.reduce((sum, r) => sum + (r.geoScore || 0), 0) / results.length);
  const mentionedCount = results.filter((r) => r.checks.some((c) => c.isMentioned)).length;
  const directCount = results.reduce(
    (sum, r) => sum + r.checks.filter((c) => c.mentionType === "DIRECT").length,
    0
  );

  const selected = results.find((r) => r.keywordId === selectedKeyword) || results[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">GEOモニタリング</h1>
        <Button
          onClick={() => {
            setIsChecking(true);
            setTimeout(() => setIsChecking(false), 2000);
          }}
          loading={isChecking}
        >
          <RefreshCw size={16} className="mr-1.5" />
          再チェック
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={<Bot size={16} />} label="平均GEOスコア" value={avgScore.toString()} color="accent" />
        <MetricCard icon={<Eye size={16} />} label="言及あり" value={`${mentionedCount}/${results.length}`} color="blue" />
        <MetricCard icon={<Sparkles size={16} />} label="直接言及" value={directCount.toString()} color="purple" />
        <MetricCard icon={<TrendingUp size={16} />} label="5エンジン対応" value={AI_ENGINES.length.toString()} color="green" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Keyword List */}
        <Card className="lg:col-span-1 !p-0">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-medium text-text-mid">キーワード別GEOスコア</h3>
          </div>
          <div className="divide-y divide-border/50">
            {results.map((r) => (
              <button
                key={r.keywordId}
                onClick={() => setSelectedKeyword(r.keywordId)}
                className={`w-full text-left px-4 py-3 hover:bg-card-alt/50 transition-colors ${
                  (selected?.keywordId === r.keywordId) ? "bg-card-alt/50 border-l-2 border-accent" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text truncate mr-2">{r.keyword}</span>
                  <GeoScoreBadge score={r.geoScore} />
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  {r.checks.map((c) => (
                    <span
                      key={c.engine}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                        c.isMentioned
                          ? c.mentionType === "DIRECT"
                            ? "bg-accent/20 text-accent"
                            : "bg-orange/20 text-orange"
                          : "bg-card-alt text-text-dim"
                      }`}
                      title={`${c.engine}: ${c.isMentioned ? c.mentionType : "未言及"}`}
                    >
                      {c.engine[0]}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Detail Panel */}
        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{selected.keyword}</h3>
                    <p className="text-sm text-text-mid mt-0.5">AI検索エンジン別の言及状況</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-accent">{selected.geoScore}</div>
                    <div className="text-xs text-text-dim">GEOスコア</div>
                  </div>
                </div>
                <GeoEngineGrid checks={selected.checks} />
              </Card>

              <Card>
                <h3 className="text-sm font-medium text-text-mid mb-4">GEOスコア推移</h3>
                <GeoScoreChart keyword={selected.keyword} />
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GeoScoreBadge({ score }: { score: number | null }) {
  if (!score && score !== 0) return <Badge color="dim">-</Badge>;
  const color = score >= 70 ? "accent" : score >= 40 ? "orange" : "warn";
  return <Badge color={color as "accent" | "orange" | "warn"}>{score}</Badge>;
}
