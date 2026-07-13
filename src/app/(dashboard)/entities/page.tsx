"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EntityList } from "@/features/engineering/components";
import { EntityEditor } from "@/features/engineering/components";

export default function EntitiesPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            Engineering Entities
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage components, assemblies, requirements, and all engineering entities
          </p>
        </div>
      </div>

      {showCreate ? (
        <div className="flex flex-col gap-6">
          <h2 className="text-foreground text-lg font-semibold">New Entity</h2>
          <EntityEditor
            onSuccess={() => {
              setShowCreate(false);
              router.refresh();
            }}
          />
          <button
            onClick={() => setShowCreate(false)}
            className="text-muted-foreground self-start text-sm hover:underline"
          >
            &larr; Back to list
          </button>
        </div>
      ) : (
        <EntityList onCreate={() => setShowCreate(true)} />
      )}
    </div>
  );
}
