"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { BarChart3, Search, Bot, Stethoscope, ArrowUp, ArrowDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/components/providers/ProjectProvider";

export default function DashboardPage() {
  const { projectId } = useProject();

  const summary = trpc.dashboard.getSummary.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const changes = trpc.dashboard.getRecentChanges.useQuery(
    { projectId: projectId!, limit: 5 },
    { enabled: !!projectId }
  );
  const geoSummary = trpc.dashboard.getGeoSummary.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const s = summary.data;
  const recentChanges = changes.data ?? [];
  const geo = geoSummary.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      {!projectId && (
        <Card>
          <p className="text-text-dim text-sm">
            プロジェクトが選択されていません。設定画面からプロジェクトを作成・選択してください。
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Search size={16} />}
          label="登録KW数"
          value={s?.totalKeywords?.toString() ?? "0"}
          color="accent"
        />
        <MetricCard
          icon={<BarChart3 size={16} />}
          label="TOP10 KW"
          value={s?.top10Keywords?.toString() ?? "0"}
          color="blue"
        />
        <MetricCard
          icon={<Bot size={16} />}
          label="GEOスコア"
          value={s?.avgGeoScore?.toString() ?? "-"}
          color="purple"
        />
        <MetricCard
          icon={<Stethoscope size={16} />}
          label="サイトヘルス"
          value={s?.siteHealth?.toString() ?? "-"}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-medium text-text-mid mb-4">最近の順位変動</h3>
          {recentChanges.length === 0 ? (
            <p className="text-text-dim text-sm">キーワードを登録すると順位変動が表示されます</p>
          ) : (
            <div className="space-y-2">
              {recentChanges.map((row) => (
                <div key={row.id} className="flex items-center justify-between text-sm">
                  <span className="text-text truncate mr-2">{row.keyword}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-text-dim">{row.previousPosition}</span>
                    <span className="text-text-dim">→</span>
                    <span className="font-bold text-text">{row.currentPosition}</span>
                    {row.change > 0 ? (
                      <span className="flex items-center text-accent text-xs font-medium">
                        <ArrowUp size={12} />{row.change}
                      </span>
                    ) : (
                      <span className="flex items-center text-warn text-xs font-medium">
                        <ArrowDown size={12} />{Math.abs(row.change)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-text-mid mb-4">GEO言及状況</h3>
          {!geo || geo.totalChecked === 0 ? (
            <p className="text-text-dim text-sm">GEOモニタリングを開始すると結果が表示されます</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-mid">チェック済みKW</span>
                <span className="font-bold text-text">{geo.totalChecked}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-mid">言及あり</span>
                <span className="font-bold text-accent">{geo.mentionedCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-mid">対応エンジン</span>
                <span className="text-text-dim text-xs">{geo.engines.join(", ")}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
