"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { KeywordAddModal } from "@/components/keywords/KeywordAddModal";
import { ArrowUp, ArrowDown, Minus, Plus, Trash2, Search, Bot } from "lucide-react";

// Demo data until tRPC is wired to a real DB
const DEMO_KEYWORDS = [
  { id: "1", keyword: "SEO対策 やり方", searchVolume: 8100, keywordDifficulty: 42, currentPosition: 5, bestPosition: 3, previousPosition: 7, geoScore: 72, searchIntent: "INFORMATIONAL" as const },
  { id: "2", keyword: "GEO対策とは", searchVolume: 1900, keywordDifficulty: 18, currentPosition: 3, bestPosition: 2, previousPosition: 3, geoScore: 85, searchIntent: "INFORMATIONAL" as const },
  { id: "3", keyword: "検索順位チェックツール", searchVolume: 6600, keywordDifficulty: 55, currentPosition: 12, bestPosition: 8, previousPosition: 9, geoScore: 45, searchIntent: "COMMERCIAL" as const },
  { id: "4", keyword: "AI検索 対策", searchVolume: 2400, keywordDifficulty: 22, currentPosition: 8, bestPosition: 6, previousPosition: 11, geoScore: 68, searchIntent: "INFORMATIONAL" as const },
  { id: "5", keyword: "SEOツール 比較", searchVolume: 4400, keywordDifficulty: 65, currentPosition: 18, bestPosition: 15, previousPosition: 16, geoScore: 30, searchIntent: "COMMERCIAL" as const },
  { id: "6", keyword: "コンテンツSEO", searchVolume: 3200, keywordDifficulty: 38, currentPosition: 7, bestPosition: 4, previousPosition: 8, geoScore: 55, searchIntent: "INFORMATIONAL" as const },
  { id: "7", keyword: "LLMO 対策", searchVolume: 880, keywordDifficulty: 12, currentPosition: 2, bestPosition: 1, previousPosition: 2, geoScore: 90, searchIntent: "INFORMATIONAL" as const },
  { id: "8", keyword: "Ahrefs 代替", searchVolume: 1300, keywordDifficulty: 48, currentPosition: 25, bestPosition: 20, previousPosition: 22, geoScore: 20, searchIntent: "COMMERCIAL" as const },
];

