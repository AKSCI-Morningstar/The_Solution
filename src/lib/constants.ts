export const APP_NAME = "The Morningstar Solution" as const;
export const APP_DESCRIPTION =
  "Engineering Reality Platform — verifying engineering truth through deterministic, evidence-based reasoning" as const;

export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  api: {
    health: "/api/health",
    timestamps: "/api/timestamps",
  },
} as const;
