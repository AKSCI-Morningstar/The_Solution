"use client";

import { useState, useCallback, useEffect } from "react";
import { PageContainer, Stack, Breadcrumbs } from "@/components/layout";
import { SupplierList } from "@/features/suppliers";
import type { SupplierDTO } from "@/features/suppliers";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const fetchSuppliers = useCallback(async (search?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("pageSize", "50");
      const res = await fetch(`/api/suppliers?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setSuppliers(json.data ?? []);
        setTotalCount(json.meta?.total ?? json.data?.length ?? 0);
      }
    } catch {
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSearch = useCallback(() => {
    fetchSuppliers(searchQuery);
  }, [fetchSuppliers, searchQuery]);

  return (
    <PageContainer>
      <Stack gap={6}>
        <div className="flex flex-col gap-2">
          <Breadcrumbs
            items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Suppliers" }]}
          />
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground text-sm">
            Manage supplier information, certifications, capabilities, and relationships.
          </p>
        </div>

        <SupplierList
          suppliers={suppliers}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
          totalCount={totalCount}
        />
      </Stack>
    </PageContainer>
  );
}
