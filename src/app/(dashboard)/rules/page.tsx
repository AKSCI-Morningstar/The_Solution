import { PagePlaceholder } from "../_components/page-placeholder";

export default function RulesPage() {
  return (
    <PagePlaceholder
      meta={{
        title: "Rules",
        description: "Define and manage engineering rules and constraints.",
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Rules" }],
      }}
    />
  );
}
