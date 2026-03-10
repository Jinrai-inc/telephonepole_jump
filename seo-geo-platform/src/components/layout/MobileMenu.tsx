"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, BarChart3, Search, PenTool, Bot, Stethoscope, ClipboardList, FileText, Settings } from "lucide-react";

const navItems = [
  { href: "/", icon: BarChart3, label: "概要" },
  { href: "/keywords", icon: Search, label: "キーワード" },
  { href: "/articles", icon: PenTool, label: "記事作成" },
  { href: "/geo", icon: Bot, label: "GEO分析" },
  { href: "/audit", icon: Stethoscope, label: "サイト監査" },
  { href: "/regulations", icon: ClipboardList, label: "レギュレーション" },
  { href: "/reports", icon: FileText, label: "レポート" },
  { href: "/settings", icon: Settings, label: "設定" },
];

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-72 bg-bg-soft border-r border-border p-4 animate-in slide-in-from-left">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xl font-bold bg-gradient-to-r from-accent to-blue bg-clip-text text-transparent">
            SEO×GEO
          </span>
          <button onClick={onClose} className="text-text-mid">
            <X size={24} />
          </button>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-accent-soft text-accent" : "text-text-mid hover:text-text hover:bg-card"
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
