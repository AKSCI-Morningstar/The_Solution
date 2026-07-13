import { PagePlaceholder } from "../_components/page-placeholder";

export default function ContradictionsPage() {
  return (
    <PagePlaceholder
      meta={{
        title: "Contradictions",
        description: "Detect and resolve contradictions across engineering data.",
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Contradictions" }],
      }}
    />
  );
}
