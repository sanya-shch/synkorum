"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/schemas";
import { getSafeCallbackUrl } from "@/lib/safe-redirect";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

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

  return (
    <div className="mx-auto max-w-sm space-y-4 py-10">
      <h1 className="text-xl font-semibold">Вхід</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <input
          {...form.register("email")}
          placeholder="Email"
          type="email"
          disabled={isPending}
          className="w-full rounded border p-2"
        />
        <input
          {...form.register("password")}
          placeholder="Password"
          type="password"
          disabled={isPending}
          className="w-full rounded border p-2"
        />

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
          Log in
        </button>
      </form>

      <div className="space-y-2 text-sm text-center">
        <Link href="/reset" className="block text-muted-foreground hover:underline">
          Forgot your password?
        </Link>

        <p className="text-muted-foreground">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="font-medium text-black hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
