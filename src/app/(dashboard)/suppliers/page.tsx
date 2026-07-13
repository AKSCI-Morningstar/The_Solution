import { PagePlaceholder } from "../_components/page-placeholder";

export default function SuppliersPage() {
  return (
    <PagePlaceholder
      meta={{
        title: "Suppliers",
        description: "Manage suppliers and their engineering data integrations.",
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Suppliers" }],
      }}
    />
  );
}
