import RequireAuth from "@/components/auth/RequireAuth";
import SettingsClient from "@/components/profile/SettingsClient";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsClient />
    </RequireAuth>
  );
}
