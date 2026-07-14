import { describe, expect, it } from "vitest";
import { hasPermission } from "@/server/rbac/authorization-service";
import { ALL_PERMISSIONS, DEFAULT_ROLES, Permissions } from "@/server/rbac/permissions";

describe("hasPermission", () => {
  it("matches an exact permission string", async () => {
    expect(await hasPermission(["engineering:read"], "engineering:read")).toBe(true);
  });

  it("does not match an unrelated permission", async () => {
    expect(await hasPermission(["engineering:read"], "engineering:delete")).toBe(false);
  });

  it("does not implicitly grant read from a resource's manage permission", async () => {
    // permissionMatches only treats a granted permission as matching on an exact
    // string match or a literal "*" action - "rules:manage" does NOT imply "rules:read".
    expect(await hasPermission(["rules:manage"], "rules:read")).toBe(false);
  });

  it("matches a resource-scoped wildcard action", async () => {
    expect(await hasPermission(["rules:*"], "rules:execute")).toBe(true);
  });

  it("does not let a resource-scoped wildcard leak into a different resource", async () => {
    expect(await hasPermission(["rules:*"], "engineering:read")).toBe(false);
  });

  it("matches the global wildcard", async () => {
    expect(await hasPermission(["*:*"], "contradictions:manage")).toBe(true);
  });

  it("returns false for an empty permission set", async () => {
    expect(await hasPermission([], "organization:read")).toBe(false);
  });
});

describe("DEFAULT_ROLES data integrity", () => {
  it("every permission granted to a role exists in ALL_PERMISSIONS", () => {
    const allowed = new Set(ALL_PERMISSIONS);
    for (const role of DEFAULT_ROLES) {
      for (const permission of role.permissions) {
        expect(
          allowed.has(permission),
          `${role.slug} grants unknown permission ${permission}`,
        ).toBe(true);
      }
    }
  });

  it("Owner has every defined permission", () => {
    const owner = DEFAULT_ROLES.find((r) => r.slug === "owner");
    expect(owner?.permissions.sort()).toEqual([...ALL_PERMISSIONS].sort());
  });

  it("every role slug is unique", () => {
    const slugs = DEFAULT_ROLES.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("Viewer only holds read-level permissions", () => {
    const viewer = DEFAULT_ROLES.find((r) => r.slug === "viewer");
    for (const permission of viewer?.permissions ?? []) {
      expect(permission.endsWith(":read")).toBe(true);
    }
  });

  it("every resource defined on Permissions contributes at least one entry to ALL_PERMISSIONS", () => {
    const flattened = Object.values(Permissions).flatMap((actions) => Object.values(actions));
    expect(flattened.sort()).toEqual([...ALL_PERMISSIONS].sort());
  });
});
