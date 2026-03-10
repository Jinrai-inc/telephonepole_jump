"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, FileText, User } from "lucide-react";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="md:hidden flex items-center justify-between p-4 bg-bg-soft border-b border-border sticky top-0 z-40">
        <button onClick={() => setMenuOpen(true)} className="text-text-mid">
          <Menu size={24} />
        </button>
        <Link href="/" className="text-lg font-bold">
          <span className="bg-gradient-to-r from-accent to-blue bg-clip-text text-transparent">
            SEO×GEO
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button className="text-text-mid hover:text-text">
            <FileText size={20} />
          </button>
          <button className="w-8 h-8 rounded-full bg-card-alt flex items-center justify-center">
            <User size={16} className="text-text-mid" />
          </button>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
