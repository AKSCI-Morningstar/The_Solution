import { PagePlaceholder } from "../_components/page-placeholder";

export default function SearchPage() {
  return (
    <PagePlaceholder
      meta={{
        title: "Search",
        description: "Search across all engineering data, documents, and evidence.",
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Search" }],
      }}
    />
  );
}
