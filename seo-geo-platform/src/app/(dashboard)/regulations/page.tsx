"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, ClipboardList, Share2, Trash2 } from "lucide-react";

const DEMO_REGULATIONS = [
  {
    id: "1",
    name: "コーポレートサイト用",
    tone: "DESU_MASU",
    status: "ACTIVE",
    rulesCount: 12,
    createdAt: "2026-02-10",
    shareToken: null,
  },
  {
    id: "2",
    name: "ブログ記事用",
    tone: "DESU_MASU",
    status: "ACTIVE",
    rulesCount: 8,
    createdAt: "2026-02-15",
    shareToken: "abc123",
  },
  {
    id: "3",
    name: "LP用（テスト）",
    tone: "DA_DEARU",
    status: "DRAFT",
    rulesCount: 3,
    createdAt: "2026-03-01",
    shareToken: null,
  },
];

const DEMO_RULES = [
  { id: "r1", ruleType: "NG_WORD", ruleKey: "させていただく", ruleValue: "「いたします」に統一", severity: "WARNING" },
  { id: "r2", ruleType: "NG_WORD", ruleKey: "etc.", ruleValue: "「など」を使用", severity: "WARNING" },
  { id: "r3", ruleType: "EXPRESSION_UNIFY", ruleKey: "ホームページ", ruleValue: "「Webサイト」に統一", severity: "WARNING" },
  { id: "r4", ruleType: "EXPRESSION_UNIFY", ruleKey: "お問い合わせ", ruleValue: "「お問合せ」は不可", severity: "ERROR" },
  { id: "r5", ruleType: "REQUIRED_ELEMENT", ruleKey: "メタディスクリプション", ruleValue: "120〜160文字で記述", severity: "ERROR" },
  { id: "r6", ruleType: "STYLE_GUIDE", ruleKey: "数字", ruleValue: "半角数字を使用（全角不可）", severity: "WARNING" },
];

const toneLabels: Record<string, string> = {
  DESU_MASU: "です・ます調",
  DA_DEARU: "だ・である調",
  MIXED: "混合",
};

const statusColors: Record<string, "accent" | "blue" | "dim"> = {
  ACTIVE: "accent",
  DRAFT: "blue",
  ARCHIVED: "dim",
};

const ruleTypeLabels: Record<string, string> = {
  NG_WORD: "NGワード",
  EXPRESSION_UNIFY: "表記統一",
  REQUIRED_ELEMENT: "必須要素",
  STYLE_GUIDE: "スタイルガイド",
};

export default function RegulationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(DEMO_REGULATIONS[0].id);

  const selected = DEMO_REGULATIONS.find((r) => r.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">レギュレーション</h1>
        <Button>
          <Plus size={16} className="mr-1.5" />
          新規作成
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Regulation List */}
        <div className="space-y-3">
          {DEMO_REGULATIONS.map((reg) => (
            <Card
              key={reg.id}
              hover
              className={`cursor-pointer ${selectedId === reg.id ? "!border-accent/50" : ""}`}
            >
              <div onClick={() => setSelectedId(reg.id)}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-text">{reg.name}</h3>
                  <Badge color={statusColors[reg.status]} size="sm">
                    {reg.status === "ACTIVE" ? "有効" : reg.status === "DRAFT" ? "下書き" : "アーカイブ"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-dim">
                  <span>{toneLabels[reg.tone]}</span>
                  <span>ルール {reg.rulesCount}件</span>
                  {reg.shareToken && (
                    <span className="flex items-center gap-0.5 text-blue">
                      <Share2 size={10} /> 共有中
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Rule Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">{selected.name}</h2>
                  <p className="text-xs text-text-dim mt-0.5">
                    {toneLabels[selected.tone]} | 作成日: {selected.createdAt}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Share2 size={14} className="mr-1" />
                    共有リンク
                  </Button>
                  <Button size="sm" variant="outline">
                    <Plus size={14} className="mr-1" />
                    ルール追加
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {DEMO_RULES.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between border border-border rounded-lg px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge
                        color={rule.severity === "ERROR" ? "warn" : "orange"}
                        size="sm"
                      >
                        {ruleTypeLabels[rule.ruleType]}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm text-text">
                          <span className="font-medium">{rule.ruleKey}</span>
                          <span className="text-text-dim mx-1.5">→</span>
                          <span className="text-text-mid">{rule.ruleValue}</span>
                        </p>
                      </div>
                    </div>
                    <button className="text-text-dim hover:text-warn transition-colors ml-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="text-center py-12">
              <ClipboardList size={48} className="mx-auto text-text-dim mb-4" />
              <p className="text-text-mid text-sm">レギュレーションを選択してください</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
