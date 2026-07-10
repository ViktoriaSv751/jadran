import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import MessagesClient from "@/components/messaging/MessagesClient";

export default function MessagesPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="p-10 text-center text-ink-400">…</div>}>
        <MessagesClient />
      </Suspense>
    </RequireAuth>
  );
}
