"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Search,
  TrendingUp,
  PenTool,
  Bot,
  Link2,
  Stethoscope,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/", icon: BarChart3, label: "概要" },
  { href: "/keywords", icon: Search, label: "キーワード" },
  { href: "/rankings", icon: TrendingUp, label: "順位トラッキング" },
  { href: "/gsc", icon: Link2, label: "Search Console" },
  { href: "/geo", icon: Bot, label: "GEO分析" },
  { href: "/articles", icon: PenTool, label: "記事作成" },
  { href: "/audit", icon: Stethoscope, label: "サイト監査" },
  { href: "/regulations", icon: ClipboardList, label: "レギュレーション" },
  { href: "/reports", icon: FileText, label: "レポート" },
  { href: "/settings", icon: Settings, label: "設定" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen bg-bg-soft border-r border-border fixed left-0 top-0">
      <div className="p-4 border-b border-border">
        <Link href="/" className="text-xl font-bold">
          <span className="bg-gradient-to-r from-accent to-blue bg-clip-text text-transparent">
            SEO×GEO
          </span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-accent-soft text-accent"
                  : "text-text-mid hover:text-text hover:bg-card"
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <button
          onClick={async () => {
            await fetch("/api/auth/demo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "logout" }),
            });
            localStorage.removeItem("seo-geo-project-id");
            localStorage.removeItem("seo-geo-org-id");
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-mid hover:text-warn hover:bg-warn/10 transition-colors w-full"
        >
          <LogOut size={18} />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
}
