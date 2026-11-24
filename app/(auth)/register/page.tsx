"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as z from "zod";
import { RegisterSchema } from "@/schemas";
import { Lock, Mail, User, Zap } from "lucide-react";
import { AuthCard, AuthShell } from "@/components/auth/auth-shell";
import { AuthField, AuthMessage, AuthSubmit } from "@/components/auth/auth-form";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken") ?? undefined;
  const prefilledEmail = searchParams.get("email") ?? undefined;

  const loginHref = inviteToken
    ? `/login?callbackUrl=${encodeURIComponent(`/invite/${inviteToken}`)}`
    : "/login";

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: prefilledEmail ?? "", password: "", inviteToken },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (data.error) {
        setMessage({ type: "error", text: data.error });
        return;
      }
      setMessage({ type: "success", text: data.success });
    });
  };

  const { errors } = form.formState;

  return (
    <AuthShell
      tagline="Bring ideas to life, together"
      footer="By continuing, you are joining a creative workspace built for teams."
    >
      <AuthCard
        icon={Zap}
        eyebrow={inviteToken ? "You have been invited" : "Create your account"}
        title={inviteToken ? "Join the team" : "Start creating together"}
        description={
          inviteToken
            ? "Create your Synkorum account to join the team that invited you."
            : "Set up your Synkorum account and make room for your next great idea."
        }
      >
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
          <AuthField
            label="Full name"
            icon={User}
            placeholder="Alex Morgan"
            autoComplete="name"
            disabled={isPending}
            error={errors.name?.message}
            {...form.register("name")}
          />

          <AuthField
            label="Email address"
            icon={Mail}
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            disabled={isPending || !!prefilledEmail}
            error={errors.email?.message}
            {...form.register("email")}
          />

          <AuthField
            label="Password"
            icon={Lock}
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            disabled={isPending}
            error={errors.password?.message}
            hint="Use 8 or more characters for a stronger password."
            {...form.register("password")}
          />
          <input type="hidden" {...form.register("inviteToken")} value={inviteToken} />

          {message && <AuthMessage type={message.type}>{message.text}</AuthMessage>}

          <AuthSubmit pending={isPending}>
            {inviteToken ? "Join the team" : "Create account"}
          </AuthSubmit>
        </form>

        <p className="mt-6 text-center text-[15px] text-muted-foreground">
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-foreground hover:underline">
            Log in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
