import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import ListingWizard from "@/components/host/ListingWizard";

export default function NewListingPage() {
  return (
    <RequireAuth>
      <Suspense>
        <ListingWizard />
      </Suspense>
    </RequireAuth>
  );
}
