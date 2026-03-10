import React from "react";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { BarChart3, Search, Bot, Stethoscope } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Search size={16} />}
          label="登録KW数"
          value="0"
          color="accent"
        />
        <MetricCard
          icon={<BarChart3 size={16} />}
          label="TOP10 KW"
          value="0"
          color="blue"
        />
        <MetricCard
          icon={<Bot size={16} />}
          label="GEOスコア"
          value="-"
          color="purple"
        />
        <MetricCard
          icon={<Stethoscope size={16} />}
          label="サイトヘルス"
          value="-"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-medium text-text-mid mb-4">最近の順位変動</h3>
          <p className="text-text-dim text-sm">キーワードを登録すると順位変動が表示されます</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-text-mid mb-4">GEO言及状況</h3>
          <p className="text-text-dim text-sm">GEOモニタリングを開始すると結果が表示されます</p>
        </Card>
      </div>
    </div>
  );
}
