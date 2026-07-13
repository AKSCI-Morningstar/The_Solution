import { add, multiply, clamp } from "@/lib/math";

describe("math utilities", () => {
  describe("add", () => {
    it("adds two positive numbers", () => {
      expect(add(2, 3)).toBe(5);
    });

    it("adds negative numbers", () => {
      expect(add(-1, -2)).toBe(-3);
    });

    it("adds zero", () => {
      expect(add(5, 0)).toBe(5);
    });
  });

  describe("multiply", () => {
    it("multiplies two numbers", () => {
      expect(multiply(3, 4)).toBe(12);
    });

    it("multiplies by zero", () => {
      expect(multiply(5, 0)).toBe(0);
    });

    it("multiplies negative numbers", () => {
      expect(multiply(-2, 3)).toBe(-6);
    });
  });

  describe("clamp", () => {
    it("returns value within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("clamps to minimum", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it("clamps to maximum", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });
});
