"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/schemas";
import { getSafeCallbackUrl } from "@/lib/safe-redirect";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { ArrowRight, Lock, Mail } from "lucide-react";
import {
  AuthCard,
  AuthDivider,
  AuthShell,
  authSecondaryLinkClass,
} from "@/components/auth/auth-shell";
import { AuthField, AuthMessage, AuthSubmit } from "@/components/auth/auth-form";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"), DEFAULT_LOGIN_REDIRECT);

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (data.error) {
        setMessage({ type: "error", text: data.error });
        return;
      }
      if (!res.ok || data.success?.includes("not confirmed")) {
        setMessage({ type: "success", text: data.success });
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  };

  const { errors } = form.formState;

  return (
    <AuthShell
      tagline="A shared canvas for better thinking"
      footer="Secure access to your collaborative workspace"
    >
      <AuthCard
        icon={ArrowRight}
        eyebrow="Welcome back"
        title="Sign in to your workspace"
        description="Pick up where your team left off and keep ideas moving."
      >
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
          <AuthField
            label="Email address"
            icon={Mail}
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            disabled={isPending}
            error={errors.email?.message}
            {...form.register("email")}
          />

          <AuthField
            label="Password"
            icon={Lock}
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isPending}
            error={errors.password?.message}
            labelAction={
              <Link href="/reset" className="text-sm font-medium hover:underline">
                Forgot password?
              </Link>
            }
            {...form.register("password")}
          />

          {message && <AuthMessage type={message.type}>{message.text}</AuthMessage>}

          <AuthSubmit pending={isPending}>Log in</AuthSubmit>
        </form>

        <AuthDivider>New to Synkorum?</AuthDivider>

        <Link href="/register" className={authSecondaryLinkClass}>
          Create an account
        </Link>
      </AuthCard>
    </AuthShell>
  );
}
