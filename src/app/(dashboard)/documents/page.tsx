import { PagePlaceholder } from "../_components/page-placeholder";

export default function DocumentsPage() {
  return (
    <PagePlaceholder
      meta={{
        title: "Documents",
        description: "Manage and organize engineering documents with full traceability.",
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Documents" }],
      }}
    />
  );
}
