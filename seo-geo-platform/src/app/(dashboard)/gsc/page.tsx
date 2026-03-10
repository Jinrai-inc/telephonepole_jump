"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { Link2, ExternalLink, MousePointerClick, Eye, BarChart3 } from "lucide-react";

// Demo GSC data
const DEMO_GSC = {
  summary: {
    clicks: 12450,
    impressions: 245000,
    ctr: 5.08,
    position: 14.2,
    clicksChange: 8.5,
    impressionsChange: 12.3,
  },
  queries: [
    { query: "SEO対策 やり方", clicks: 890, impressions: 15200, ctr: 5.86, position: 5.2 },
    { query: "GEO対策とは", clicks: 420, impressions: 4800, ctr: 8.75, position: 3.1 },
    { query: "検索順位チェックツール 比較", clicks: 380, impressions: 8900, ctr: 4.27, position: 11.5 },
    { query: "AI検索 対策", clicks: 310, impressions: 6200, ctr: 5.0, position: 7.8 },
    { query: "LLMO とは", clicks: 280, impressions: 3200, ctr: 8.75, position: 2.4 },
    { query: "コンテンツSEO 効果", clicks: 250, impressions: 5600, ctr: 4.46, position: 6.9 },
    { query: "SEOツール おすすめ", clicks: 220, impressions: 12000, ctr: 1.83, position: 18.3 },
    { query: "Ahrefs 代わり", clicks: 180, impressions: 3800, ctr: 4.74, position: 24.1 },
  ],
  pages: [
    { page: "/blog/seo-guide", clicks: 2100, impressions: 38000, ctr: 5.53, position: 8.2 },
    { page: "/blog/geo-taisaku", clicks: 1800, impressions: 22000, ctr: 8.18, position: 4.1 },
    { page: "/blog/ai-search", clicks: 1200, impressions: 18000, ctr: 6.67, position: 6.5 },
    { page: "/tools/rank-checker", clicks: 980, impressions: 15000, ctr: 6.53, position: 9.8 },
    { page: "/", clicks: 850, impressions: 45000, ctr: 1.89, position: 22.5 },
  ],
};

export default function GscPage() {
  const [connected] = useState(true); // Demo: connected
  const [period, setPeriod] = useState<7 | 28 | 90>(28);
  const [tab, setTab] = useState<"queries" | "pages">("queries");

  if (!connected) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Google Search Console</h1>
        <Card className="text-center py-12">
          <Link2 size={48} className="mx-auto text-text-dim mb-4" />
          <h2 className="text-lg font-bold mb-2">GSCを連携してください</h2>
          <p className="text-text-mid text-sm mb-6 max-w-md mx-auto">
            Google Search Consoleと連携することで、クリック数、表示回数、CTR、平均掲載順位のデータを確認できます。
          </p>
          <Button onClick={() => window.location.href = "/api/auth/gsc"}>
            <ExternalLink size={16} className="mr-1.5" />
            GSCを連携する
          </Button>
        </Card>
      </div>
    );
  }

  const { summary, queries, pages } = DEMO_GSC;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Google Search Console</h1>
        <div className="flex bg-bg-soft rounded-lg p-1">
          {([7, 28, 90] as const).map((d) => (
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<MousePointerClick size={16} />}
          label="クリック数"
          value={summary.clicks.toLocaleString()}
          change={summary.clicksChange}
          changeLabel="%"
          color="accent"
        />
        <MetricCard
          icon={<Eye size={16} />}
          label="表示回数"
          value={summary.impressions.toLocaleString()}
          change={summary.impressionsChange}
          changeLabel="%"
          color="blue"
        />
        <MetricCard
          icon={<BarChart3 size={16} />}
          label="平均CTR"
          value={`${summary.ctr}%`}
          color="purple"
        />
        <MetricCard
          icon={<BarChart3 size={16} />}
          label="平均掲載順位"
          value={summary.position.toFixed(1)}
          color="orange"
        />
      </div>

      {/* Data Table */}
      <Card className="!p-0">
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("queries")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              tab === "queries" ? "text-accent border-b-2 border-accent" : "text-text-dim hover:text-text"
            }`}
          >
            検索クエリ
          </button>
          <button
            onClick={() => setTab("pages")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              tab === "pages" ? "text-accent border-b-2 border-accent" : "text-text-dim hover:text-text"
            }`}
          >
            ページ
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-dim">
                <th className="text-left px-4 py-3 font-medium">{tab === "queries" ? "クエリ" : "ページ"}</th>
                <th className="text-right px-4 py-3 font-medium">クリック</th>
                <th className="text-right px-4 py-3 font-medium">表示回数</th>
                <th className="text-right px-4 py-3 font-medium">CTR</th>
                <th className="text-right px-4 py-3 font-medium">掲載順位</th>
              </tr>
            </thead>
            <tbody>
              {(tab === "queries" ? queries : pages).map((row, i) => {
                const label = "query" in row ? row.query : row.page;
                return (
                  <tr key={i} className="border-b border-border/50 hover:bg-card-alt/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text">
                      {tab === "pages" ? (
                        <span className="text-blue">{label}</span>
                      ) : (
                        label
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-text-mid">{row.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-text-mid">{row.impressions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={row.ctr >= 5 ? "text-accent" : "text-text-mid"}>{row.ctr}%</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={row.position <= 10 ? "text-accent font-bold" : "text-text-mid"}>
                        {row.position.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
