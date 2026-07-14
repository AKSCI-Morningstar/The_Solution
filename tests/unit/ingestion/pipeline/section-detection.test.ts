import { describe, expect, it } from "vitest";
import { detectSections } from "@/server/ingestion/pipeline/stages/section-detection";

describe("detectSections", () => {
  it("detects numbered headings", () => {
    const text =
      "3.2 Interface Requirements\nSome body text.\n3.2.1 Electrical Interface\nMore text.";
    const sections = detectSections(text);

    expect(sections.map((s) => s.title)).toEqual([
      "Interface Requirements",
      "Electrical Interface",
    ]);
    expect(sections[1].level).toBe(3);
  });

  it("detects standalone ALL-CAPS headings", () => {
    const text = "GENERAL REQUIREMENTS\nBody text follows here.";
    const sections = detectSections(text);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("GENERAL REQUIREMENTS");
  });

  it("does not misdetect ordinary sentences as headings", () => {
    const text = "This is a normal sentence.\nAnother normal sentence follows.";
    expect(detectSections(text)).toEqual([]);
  });
});
