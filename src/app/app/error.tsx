"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
 error,
 reset,
}: {
 error: Error & { digest?: string };
 reset: () => void;
}) {
 useEffect(() => {
  console.error("App error:", error);
 }, [error]);

 return (
  <div className="p-6 flex items-center justify-center min-h-screen">
   <div className="max-w-md w-full text-center space-y-6">
    {/* Icon */}
    <div className="flex justify-center">
     <div className="bg-red-100 p-4">
      <AlertTriangle className="w-8 h-8 text-red-600" />
     </div>
    </div>

    {/* Error Message */}
    <div>
     <h2 className="text-2xl font-bold text-gray-900 mb-2">
      Something went wrong
     </h2>
     <p className="text-gray-600">
      An unexpected error occurred. Please try again or contact support if the problem persists.
     </p>
    </div>

    {/* Error Details */}
    {error.message && (
     <div className="bg-red-50 border border-red-200 p-4 text-left">
      <p className="text-xs font-mono text-red-700 break-words">
       {error.message}
      </p>
     </div>
    )}

    {/* Actions */}
    <div className="flex gap-3">
     <button
      onClick={reset}
      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
     >
      <RefreshCw className="w-4 h-4" />
      Try Again
     </button>
     <Link
      href="/app/dashboard"
      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 hover:bg-gray-300 font-medium transition-colors"
     >
      <Home className="w-4 h-4" />
      Dashboard
     </Link>
    </div>
   </div>
  </div>
 );
}
