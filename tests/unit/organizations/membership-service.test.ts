import { describe, expect, it } from "vitest";
import { INVITABLE_ROLE_SLUGS } from "@/server/organizations/membership-service";
import { DEFAULT_ROLES } from "@/server/rbac/permissions";

describe("INVITABLE_ROLE_SLUGS", () => {
  it("excludes the owner role - ownership is never granted via invite", () => {
    expect(INVITABLE_ROLE_SLUGS.has("owner")).toBe(false);
  });

  it("includes every non-owner default role", () => {
    const nonOwnerSlugs = DEFAULT_ROLES.filter((r) => r.slug !== "owner").map((r) => r.slug);
    for (const slug of nonOwnerSlugs) {
      expect(INVITABLE_ROLE_SLUGS.has(slug)).toBe(true);
    }
  });

  it("rejects an arbitrary, non-existent role slug", () => {
    expect(INVITABLE_ROLE_SLUGS.has("super-admin")).toBe(false);
  });
});
