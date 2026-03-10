import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <Header />
      <main className="md:ml-60 pb-20 md:pb-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
