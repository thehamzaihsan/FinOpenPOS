"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { AlertCircle, LogIn } from "lucide-react";

export default function LoginPage() {
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const router = useRouter();

 const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
 );

 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
   const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
   });

   if (authError) {
    setError(authError.message);
    setLoading(false);
    return;
   }

   if (data.user?.email) {
    const isAdmin = await checkIfAdmin(data.user.email);
    if (isAdmin) {
     router.push("/admin/dashboard");
    } else {
     router.push("/app/dashboard");
    }
   }
  } catch (err) {
   setError("An error occurred. Please try again.");
   setLoading(false);
  }
 };

 const checkIfAdmin = async (email: string) => {
  const { data } = await supabase
   .from("admin_users")
   .select("id")
   .eq("email", email)
   .single();
  return !!data;
 };

 return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
   <div className="bg-white shadow-lg p-8 w-full max-w-md">
    <div className="flex items-center justify-center mb-6">
     <LogIn className="w-8 h-8 text-blue-600 mr-2" />
     <h1 className="text-2xl font-bold text-gray-900">POS-SY</h1>
    </div>

    <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
     Welcome Back
    </h2>

    {error && (
     <div className="bg-red-50 border border-red-200 p-4 mb-6 flex gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-700">{error}</p>
     </div>
    )}

    <form onSubmit={handleLogin} className="space-y-4">
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       Email
      </label>
      <input
       type="email"
       value={email}
       onChange={(e) => setEmail(e.target.value)}
       placeholder="you@example.com"
       required
       className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       Password
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

     <div className="text-right">
      <Link
       href="/auth/forgot-password"
       className="text-sm text-blue-600 hover:text-blue-700"
      >
       Forgot password?
      </Link>
     </div>

     <button
      type="submit"
      disabled={loading}
      className="w-full bg-blue-600 text-white py-2 hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
     >
      {loading ? "Logging in..." : "Login"}
     </button>
    </form>

    <p className="text-center text-gray-600 text-sm mt-6">
     Don't have an account?{" "}
     <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
      Contact support
     </Link>
    </p>
   </div>
  </div>
 );
}
