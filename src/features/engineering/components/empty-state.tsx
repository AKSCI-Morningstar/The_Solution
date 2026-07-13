import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  entityType?: string;
  onCreate?: () => void;
}

export function EmptyState({ entityType, onCreate }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
      <Package className="text-muted-foreground mb-4 size-12" />
      <h3 className="text-foreground mb-1 text-lg font-medium">
        No {entityType?.toLowerCase() ?? "entities"} yet
      </h3>
      <p className="text-muted-foreground mb-6 text-sm">
        Create your first {entityType?.toLowerCase() ?? "engineering entity"} to get started
      </p>
      {onCreate && (
        <Button onClick={onCreate}>Create {entityType?.toLowerCase() ?? "entity"}</Button>
      )}
    </div>
  );
}
