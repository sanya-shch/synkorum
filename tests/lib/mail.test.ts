import { describe, it, expect, vi } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

describe("sendOrgInviteEmail", () => {
  it("escapes the organization name so it cannot inject HTML into the email", async () => {
    // tests/setup.ts mocks @/lib/mail globally; load the real module here.
    const { sendOrgInviteEmail } = await vi.importActual<typeof import("@/lib/mail")>("@/lib/mail");
    sendMock.mockResolvedValue({ data: { id: "1" }, error: null });

    await sendOrgInviteEmail({
      email: "a@a.com",
      token: "tok",
      organizationName: '<a href="https://evil.example">Click</a>',
    });

    const { html } = sendMock.mock.calls[0][0];
    expect(html).not.toContain("<a href=\"https://evil.example\">");
    expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;");
    expect(html).toContain("/invite/tok");
  });
});
