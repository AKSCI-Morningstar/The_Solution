import { PagePlaceholder } from "../_components/page-placeholder";

export default function KnowledgeGraphPage() {
  return (
    <PagePlaceholder
      meta={{
        title: "Knowledge Graph",
        description: "Explore and navigate the engineering knowledge graph.",
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Knowledge Graph" }],
      }}
    />
  );
}
