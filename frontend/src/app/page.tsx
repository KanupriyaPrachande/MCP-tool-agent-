"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/workspace");
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-[#7A1F3D]/25 border-t-[#7A1F3D] rounded-full animate-spin" />
    </div>
  );
}
