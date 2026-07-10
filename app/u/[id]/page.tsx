"use client";

import { useParams } from "next/navigation";
import PublicProfile from "@/components/profile/PublicProfile";

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  return <PublicProfile id={params.id} />;
}
