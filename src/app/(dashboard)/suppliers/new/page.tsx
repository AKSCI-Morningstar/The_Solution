"use client";

import { PageContainer, Stack, Breadcrumbs } from "@/components/layout";
import { SupplierEditor } from "@/features/suppliers";

export default function NewSupplierPage() {
  return (
    <PageContainer>
      <Stack gap={6}>
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Suppliers", href: "/suppliers" },
            { label: "New" },
          ]}
        />

        <SupplierEditor />
      </Stack>
    </PageContainer>
  );
}
