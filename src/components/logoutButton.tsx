// app/components/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { logout } from "@/app/auth/actions";
import pb from "@/lib/pb";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);

    pb.authStore.clear();
    if (typeof window !== "undefined") {
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
