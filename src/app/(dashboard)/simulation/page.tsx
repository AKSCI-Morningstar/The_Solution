import { PagePlaceholder } from "../_components/page-placeholder";

export default function SimulationPage() {
  return (
    <PagePlaceholder
      meta={{
        title: "Simulation",
        description: "Run change impact simulations to predict engineering outcomes.",
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Simulation" }],
      }}
    />
  );
}
