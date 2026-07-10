import RequireAuth from "@/components/auth/RequireAuth";
import ManageListings from "@/components/host/ManageListings";

export default function ListingsPage() {
  return (
    <RequireAuth>
      <ManageListings />
    </RequireAuth>
  );
}
