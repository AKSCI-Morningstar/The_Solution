import { PagePlaceholder } from "../_components/page-placeholder";

export default function NotificationsPage() {
  return (
    <PagePlaceholder
      meta={{
        title: "Notifications",
        description: "View and manage platform notifications.",
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Notifications" }],
      }}
    />
  );
}