type SortKey = "keyword" | "searchVolume" | "currentPosition" | "geoScore" | "keywordDifficulty";

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState(DEMO_KEYWORDS);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("currentPosition");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filtered = keywords
    .filter((kw) => kw.keyword.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[sortKey] ?? 999;
      const bVal = b[sortKey] ?? 999;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });

  const handleAdd = (kw: { keyword: string; targetUrl?: string }) => {
    const newKw = {
      id: crypto.randomUUID(),
      keyword: kw.keyword,
      searchVolume: null as unknown as number,
      keywordDifficulty: null as unknown as number,
      currentPosition: null as unknown as number,
      bestPosition: null as unknown as number,
      previousPosition: null as unknown as number,
      geoScore: null as unknown as number,
      searchIntent: "INFORMATIONAL" as const,
    };
    setKeywords([newKw, ...keywords]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setKeywords(keywords.filter((kw) => kw.id !== id));
  };

  const intentColors: Record<string, "blue" | "orange" | "purple" | "green"> = {
    INFORMATIONAL: "blue",
    COMMERCIAL: "orange",
    TRANSACTIONAL: "purple",
    NAVIGATIONAL: "green",
  };

  const intentLabels: Record<string, string> = {
    INFORMATIONAL: "情報",
    COMMERCIAL: "商用",
    TRANSACTIONAL: "取引",
    NAVIGATIONAL: "指名",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">キーワード管理</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} className="mr-1.5" />
          キーワード追加
        </Button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            placeholder="キーワードを検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50"
          />
        </div>
        <div className="flex gap-2 text-sm text-text-mid">
          <span className="bg-card border border-border rounded-lg px-3 py-2">
            合計: <span className="text-text font-medium">{keywords.length}</span> KW
          </span>
          <span className="bg-card border border-border rounded-lg px-3 py-2">
            TOP10: <span className="text-accent font-medium">{keywords.filter(kw => kw.currentPosition && kw.currentPosition <= 10).length}</span>
          </span>
        </div>
      </div>

      {/* Keywords Table */}
      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-mid">
                <SortHeader label="キーワード" sortKey="keyword" currentKey={sortKey} asc={sortAsc} onSort={handleSort} />
                <SortHeader label="検索Vol" sortKey="searchVolume" currentKey={sortKey} asc={sortAsc} onSort={handleSort} className="text-right" />
                <SortHeader label="KD" sortKey="keywordDifficulty" currentKey={sortKey} asc={sortAsc} onSort={handleSort} className="text-right" />
                <SortHeader label="順位" sortKey="currentPosition" currentKey={sortKey} asc={sortAsc} onSort={handleSort} className="text-right" />
                <th className="px-4 py-3 text-right font-medium">変動</th>
                <SortHeader label="GEO" sortKey="geoScore" currentKey={sortKey} asc={sortAsc} onSort={handleSort} className="text-right" />
                <th className="px-4 py-3 text-center font-medium">意図</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((kw) => {
                const change = kw.previousPosition && kw.currentPosition
                  ? kw.previousPosition - kw.currentPosition
                  : 0;
                return (
                  <tr key={kw.id} className="border-b border-border/50 hover:bg-card-alt/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text">{kw.keyword}</td>
                    <td className="px-4 py-3 text-right text-text-mid">
                      {kw.searchVolume ? kw.searchVolume.toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <KdBadge value={kw.keywordDifficulty} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <PositionBadge position={kw.currentPosition} best={kw.bestPosition} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChangeIndicator change={change} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <GeoScoreBadge score={kw.geoScore} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {kw.searchIntent && (
                        <Badge color={intentColors[kw.searchIntent] || "blue"} size="sm">
                          {intentLabels[kw.searchIntent] || kw.searchIntent}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(kw.id)}
                        className="text-text-dim hover:text-warn transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-dim">
                    {search ? "該当するキーワードがありません" : "キーワードを追加してください"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <KeywordAddModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

/* Sub-components */

function SortHeader({
  label,
  sortKey,
  currentKey,
  asc,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  asc: boolean;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sortKey === currentKey;
  return (
    <th
      className={`px-4 py-3 font-medium cursor-pointer select-none hover:text-text transition-colors ${className}`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      {active && <span className="ml-1">{asc ? "↑" : "↓"}</span>}
    </th>
  );
}

function PositionBadge({ position, best }: { position: number | null; best: number | null }) {
  if (!position) return <span className="text-text-dim">-</span>;
  const color = position <= 3 ? "text-accent" : position <= 10 ? "text-blue" : position <= 20 ? "text-orange" : "text-text-mid";
  return (
    <div className="flex items-center justify-end gap-1">
      <span className={`font-bold ${color}`}>{position}</span>
      {best && best < position && (
        <span className="text-[10px] text-text-dim">({best})</span>
      )}
    </div>
  );
}

function ChangeIndicator({ change }: { change: number }) {
  if (change === 0) return <Minus size={14} className="inline text-text-dim" />;
  if (change > 0) {
    return (
      <span className="inline-flex items-center text-accent text-sm font-medium">
        <ArrowUp size={14} className="mr-0.5" />
        {change}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-warn text-sm font-medium">
      <ArrowDown size={14} className="mr-0.5" />
      {Math.abs(change)}
    </span>
  );
}

function KdBadge({ value }: { value: number | null }) {
  if (!value && value !== 0) return <span className="text-text-dim">-</span>;
  const color = value <= 30 ? "text-accent" : value <= 60 ? "text-orange" : "text-warn";
  return <span className={`font-medium ${color}`}>{value}</span>;
}

function GeoScoreBadge({ score }: { score: number | null }) {
  if (!score && score !== 0) return <span className="text-text-dim">-</span>;
  const color = score >= 70 ? "text-accent" : score >= 40 ? "text-orange" : "text-warn";
  return (
    <span className="inline-flex items-center gap-1">
      <Bot size={12} className={color} />
      <span className={`font-medium ${color}`}>{score}</span>
    </span>
  );
}
