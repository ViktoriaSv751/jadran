import RequireAuth from "@/components/auth/RequireAuth";
import ProfileClient from "@/components/profile/ProfileClient";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileClient />
    </RequireAuth>
  );
}
