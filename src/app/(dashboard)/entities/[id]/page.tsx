"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EntityDetail, type Entity } from "@/features/engineering/components/entity-detail";
import { EntityEditor } from "@/features/engineering/components/entity-editor";
import { RelationshipOverview } from "@/features/engineering/components/relationship-overview";

export default function EntityDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [tab, setTab] = useState("details");

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this entity?")) return;
    try {
      const res = await fetch(`/api/engineering/entities/${params.id}`, { method: "DELETE" });
      if (res.ok) router.push("/entities");
    } catch {
      // silently fail
    }
  }

  if (editing && editingEntity) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-8">
        <h1 className="text-foreground text-2xl font-bold">Edit Entity</h1>
        <EntityEditor
          initialData={{
            id: editingEntity.id,
            identifier: editingEntity.identifier,
            name: editingEntity.name,
            description: editingEntity.description,
            entityType: editingEntity.entityType,
            status: editingEntity.status,
          }}
          onSuccess={() => {
            setEditing(false);
            setEditingEntity(null);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="border-border flex gap-4 border-b">
          <TabsTrigger
            value="details"
            className="data-[state=active]:border-foreground pb-2 text-sm font-medium data-[state=active]:border-b-2"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="relationships"
            className="data-[state=active]:border-foreground pb-2 text-sm font-medium data-[state=active]:border-b-2"
          >
            Relationships
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <EntityDetail
            entityId={params.id}
            onEdit={(entity) => {
              setEditingEntity(entity);
              setEditing(true);
            }}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="relationships" className="mt-6">
          <RelationshipOverview entityId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
