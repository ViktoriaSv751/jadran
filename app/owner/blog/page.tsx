import type { Metadata } from "next";
import BlogEditor from "@/components/owner/BlogEditor";

export const metadata: Metadata = {
  title: "Cikkek — Tulajdonosi konzol",
  robots: { index: false, follow: false }
};

export default function OwnerBlogPage() {
  return <BlogEditor />;
}
