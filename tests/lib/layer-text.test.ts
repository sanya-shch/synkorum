import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  toEditableHtml,
  toPlainText,
  MAX_LAYER_TEXT_LENGTH,
} from "@/lib/layer-text";

describe("toEditableHtml", () => {
  it("escapes markup so a stored payload can never execute", () => {
    const html = toEditableHtml('<img src=x onerror="alert(1)">');
    expect(html).not.toContain("<img");
    expect(html).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("escapes script tags and quotes", () => {
    expect(toEditableHtml("<script>alert('x')</script>")).toBe(
      "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
    );
  });

  it("turns newlines into <br> as the only markup", () => {
    expect(toEditableHtml("a\nb")).toBe("a<br>b");
  });

  it("truncates oversized values", () => {
    expect(toEditableHtml("a".repeat(MAX_LAYER_TEXT_LENGTH + 500))).toHaveLength(
      MAX_LAYER_TEXT_LENGTH,
    );
  });
});

describe("toPlainText", () => {
  it("strips tags and keeps line breaks", () => {
    expect(toPlainText("one<br>two<div>three</div>")).toBe("one\ntwo\nthree");
  });

  it("handles the <div> structure browsers produce on Enter", () => {
    expect(toPlainText("one<div>two</div><div>three</div>")).toBe("one\ntwo\nthree");
    expect(toPlainText("one<div><br></div><div>two</div>")).toBe("one\n\ntwo");
    expect(toPlainText("<div>only</div>")).toBe("only");
  });

  it("decodes entities once", () => {
    expect(toPlainText("a &amp; b &lt;i&gt;")).toBe("a & b <i>");
    expect(toPlainText("&amp;lt;")).toBe("&lt;");
  });

  it("drops injected tags", () => {
    expect(toPlainText('hi<img src=x onerror="alert(1)">')).toBe("hi");
  });

  it("limits the length", () => {
    expect(toPlainText("a".repeat(MAX_LAYER_TEXT_LENGTH + 10))).toHaveLength(MAX_LAYER_TEXT_LENGTH);
  });

  it("round-trips through the editor representation", () => {
    const original = "x < y & \"quoted\"\nsecond line";
    expect(toPlainText(toEditableHtml(original))).toBe(original);
  });
});

describe("escapeHtml", () => {
  it("escapes the five significant characters", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });
});
