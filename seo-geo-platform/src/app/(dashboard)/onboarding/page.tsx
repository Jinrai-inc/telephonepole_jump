"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StepNav } from "@/components/ui/StepNav";
import { Globe, Key, Link2, Check } from "lucide-react";

const steps = [
  { label: "サイト情報", icon: Globe },
  { label: "キーワード", icon: Key },
  { label: "連携", icon: Link2 },
  { label: "完了", icon: Check },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [domain, setDomain] = useState("");
  const [keywords, setKeywords] = useState("");

  const next = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">プロジェクトをセットアップ</h1>
        <p className="text-text-mid text-sm mt-1">3ステップで順位トラッキングを開始できます</p>
      </div>

      <StepNav steps={steps.map((s) => ({ label: s.label }))} currentStep={currentStep} />

      {currentStep === 0 && (
        <Card>
          <h2 className="text-lg font-bold mb-4">サイト情報を入力</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-mid mb-1.5">プロジェクト名</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="例: コーポレートサイト"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-text-mid mb-1.5">ドメイン</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="例: example.com"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50"
              />
              <p className="text-xs text-text-dim mt-1">https:// なしで入力してください</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={next} disabled={!projectName.trim() || !domain.trim()}>
                次へ
              </Button>
            </div>
          </div>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <h2 className="text-lg font-bold mb-4">追跡するキーワードを登録</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-mid mb-1.5">
                キーワード（1行1キーワード）
              </label>
              <textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder={"SEO対策 やり方\nGEO対策とは\n検索順位チェックツール\nAI検索 対策\nLLMO 対策"}
                rows={8}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50 resize-none"
                autoFocus
              />
              <p className="text-xs text-text-dim mt-1">
                {keywords.split("\n").filter((l) => l.trim()).length} 件のキーワード
                <span className="text-text-dim ml-2">（スタータープランは最大100件）</span>
              </p>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={prev}>戻る</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={next}>スキップ</Button>
                <Button onClick={next} disabled={!keywords.trim()}>次へ</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <h2 className="text-lg font-bold mb-4">外部サービスを連携（任意）</h2>
          <div className="space-y-4">
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Google Search Console</h3>
                  <p className="text-xs text-text-dim mt-0.5">クリック数・表示回数を取得できます</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => window.location.href = "/api/auth/gsc"}>
                  連携する
                </Button>
              </div>
            </div>
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Slack通知</h3>
                  <p className="text-xs text-text-dim mt-0.5">順位変動やGEO変化をSlackに通知</p>
                </div>
                <Button size="sm" variant="outline">設定する</Button>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={prev}>戻る</Button>
              <Button onClick={next}>次へ</Button>
            </div>
          </div>
        </Card>
      )}

      {currentStep === 3 && (
        <Card className="text-center py-8">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-accent" />
          </div>
          <h2 className="text-xl font-bold mb-2">セットアップ完了！</h2>
          <p className="text-text-mid text-sm mb-6 max-w-md mx-auto">
            プロジェクト「{projectName || "メインサイト"}」の設定が完了しました。
            {keywords.trim() && (
              <>
                {keywords.split("\n").filter((l) => l.trim()).length}件のキーワードを登録しました。
              </>
            )}
            初回の順位チェックは数分以内に自動で実行されます。
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => window.location.href = "/keywords"}>
              キーワード管理へ
            </Button>
            <Button onClick={() => window.location.href = "/"}>
              ダッシュボードへ
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
