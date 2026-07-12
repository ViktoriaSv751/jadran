"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/store";
import Logo from "@/components/layout/Logo";
import AuthForm from "./AuthForm";

/** Önálló belépés/regisztráció oldal (a /login és /register útvonalakhoz). */
export default function AuthPage({ initialMode }: { initialMode: "login" | "register" }) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Már bejelentkezve → főoldal.
  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, user, router]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-8">
      <Link href="/" className="mb-6 flex justify-center">
        <Logo size={40} />
      </Link>
      <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
        <AuthForm mode={mode} onModeChange={setMode} onSuccess={() => router.replace("/")} />
      </div>
    </div>
  );
}
