import { describe, it, expect } from "vitest";
import { validateLifecycleTransition } from "@/server/contradictions/validation";
import { LIFECYCLE_TRANSITIONS } from "@/server/contradictions/constants";

describe("contradiction lifecycle validation", () => {
  it("allows valid transitions from DETECTED", () => {
    expect(validateLifecycleTransition("DETECTED", "UNDER_REVIEW")).toBeNull();
    expect(validateLifecycleTransition("DETECTED", "ACCEPTED")).toBeNull();
    expect(validateLifecycleTransition("DETECTED", "REJECTED")).toBeNull();
    expect(validateLifecycleTransition("DETECTED", "ARCHIVED")).toBeNull();
  });

  it("allows valid transitions from UNDER_REVIEW", () => {
    expect(validateLifecycleTransition("UNDER_REVIEW", "ACCEPTED")).toBeNull();
    expect(validateLifecycleTransition("UNDER_REVIEW", "REJECTED")).toBeNull();
    expect(validateLifecycleTransition("UNDER_REVIEW", "DETECTED")).toBeNull();
  });

  it("allows valid transitions from ACCEPTED", () => {
    expect(validateLifecycleTransition("ACCEPTED", "RESOLVED")).toBeNull();
    expect(validateLifecycleTransition("ACCEPTED", "ARCHIVED")).toBeNull();
  });

  it("allows valid transitions from REJECTED", () => {
    expect(validateLifecycleTransition("REJECTED", "ARCHIVED")).toBeNull();
    expect(validateLifecycleTransition("REJECTED", "DETECTED")).toBeNull();
  });

  it("allows valid transitions from RESOLVED", () => {
    expect(validateLifecycleTransition("RESOLVED", "ARCHIVED")).toBeNull();
    expect(validateLifecycleTransition("RESOLVED", "DETECTED")).toBeNull();
  });

  it("allows reopening from ARCHIVED", () => {
    expect(validateLifecycleTransition("ARCHIVED", "DETECTED")).toBeNull();
  });

  it("rejects invalid transitions", () => {
    expect(validateLifecycleTransition("DETECTED", "RESOLVED")).not.toBeNull();
    expect(validateLifecycleTransition("UNDER_REVIEW", "RESOLVED")).not.toBeNull();
    expect(validateLifecycleTransition("ACCEPTED", "UNDER_REVIEW")).not.toBeNull();
    expect(validateLifecycleTransition("REJECTED", "ACCEPTED")).not.toBeNull();
  });

  it("rejects unknown status", () => {
    expect(validateLifecycleTransition("UNKNOWN", "DETECTED")).not.toBeNull();
  });

  it("LIFECYCLE_TRANSITIONS covers all statuses", () => {
    const statuses = ["DETECTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "RESOLVED", "ARCHIVED"];
    for (const status of statuses) {
      expect(LIFECYCLE_TRANSITIONS[status]).toBeDefined();
    }
  });
});
