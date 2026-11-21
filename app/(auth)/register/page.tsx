"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as z from "zod";
import { RegisterSchema } from "@/schemas";

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

  return (
    <div className="mx-auto max-w-sm space-y-4 py-10">
      <h1 className="text-xl font-semibold">{inviteToken ? "Join the team" : "Registration"}</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <input
          {...form.register("name")}
          placeholder="Name"
          disabled={isPending}
          className="w-full rounded border p-2"
        />
        <input
          {...form.register("email")}
          placeholder="Email"
          type="email"
          disabled={isPending || !!prefilledEmail}
          className="w-full rounded border p-2"
        />
        <input
          {...form.register("password")}
          placeholder="Password"
          type="password"
          disabled={isPending}
          className="w-full rounded border p-2"
        />
        <input type="hidden" {...form.register("inviteToken")} value={inviteToken} />

        {message && (
          <p className={message.type === "error" ? "text-red-600" : "text-green-600"}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded bg-black p-2 text-white cursor-pointer"
        >
          {inviteToken ? "Join" : "Register"}
        </button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-black hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
