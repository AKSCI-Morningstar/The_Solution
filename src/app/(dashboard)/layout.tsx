import { Shell } from "@/components/layout";
import { CommandPalette } from "@/components/CommandPalette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      <CommandPalette />
      {children}
    </Shell>
  );
}
