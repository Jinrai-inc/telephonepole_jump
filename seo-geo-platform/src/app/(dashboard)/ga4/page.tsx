"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { BarChart3, Users, Eye, ArrowUpDown, ExternalLink } from "lucide-react";
import { useProject } from "@/components/providers/ProjectProvider";
import { trpc } from "@/lib/trpc";

interface GA4Data {
  overview: {
    rows?: { metricValues: { value: string }[] }[];
  };
  topPages: {
    rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
  };
  sources: {
    rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
  };
}

export default function GA4Page() {
  const { projectId } = useProject();
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [tab, setTab] = useState<"pages" | "sources">("pages");
  const [data, setData] = useState<GA4Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectQuery = trpc.projects.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  const isConnected = !!projectQuery.data?.ga4PropertyId;

  useEffect(() => {
    if (!projectId || !isConnected) return;
    setLoading(true);
    setError(null);
    fetch(`/api/ga4/overview?projectId=${projectId}&days=${period}`)
      .then((res) => {
        if (!res.ok) throw new Error("GA4データの取得に失敗しました");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, period, isConnected]);

  // 未連携状態
  if (!isConnected && !projectQuery.isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Google Analytics 4</h1>
        <Card className="text-center py-12">
          <BarChart3 size={48} className="mx-auto text-text-dim mb-4" />
          <h2 className="text-lg font-bold mb-2">GA4を連携してください</h2>
          <p className="text-text-mid text-sm mb-6 max-w-md mx-auto">
            Google Analytics 4と連携することで、セッション数、ユーザー数、PV数、流入元などのトラフィックデータを確認できます。
          </p>
          <Button onClick={() => window.location.href = "/api/auth/gsc"}>
            <ExternalLink size={16} className="mr-1.5" />
            Googleアカウントを連携する
          </Button>
          <p className="text-xs text-text-dim mt-3">
            GSCと同じGoogleアカウントで認証されます。連携後、設定ページでGA4プロパティを選択してください。
          </p>
        </Card>
      </div>
    );
  }

  // Overview metrics
  const overviewRow = data?.overview?.rows?.[0]?.metricValues;
  const sessions = overviewRow ? parseInt(overviewRow[0]?.value || "0") : 0;
  const users = overviewRow ? parseInt(overviewRow[1]?.value || "0") : 0;
  const pageviews = overviewRow ? parseInt(overviewRow[2]?.value || "0") : 0;
  const bounceRate = overviewRow ? (parseFloat(overviewRow[3]?.value || "0") * 100).toFixed(1) : "0";

  // Top pages
  const topPages = (data?.topPages?.rows || []).map((row) => ({
    path: row.dimensionValues[0]?.value || "",
    views: parseInt(row.metricValues[0]?.value || "0"),
  }));

  // Traffic sources
  const sources = (data?.sources?.rows || []).map((row) => ({
    channel: row.dimensionValues[0]?.value || "",
    sessions: parseInt(row.metricValues[0]?.value || "0"),
  }));
  const totalSourceSessions = sources.reduce((sum, s) => sum + s.sessions, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Google Analytics 4</h1>
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

      {error && (
        <Card className="border-warn/30 bg-warn/5">
          <p className="text-sm text-warn">{error}</p>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users size={16} />}
          label="セッション"
          value={loading ? "..." : sessions.toLocaleString()}
          color="accent"
        />
        <MetricCard
          icon={<Users size={16} />}
          label="ユーザー"
          value={loading ? "..." : users.toLocaleString()}
          color="blue"
        />
        <MetricCard
          icon={<Eye size={16} />}
          label="PV数"
          value={loading ? "..." : pageviews.toLocaleString()}
          color="purple"
        />
        <MetricCard
          icon={<ArrowUpDown size={16} />}
          label="直帰率"
          value={loading ? "..." : `${bounceRate}%`}
          color="orange"
        />
      </div>

      {/* Data Tabs */}
      <Card className="!p-0">
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("pages")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              tab === "pages" ? "text-accent border-b-2 border-accent" : "text-text-dim hover:text-text"
            }`}
          >
            人気ページ
          </button>
          <button
            onClick={() => setTab("sources")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              tab === "sources" ? "text-accent border-b-2 border-accent" : "text-text-dim hover:text-text"
            }`}
          >
            流入元
          </button>
        </div>

        <div className="overflow-x-auto">
          {tab === "pages" ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-dim">
                  <th className="text-left px-4 py-3 font-medium">ページ</th>
                  <th className="text-right px-4 py-3 font-medium">PV数</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-text-dim">読み込み中...</td>
                  </tr>
                ) : topPages.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-text-dim">データがありません</td>
                  </tr>
                ) : (
                  topPages.map((page, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-card-alt/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-blue">{page.path}</td>
                      <td className="px-4 py-3 text-right text-text-mid">{page.views.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-dim">
                  <th className="text-left px-4 py-3 font-medium">チャネル</th>
                  <th className="text-right px-4 py-3 font-medium">セッション</th>
                  <th className="text-right px-4 py-3 font-medium">割合</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-text-dim">読み込み中...</td>
                  </tr>
                ) : sources.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-text-dim">データがありません</td>
                  </tr>
                ) : (
                  sources.map((src, i) => {
                    const pct = totalSourceSessions > 0 ? ((src.sessions / totalSourceSessions) * 100).toFixed(1) : "0";
                    return (
                      <tr key={i} className="border-b border-border/50 hover:bg-card-alt/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-text">
                          <ChannelLabel channel={src.channel} />
                        </td>
                        <td className="px-4 py-3 text-right text-text-mid">{src.sessions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-bg-soft rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent rounded-full"
                                style={{ width: `${Math.min(parseFloat(pct), 100)}%` }}
                              />
                            </div>
                            <span className="text-text-mid text-xs w-10 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

const channelLabels: Record<string, string> = {
  "Organic Search": "オーガニック検索",
  "Direct": "ダイレクト",
  "Social": "ソーシャル",
  "Referral": "リファラル",
  "Email": "メール",
  "Paid Search": "有料検索",
  "Display": "ディスプレイ",
  "Affiliates": "アフィリエイト",
  "Organic Social": "オーガニックソーシャル",
  "Paid Social": "有料ソーシャル",
};

function ChannelLabel({ channel }: { channel: string }) {
  return <>{channelLabels[channel] || channel}</>;
}
