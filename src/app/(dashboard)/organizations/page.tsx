import { PagePlaceholder } from "../_components/page-placeholder";

export default function OrganizationsPage() {
  return (
    <PagePlaceholder
      meta={{
        title: "Organizations",
        description: "Manage organizations, teams, and access control.",
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Organizations" }],
      }}
    />
  );
}
