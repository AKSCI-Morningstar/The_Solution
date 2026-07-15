"use client";

import { SettingsPanel } from "@/features/settings";

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage account preferences, organization access, and workspace appearance.
        </p>
      </div>
      <SettingsPanel />
    </div>
  );
}
