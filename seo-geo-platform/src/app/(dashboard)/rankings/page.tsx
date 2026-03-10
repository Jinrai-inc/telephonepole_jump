"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { RankingChart } from "@/components/rankings/RankingChart";
import { RankDistributionChart } from "@/components/rankings/RankDistributionChart";
import { BarChart3, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Target, AlertTriangle } from "lucide-react";

// Demo data
const DEMO_DISTRIBUTION = { top3: 2, top10: 4, top50: 6, top100: 1, outOfRange: 1 };

const DEMO_CHANGES = [
  { id: "1", keyword: "AI検索 対策", currentPosition: 8, previousPosition: 11, change: 3 },
  { id: "2", keyword: "SEO対策 やり方", currentPosition: 5, previousPosition: 7, change: 2 },
  { id: "3", keyword: "検索順位チェックツール", currentPosition: 12, previousPosition: 9, change: -3 },
  { id: "4", keyword: "Ahrefs 代替", currentPosition: 25, previousPosition: 22, change: -3 },
  { id: "5", keyword: "コンテンツSEO", currentPosition: 7, previousPosition: 8, change: 1 },
];

const DEMO_RANKING_HISTORY = generateDemoHistory();

function generateDemoHistory() {
  const days = 30;
  const data = [];
  let pos = 15;
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    pos = Math.max(1, Math.min(50, pos + Math.floor(Math.random() * 5) - 2));
    data.push({
      date: date.toISOString().split("T")[0],
      positionGoogle: pos,
      positionYahoo: pos + Math.floor(Math.random() * 3),
      positionMobile: pos + Math.floor(Math.random() * 2) - 1,
      positionDesktop: pos,
      hasAiOverview: Math.random() > 0.6,
      aiOverviewPosition: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : null,
    });
  }
  return data;
}

export default function RankingsPage() {
  const [selectedKeyword, setSelectedKeyword] = useState("SEO対策 やり方");
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  const dist = DEMO_DISTRIBUTION;
  const totalKw = dist.top3 + dist.top10 + dist.top50 + dist.top100 + dist.outOfRange;
  const ups = DEMO_CHANGES.filter((c) => c.change > 0).length;
  const downs = DEMO_CHANGES.filter((c) => c.change < 0).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">順位トラッキング</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<BarChart3 size={16} />}
          label="登録KW"
          value={totalKw.toString()}
          color="accent"
        />
        <MetricCard
          icon={<Target size={16} />}
          label="TOP10"
          value={(dist.top3 + dist.top10).toString()}
          color="blue"
          change={`${dist.top3} in TOP3`}
        />
        <MetricCard
          icon={<TrendingUp size={16} />}
          label="上昇KW"
          value={ups.toString()}
          color="green"
        />
        <MetricCard
          icon={<TrendingDown size={16} />}
          label="下降KW"
          value={downs.toString()}
          color="orange"
        />
      </div>

      {/* Chart + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-text-mid">順位推移</h3>
              <p className="text-lg font-bold mt-1">{selectedKeyword}</p>
            </div>
            <div className="flex bg-bg-soft rounded-lg p-1">
              {([7, 30, 90] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setPeriod(d)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    period === d ? "bg-card text-text shadow-sm" : "text-text-dim hover:text-text"
                  }`}
                >
                  {d}日
                </button>
              ))}
            </div>
          </div>
          <RankingChart data={DEMO_RANKING_HISTORY.slice(-period)} />
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-text-mid mb-4">順位分布</h3>
          <RankDistributionChart distribution={dist} total={totalKw} />
        </Card>
      </div>

      {/* Recent Changes Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-mid">最近の順位変動</h3>
          <Badge color="orange" size="sm">
            <AlertTriangle size={10} className="mr-1" />
            {DEMO_CHANGES.length} 件の変動
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-dim">
                <th className="text-left px-3 py-2 font-medium">キーワード</th>
                <th className="text-right px-3 py-2 font-medium">現在順位</th>
                <th className="text-right px-3 py-2 font-medium">前回順位</th>
                <th className="text-right px-3 py-2 font-medium">変動</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_CHANGES.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/50 hover:bg-card-alt/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedKeyword(row.keyword)}
                >
                  <td className="px-3 py-2.5 font-medium text-text">{row.keyword}</td>
                  <td className="px-3 py-2.5 text-right font-bold">
                    <span className={row.currentPosition <= 10 ? "text-accent" : "text-text-mid"}>
                      {row.currentPosition}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-text-dim">{row.previousPosition}</td>
                  <td className="px-3 py-2.5 text-right">
                    {row.change > 0 ? (
                      <span className="inline-flex items-center text-accent font-medium">
                        <ArrowUp size={14} className="mr-0.5" />
                        {row.change}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-warn font-medium">
                        <ArrowDown size={14} className="mr-0.5" />
                        {Math.abs(row.change)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
