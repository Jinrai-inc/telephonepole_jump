"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Globe,
  Bell,
  CreditCard,
  User,
  Link2,
  Shield,
  ChevronRight,
} from "lucide-react";

type Tab = "project" | "notifications" | "billing" | "account";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("project");

  const tabs = [
    { key: "project" as const, label: "プロジェクト", icon: Globe },
    { key: "notifications" as const, label: "通知設定", icon: Bell },
    { key: "billing" as const, label: "プラン・請求", icon: CreditCard },
    { key: "account" as const, label: "アカウント", icon: User },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-bg-soft rounded-lg p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? "bg-card text-text shadow-sm" : "text-text-dim hover:text-text"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "project" && <ProjectSettings />}
      {tab === "notifications" && <NotificationSettings />}
      {tab === "billing" && <BillingSettings />}
      {tab === "account" && <AccountSettings />}
    </div>
  );
}

function ProjectSettings() {
  const [domain, setDomain] = useState("example.com");
  const [projectName, setProjectName] = useState("メインサイト");

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-medium text-text-mid mb-4">プロジェクト情報</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-mid mb-1.5">プロジェクト名</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50"
            />
          </div>
          <div>
            <label className="block text-sm text-text-mid mb-1.5">ドメイン</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50"
            />
          </div>
          <Button>保存</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-text-mid mb-4">外部サービス連携</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Link2 size={18} className="text-text-dim" />
              <div>
                <p className="text-sm font-medium">Google Search Console</p>
                <p className="text-xs text-text-dim">クリック数・表示回数・掲載順位を取得</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.location.href = "/api/auth/gsc"}>
              連携する
            </Button>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <div className="flex items-center gap-3">
              <Link2 size={18} className="text-text-dim" />
              <div>
                <p className="text-sm font-medium">Google Analytics 4</p>
                <p className="text-xs text-text-dim">トラフィックデータを取得</p>
              </div>
            </div>
            <Badge color="dim">近日対応</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <div className="flex items-center gap-3">
              <Link2 size={18} className="text-text-dim" />
              <div>
                <p className="text-sm font-medium">DataForSEO</p>
                <p className="text-xs text-text-dim">順位取得・キーワードデータ</p>
              </div>
            </div>
            <Badge color="accent">接続済み</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

function NotificationSettings() {
  const [slackUrl, setSlackUrl] = useState("");
  const [rankThreshold, setRankThreshold] = useState(5);
  const [notifyRank, setNotifyRank] = useState(true);
  const [notifyGeo, setNotifyGeo] = useState(true);
  const [notifyErrors, setNotifyErrors] = useState(true);

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-medium text-text-mid mb-4">Slack通知</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-mid mb-1.5">Webhook URL</label>
            <input
              type="url"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50"
            />
          </div>
          <Button size="sm" variant="outline">テスト送信</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-text-mid mb-4">通知トリガー</h3>
        <div className="space-y-4">
          <ToggleRow
            label="順位変動アラート"
            description={`${rankThreshold}位以上の変動を検知`}
            checked={notifyRank}
            onChange={setNotifyRank}
          />
          {notifyRank && (
            <div className="ml-8">
              <label className="block text-xs text-text-dim mb-1">しきい値（位）</label>
              <input
                type="number"
                value={rankThreshold}
                onChange={(e) => setRankThreshold(Number(e.target.value))}
                min={1}
                max={50}
                className="w-20 bg-bg border border-border rounded-lg px-2 py-1 text-sm text-text focus:outline-none focus:border-accent/50"
              />
            </div>
          )}
          <ToggleRow
            label="GEO変動アラート"
            description="AI検索での言及状態が変化した時"
            checked={notifyGeo}
            onChange={setNotifyGeo}
          />
          <ToggleRow
            label="エラー通知"
            description="データ取得エラー発生時"
            checked={notifyErrors}
            onChange={setNotifyErrors}
          />
          <Button>保存</Button>
        </div>
      </Card>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-mid">現在のプラン</h3>
          <Badge color="accent">スターター</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: "スターター",
              price: "¥12,800",
              features: ["プロジェクト1件", "KW 100件", "GEOチェック 50回/月"],
              current: true,
            },
            {
              name: "ビジネス",
              price: "¥29,800",
              features: ["プロジェクト5件", "KW 500件", "GEOチェック 200回/月", "ホワイトラベルレポート"],
              recommended: true,
            },
            {
              name: "エージェンシー",
              price: "¥59,800",
              features: ["プロジェクト20件", "KW 2,000件", "GEOチェック 1,000回/月", "API アクセス", "専用サポート"],
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`border rounded-xl p-4 ${
                plan.current
                  ? "border-accent bg-accent/5"
                  : plan.recommended
                  ? "border-blue bg-blue/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-text">{plan.name}</h4>
                {plan.recommended && <Badge color="blue" size="sm">おすすめ</Badge>}
                {plan.current && <Badge color="accent" size="sm">現在</Badge>}
              </div>
              <p className="text-2xl font-bold text-text mb-1">
                {plan.price}<span className="text-sm font-normal text-text-dim">/月</span>
              </p>
              <ul className="space-y-1.5 mt-3">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-text-mid flex items-start gap-1.5">
                    <span className="text-accent mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-4"
                variant={plan.current ? "ghost" : "primary"}
                size="sm"
                disabled={plan.current}
              >
                {plan.current ? "現在のプラン" : "アップグレード"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-text-mid mb-4">請求情報</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-text-mid">支払い方法</span>
            <span className="text-text">未設定</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-text-mid">次回請求日</span>
            <span className="text-text">-</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-text-mid">請求履歴</span>
            <button className="text-accent text-sm hover:underline flex items-center gap-1">
              確認する <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AccountSettings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-medium text-text-mid mb-4">プロフィール</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-mid mb-1.5">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50"
            />
          </div>
          <div>
            <label className="block text-sm text-text-mid mb-1.5">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50"
            />
          </div>
          <Button>保存</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-text-mid mb-4">セキュリティ</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-text-dim" />
              <div>
                <p className="text-sm font-medium">パスワード変更</p>
                <p className="text-xs text-text-dim">定期的な変更を推奨します</p>
              </div>
            </div>
            <Button size="sm" variant="outline">変更</Button>
          </div>
        </div>
      </Card>

      <Card className="border-warn/30">
        <h3 className="text-sm font-medium text-warn mb-2">危険ゾーン</h3>
        <p className="text-xs text-text-dim mb-3">アカウントを削除すると、全てのデータが完全に削除されます。この操作は取り消せません。</p>
        <Button variant="ghost" size="sm" className="!text-warn !border-warn/30 border">
          アカウントを削除
        </Button>
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-xs text-text-dim">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-colors relative ${
          checked ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
