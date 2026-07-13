import { PagePlaceholder } from "../_components/page-placeholder";

export default function EntitiesPage() {
  return (
    <PagePlaceholder
      meta={{
        title: "Entities",
        description: "Resolve and manage engineering entities across the platform.",
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Entities" }],
      }}
    />
  );
}
