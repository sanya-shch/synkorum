import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { getInitials, MemberAvatar } from "@/components/modals/modal-parts";

describe("getInitials", () => {
  it("uses the first letters of the first and last word, upper-cased", () => {
    expect(getInitials("Oleksandr Shchipkov")).toBe("OS");
    expect(getInitials("alex")).toBe("A");
    expect(getInitials("  Mary   Ann  Smith ")).toBe("MS");
  });

  it("falls back to a placeholder for an empty name", () => {
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
  });
});

describe("MemberAvatar", () => {
  it("shows the initials when there is no picture", () => {
    expect(renderToStaticMarkup(createElement(MemberAvatar, { name: "Alex Morgan" }))).toContain(
      "AM",
    );
  });
});
