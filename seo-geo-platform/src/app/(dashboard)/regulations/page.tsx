"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, ClipboardList, Share2, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/components/providers/ProjectProvider";

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
  const { orgId } = useProject();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const regulationsQuery = trpc.regulations.getAll.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );
  const detailQuery = trpc.regulations.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );
  const createMutation = trpc.regulations.create.useMutation({
    onSuccess: () => utils.regulations.getAll.invalidate(),
  });
  const shareMutation = trpc.regulations.generateShareToken.useMutation({
    onSuccess: () => {
      utils.regulations.getAll.invalidate();
      utils.regulations.getById.invalidate();
    },
  });
  const addRuleMutation = trpc.regulations.addRule.useMutation({
    onSuccess: () => utils.regulations.getById.invalidate(),
  });
  const deleteRuleMutation = trpc.regulations.deleteRule.useMutation({
    onSuccess: () => utils.regulations.getById.invalidate(),
  });

  const regulations = regulationsQuery.data ?? [];
  const selected = detailQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">レギュレーション</h1>
        <Button onClick={() => {
          if (!orgId) return;
          const name = prompt("レギュレーション名を入力してください");
          if (name) createMutation.mutate({ orgId, name });
        }}>
          <Plus size={16} className="mr-1.5" />
          新規作成
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Regulation List */}
        <div className="space-y-3">
          {regulations.length === 0 ? (
            <Card>
              <p className="text-text-dim text-sm text-center py-4">レギュレーションがありません</p>
            </Card>
          ) : (
            regulations.map((reg) => (
              <Card
                key={reg.id}
                hover
                className={`cursor-pointer ${selectedId === reg.id ? "!border-accent/50" : ""}`}
              >
                <div onClick={() => setSelectedId(reg.id)}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-text">{reg.name}</h3>
                    <Badge color={statusColors[reg.status] ?? "dim"} size="sm">
                      {reg.status === "ACTIVE" ? "有効" : reg.status === "DRAFT" ? "下書き" : "アーカイブ"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-dim">
                    <span>{toneLabels[reg.tone] ?? reg.tone}</span>
                    <span>ルール {reg._count.rules}件</span>
                    {reg.shareToken && (
                      <span className="flex items-center gap-0.5 text-blue">
                        <Share2 size={10} /> 共有中
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Rule Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">{selected.name}</h2>
                  <p className="text-xs text-text-dim mt-0.5">
                    {toneLabels[selected.tone] ?? selected.tone} | 作成日: {new Date(selected.createdAt).toISOString().split("T")[0]}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => shareMutation.mutate({ id: selected.id })}>
                    <Share2 size={14} className="mr-1" />
                    共有リンク
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const ruleKey = prompt("ルールキー（例: させていただく）");
                    const ruleValue = prompt("ルール値（例: 「いたします」に統一）");
                    if (ruleKey && ruleValue) {
                      addRuleMutation.mutate({ regulationId: selected.id, ruleType: "NG_WORD", ruleKey, ruleValue });
                    }
                  }}>
                    <Plus size={14} className="mr-1" />
                    ルール追加
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {selected.rules.length === 0 ? (
                  <p className="text-text-dim text-sm text-center py-4">ルールがありません</p>
                ) : (
                  selected.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between border border-border rounded-lg px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Badge
                          color={rule.severity === "ERROR" ? "warn" : "orange"}
                          size="sm"
                        >
                          {ruleTypeLabels[rule.ruleType] ?? rule.ruleType}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-sm text-text">
                            <span className="font-medium">{rule.ruleKey}</span>
                            <span className="text-text-dim mx-1.5">→</span>
                            <span className="text-text-mid">{rule.ruleValue}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteRuleMutation.mutate({ id: rule.id })}
                        className="text-text-dim hover:text-warn transition-colors ml-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
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
