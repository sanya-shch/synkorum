import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Mail } from "lucide-react";

const { searchParams } = vi.hoisted(() => ({ searchParams: { current: new URLSearchParams() } }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => searchParams.current,
}));

import { AuthField, AuthMessage } from "@/components/auth/auth-form";
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";

// `children` is passed as the third argument (lint forbids the prop), which the type of the
// props object does not know about.
type MessageProps = React.ComponentProps<typeof AuthMessage>;

const render = (element: React.ReactElement) => renderToStaticMarkup(element);

beforeEach(() => {
  searchParams.current = new URLSearchParams();
});

describe("AuthField", () => {
  it("ties the label to its input so it can be found (and clicked) by its text", () => {
    const html = render(createElement(AuthField, { label: "Email address", icon: Mail }));

    const labelFor = html.match(/<label for="([^"]+)"/)?.[1];
    expect(labelFor).toBeTruthy();
    expect(html).toContain(`id="${labelFor}"`);
  });

  it("adds a show/hide toggle to password fields only", () => {
    const password = render(
      createElement(AuthField, { label: "Password", icon: Mail, type: "password" }),
    );
    const email = render(createElement(AuthField, { label: "Email", icon: Mail, type: "email" }));

    expect(password).toContain('aria-label="Show password"');
    expect(password).toContain('type="password"');
    expect(email).not.toContain("Show password");
  });

  it("announces a validation error and marks the input invalid, hiding the hint meanwhile", () => {
    const html = render(
      createElement(AuthField, {
        label: "Password",
        icon: Mail,
        error: "Minimum 8 characters",
        hint: "Use 8 or more characters",
      }),
    );

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Minimum 8 characters");
    expect(html).not.toContain("Use 8 or more characters");
  });
});

describe("AuthMessage", () => {
  it("is an alert for errors and a polite status for confirmations", () => {
    expect(render(createElement(AuthMessage, { type: "error" } as MessageProps, "x"))).toContain(
      'role="alert"',
    );
    expect(render(createElement(AuthMessage, { type: "success" } as MessageProps, "x"))).toContain(
      'role="status"',
    );
  });
});

describe("login page", () => {
  it("renders the sign-in screen", () => {
    const html = render(createElement(LoginPage));

    for (const text of [
      "Welcome back",
      "Sign in to your workspace",
      "Pick up where your team left off and keep ideas moving.",
      "A shared canvas for better thinking",
      "Secure access to your collaborative workspace",
      "Email address",
      "Forgot password?",
      "New to Synkorum?",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('placeholder="you@company.com"');
    expect(html).toContain('placeholder="Enter your password"');
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>[^<]*(<svg.*?<\/svg>)?Log in<\/button>/);
    expect(html).toMatch(/href="\/reset"[^>]*>Forgot password\?/);
    expect(html).toMatch(/href="\/register"[^>]*>Create an account/);
  });
});

describe("register page", () => {
  it("renders the sign-up screen with the password hint", () => {
    const html = render(createElement(RegisterPage));

    for (const text of [
      "Create your account",
      "Start creating together",
      "Set up your Synkorum account and make room for your next great idea.",
      "Bring ideas to life, together",
      "By continuing, you are joining a creative workspace built for teams.",
      "Full name",
      "Use 8 or more characters for a stronger password.",
      "Create account",
      "Already have an account?",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('placeholder="Alex Morgan"');
    expect(html).toContain('href="/login"');
  });

  it("switches to the invitation wording, locks the email field and keeps the way back to the invite", () => {
    searchParams.current = new URLSearchParams({ inviteToken: "tok123", email: "invited@a.com" });

    const html = render(createElement(RegisterPage));

    expect(html).toContain("Join the team");
    expect(html).not.toContain("Start creating together");
    // The value itself is filled in on the client by react-hook-form; here we can only see
    // that the field is locked.
    expect(html).toMatch(/<input[^>]*type="email"[^>]*disabled/);
    expect(html).toContain("callbackUrl=%2Finvite%2Ftok123");
  });
});
