"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { PageContainer, Stack, Breadcrumbs } from "@/components/layout";
import { SupplierProfile } from "@/features/suppliers";
import type { SupplierDTO } from "@/features/suppliers";
import Link from "next/link";

export default function SupplierDetailPage() {
  const params = useParams();
  const [supplier, setSupplier] = useState<SupplierDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSupplier = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/suppliers/${params.id}`);
      if (res.ok) {
        const json = await res.json();
        setSupplier(json.data ?? null);
      } else {
        const err = await res.json();
        setError(err.error ?? "Supplier not found");
      }
    } catch {
      setError("Failed to load supplier");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSupplier();
  }, [fetchSupplier]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (error || !supplier) {
    return (
      <PageContainer>
        <Stack gap={4}>
          <Link
            href="/suppliers"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Suppliers
          </Link>
          <div className="border-destructive/50 bg-destructive/5 flex flex-col items-center gap-2 rounded-lg border p-8 text-center">
            <p className="text-destructive text-lg font-medium">Supplier Not Found</p>
            <p className="text-muted-foreground text-sm">
              {error || "The requested supplier does not exist."}
            </p>
          </div>
        </Stack>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Stack gap={6}>
        <div className="flex items-center gap-4">
          <Link
            href="/suppliers"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Suppliers", href: "/suppliers" },
              { label: supplier.name },
            ]}
          />
        </div>

        <SupplierProfile supplier={supplier} />
      </Stack>
    </PageContainer>
  );
}
