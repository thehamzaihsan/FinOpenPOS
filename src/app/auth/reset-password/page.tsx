"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";

function ResetPasswordContent() {
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [success, setSuccess] = useState(false);
 const router = useRouter();
 const searchParams = useSearchParams();

 const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
 );

 const handleReset = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  if (password !== confirmPassword) {
   setError("Passwords do not match");
   return;
  }

  if (password.length < 6) {
   setError("Password must be at least 6 characters");
   return;
  }

  setLoading(true);

  try {
   const { error: resetError } = await supabase.auth.updateUser({
    password,
   });

   if (resetError) {
    setError(resetError.message);
   } else {
    setSuccess(true);
    setTimeout(() => {
     router.push("/auth/login");
    }, 2000);
   }
  } catch (err) {
   setError("An error occurred. Please try again.");
  } finally {
   setLoading(false);
  }
 };

 if (success) {
  return (
   <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
    <div className="bg-white shadow-lg p-8 w-full max-w-md text-center">
     <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
     <h2 className="text-xl font-semibold text-gray-900 mb-2">
      Password Updated
     </h2>
     <p className="text-gray-600 mb-6">
      Your password has been successfully reset. Redirecting to login...
     </p>
    </div>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
   <div className="bg-white shadow-lg p-8 w-full max-w-md">
    <div className="flex items-center justify-center mb-6">
     <Lock className="w-8 h-8 text-blue-600 mr-2" />
     <h1 className="text-2xl font-bold text-gray-900">POS-SY</h1>
    </div>

    <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
     Create New Password
    </h2>
    <p className="text-gray-600 text-center text-sm mb-6">
     Enter your new password below.
    </p>

    {error && (
     <div className="bg-red-50 border border-red-200 p-4 mb-6 flex gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-700">{error}</p>
     </div>
    )}

    <form onSubmit={handleReset} className="space-y-4">
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       New Password
      </label>
      <input
       type="password"
       value={password}
       onChange={(e) => setPassword(e.target.value)}
       placeholder="••••••••"
       required
       className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       Confirm Password
      </label>
      <input
       type="password"
       value={confirmPassword}
       onChange={(e) => setConfirmPassword(e.target.value)}
       placeholder="••••••••"
       required
       className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
     </div>

     <button
      type="submit"
      disabled={loading}
      className="w-full bg-blue-600 text-white py-2 hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
     >
      {loading ? "Updating..." : "Update Password"}
     </button>
    </form>

    <p className="text-center text-gray-600 text-sm mt-6">
     <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
      Back to Login
     </Link>
    </p>
   </div>
  </div>
 );
}

export default function ResetPasswordPage() {
 return (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
   <ResetPasswordContent />
  </Suspense>
 );
}
