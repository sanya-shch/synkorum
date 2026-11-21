"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

// A signed-in visitor can't open /register (the proxy bounces them to the dashboard), so
// ending the demo session comes first.
export const DemoSignUpButton = () => {
  const router = useRouter();

  const onClick = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/register");
    router.refresh();
  };

  return (
    <Button size="sm" onClick={onClick} className="cursor-pointer rounded-lg">
      Create free account
    </Button>
  );
};
