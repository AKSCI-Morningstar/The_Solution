import { PagePlaceholder } from "../_components/page-placeholder";

export default function ReportsPage() {
  return (
    <PagePlaceholder
      meta={{
        title: "Reports",
        description: "Generate and view engineering reports with traceable evidence.",
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Reports" }],
      }}
    />
  );
}
