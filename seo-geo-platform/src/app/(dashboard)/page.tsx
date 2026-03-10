"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/components/providers/ProjectProvider";
import {
  Search,
  TrendingUp,
  Bot,
  Stethoscope,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function DashboardPage() {
  const { projectId } = useProject();

  const summaryQuery = trpc.dashboard.getSummary.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const changesQuery = trpc.dashboard.getRecentChanges.useQuery(
    { projectId: projectId!, limit: 5 },
    { enabled: !!projectId }
  );
  const geoQuery = trpc.dashboard.getGeoSummary.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const summary = summaryQuery.data;
  const changes = changesQuery.data ?? [];
  const geo = geoQuery.data;

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64 text-text-dim">
        プロジェクトが選択されていません。
        <a href="/onboarding" className="ml-2 text-accent hover:underline">セットアップ</a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Search}
          label="登録キーワード"
          value={summary?.totalKeywords ?? 0}
          unit="件"
          loading={summaryQuery.isLoading}
        />
        <MetricCard
          icon={TrendingUp}
          label="TOP10 キーワード"
          value={summary?.top10Keywords ?? 0}
          unit="件"
          accent
          loading={summaryQuery.isLoading}
        />
        <MetricCard
          icon={Bot}
          label="平均GEOスコア"
          value={summary?.avgGeoScore ?? "-"}
          unit={summary?.avgGeoScore !== null ? "/100" : ""}
          loading={summaryQuery.isLoading}
        />
        <MetricCard
          icon={Stethoscope}
          label="サイトヘルス"
          value={summary?.siteHealth ?? "-"}
          unit={summary?.siteHealth !== null ? "%" : ""}
          loading={summaryQuery.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Rank Changes */}
        <Card>
          <h2 className="text-lg font-bold mb-4">最近の順位変動</h2>
          {changes.length === 0 ? (
            <p className="text-text-dim text-sm py-8 text-center">
              順位データがまだありません
            </p>
          ) : (
            <div className="space-y-3">
              {changes.map((kw) => (
                <div key={kw.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-text">{kw.keyword}</span>
                    <span className="text-xs text-text-dim ml-2">
                      {kw.previousPosition ?? "-"} → {kw.currentPosition ?? "-"}
                    </span>
                  </div>
                  <ChangeChip change={kw.change} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* GEO Summary */}
        <Card>
          <h2 className="text-lg font-bold mb-4">GEO モニタリング</h2>
          {!geo || geo.totalChecked === 0 ? (
            <p className="text-text-dim text-sm py-8 text-center">
              GEOチェックデータがまだありません
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-soft rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-text">{geo.totalChecked}</div>
                  <div className="text-xs text-text-mid mt-1">チェック済みKW</div>
                </div>
                <div className="bg-bg-soft rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-accent">{geo.mentionedCount}</div>
                  <div className="text-xs text-text-mid mt-1">AI言及あり</div>
                </div>
              </div>
              <div>
                <h3 className="text-xs text-text-mid mb-2">対象AIエンジン</h3>
                <div className="flex flex-wrap gap-2">
                  {geo.engines.map((engine) => (
                    <span key={engine} className="text-xs bg-card-alt border border-border rounded-full px-3 py-1 text-text-mid">
                      {engine}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  accent,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit: string;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent ? "bg-accent/10" : "bg-bg-soft"}`}>
        <Icon size={20} className={accent ? "text-accent" : "text-text-mid"} />
      </div>
      <div>
        <div className="text-xs text-text-mid">{label}</div>
        {loading ? (
          <div className="h-7 w-16 bg-bg-soft rounded animate-pulse mt-1" />
        ) : (
          <div className="text-2xl font-bold mt-0.5">
            <span className={accent ? "text-accent" : "text-text"}>{value}</span>
            <span className="text-sm text-text-dim font-normal ml-0.5">{unit}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function ChangeChip({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center text-accent text-sm font-medium bg-accent/10 rounded-full px-2.5 py-0.5">
        <ArrowUp size={14} className="mr-0.5" />
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center text-warn text-sm font-medium bg-warn/10 rounded-full px-2.5 py-0.5">
        <ArrowDown size={14} className="mr-0.5" />
        {Math.abs(change)}
      </span>
    );
  }
  return null;
}
