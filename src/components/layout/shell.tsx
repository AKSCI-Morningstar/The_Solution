import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Footer } from "./footer";
import { SearchCommandPalette } from "@/features/search";

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <SearchCommandPalette />
    </div>
  );
}
