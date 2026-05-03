// app/components/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("pb_admin_email");
      localStorage.removeItem("pb_admin_password");
      localStorage.removeItem("pb_auth");
    }
    const result = await logout();

    if (result?.error) {
      setError(result.error);
    }

    window.location.replace("/");

    setIsLoading(false);
  };

 return (
  <div className="w-full h-full">
   <Button
    onClick={handleLogout}
    variant="destructive"
    disabled={isLoading}
    className=" cursor-pointer p-0 m-0 w-full"
   >
    {isLoading ? (
     <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
    ) : null}
    Log out
   </Button>

   {/* {error && <p className="text-red-500 text-sm mt-2">{error}</p>} */}
  </div>
 );
}
