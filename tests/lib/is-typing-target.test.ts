import { describe, it, expect } from "vitest";
import { isTypingTarget } from "@/lib/canvas/input";

describe("isTypingTarget", () => {
  it("is true for an <input>", () => {
    expect(isTypingTarget({ tagName: "INPUT" })).toBe(true);
  });

  it("is true for a <textarea>", () => {
    expect(isTypingTarget({ tagName: "TEXTAREA" })).toBe(true);
  });

  it("is true for a contentEditable element (Text/Note layer editors)", () => {
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
  });

  it("is false for a plain element like the canvas <svg>", () => {
    expect(isTypingTarget({ tagName: "svg", isContentEditable: false })).toBe(false);
  });

  it("is false for null, undefined, or a non-object target", () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(undefined)).toBe(false);
    expect(isTypingTarget("not an element")).toBe(false);
  });
});
