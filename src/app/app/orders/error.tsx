"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OrdersError({
 error,
 reset,
}: {
 error: Error & { digest?: string };
 reset: () => void;
}) {
 useEffect(() => {
  console.error("Orders error:", error);
 }, [error]);

 return (
  <div className="p-6 flex items-center justify-center min-h-screen">
   <div className="max-w-md w-full text-center space-y-6">
    <div className="flex justify-center">
     <div className="bg-red-100 p-4">
      <AlertTriangle className="w-8 h-8 text-red-600" />
     </div>
    </div>

    <div>
     <h2 className="text-2xl font-bold text-gray-900 mb-2">
      Failed to load orders
     </h2>
     <p className="text-gray-600">
      We encountered an error while loading your orders. Please try again.
     </p>
    </div>

    <div className="flex gap-3">
     <button
      onClick={reset}
      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium"
     >
      <RefreshCw className="w-4 h-4" />
      Try Again
     </button>
     <Link
      href="/app/dashboard"
      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 hover:bg-gray-300 font-medium"
     >
      <ArrowLeft className="w-4 h-4" />
      Back
     </Link>
    </div>
   </div>
  </div>
 );
}
