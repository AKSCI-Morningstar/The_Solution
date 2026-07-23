"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DemoLoginButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  className?: string;
  children?: React.ReactNode;
}

export function DemoLoginButton({
  variant = "primary",
  className,
  children,
}: DemoLoginButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleDemoLogin() {
    setIsPending(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Demo login failed:", err);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button variant={variant} disabled={isPending} onClick={handleDemoLogin} className={className}>
      {isPending ? "Entering Demo..." : children || "⚡ Guest Demo Mode"}
    </Button>
  );
}
