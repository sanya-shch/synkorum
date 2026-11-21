import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(new Response('{"messageId":"1"}', { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  process.env.BREVO_API_KEY = "brevo-key";
  process.env.EMAIL_FROM = "Synkorum <noreply@example.com>";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.BREVO_API_KEY;
  delete process.env.EMAIL_FROM;
});

// tests/setup.ts mocks @/lib/mail globally; load the real module here.
const loadMail = () => vi.importActual<typeof import("@/lib/mail")>("@/lib/mail");

const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body);

describe("sendOrgInviteEmail", () => {
  it("escapes the organization name so it cannot inject HTML into the email", async () => {
    const { sendOrgInviteEmail } = await loadMail();

    await sendOrgInviteEmail({
      email: "a@a.com",
      token: "tok",
      organizationName: '<a href="https://evil.example">Click</a>',
    });

    const { htmlContent } = sentBody();
    expect(htmlContent).not.toContain('<a href="https://evil.example">');
    expect(htmlContent).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;");
    expect(htmlContent).toContain("/invite/tok");
  });
});

describe("Brevo transport", () => {
  it("posts to the transactional endpoint with the API key and a parsed sender", async () => {
    const { sendVerificationEmail } = await loadMail();

    await sendVerificationEmail("user@a.com", "tok");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(init.headers["api-key"]).toBe("brevo-key");
    expect(sentBody()).toMatchObject({
      sender: { name: "Synkorum", email: "noreply@example.com" },
      to: [{ email: "user@a.com" }],
      subject: "Confirm email",
    });
  });

  it("accepts a bare address as EMAIL_FROM", async () => {
    process.env.EMAIL_FROM = "noreply@example.com";
    const { sendPasswordResetEmail } = await loadMail();

    await sendPasswordResetEmail("user@a.com", "tok");

    expect(sentBody().sender).toEqual({ email: "noreply@example.com" });
  });

  it("throws (so callers can report it) when Brevo rejects the message", async () => {
    fetchMock.mockResolvedValue(new Response('{"message":"sender not valid"}', { status: 400 }));
    const { sendVerificationEmail } = await loadMail();

    await expect(sendVerificationEmail("user@a.com", "tok")).rejects.toThrow(/400/);
  });

  it("fails clearly when the API key or sender is not configured", async () => {
    const { sendVerificationEmail } = await loadMail();

    delete process.env.BREVO_API_KEY;
    await expect(sendVerificationEmail("user@a.com", "tok")).rejects.toThrow("BREVO_API_KEY");

    process.env.BREVO_API_KEY = "brevo-key";
    delete process.env.EMAIL_FROM;
    await expect(sendVerificationEmail("user@a.com", "tok")).rejects.toThrow("EMAIL_FROM");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never sends to a demo address", async () => {
    const { sendVerificationEmail } = await loadMail();

    await sendVerificationEmail("demo-1@demo.invalid", "tok");

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
