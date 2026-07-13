import { PagePlaceholder } from "../_components/page-placeholder";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      meta={{
        title: "Settings",
        description: "Configure platform settings and preferences.",
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }],
      }}
    />
  );
}
