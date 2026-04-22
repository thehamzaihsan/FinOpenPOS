"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, LogIn } from "lucide-react";

export default function LoginPage() {
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [mounted, setMounted] = useState(false);
 const router = useRouter();
 const supabase = useMemo(() => createClient(), []);

 useEffect(() => {
  setMounted(true);
 }, []);

 useEffect(() => {
  const checkSession = async () => {
   const {
    data: { session },
   } = await supabase.auth.getSession();

   if (!session) return;

   if (session.user?.email) {
    const isAdmin = await checkIfAdmin(session.user.email);
    router.replace(isAdmin ? "/admin/dashboard" : "/app/dashboard");
   }
  };

  checkSession();
 }, [router, supabase]);

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
    console.error('Login error:', authError);
    setError(authError.message);
    setLoading(false);
    return;
   }

   if (data.user?.email) {
    const isAdmin = await checkIfAdmin(data.user.email);
     if (isAdmin) {
      router.replace("/admin/dashboard");
     } else {
      router.replace("/app/dashboard");
     }
   }
  } catch (err) {
   console.error('Login exception:', err);
   setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
   setLoading(false);
  }
 };

 const checkIfAdmin = async (email: string) => {
  try {
   const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", email)
    .single();
   if (error) {
    console.log('Not admin (expected if user is not admin):', error.message);
   }
   return !!data;
  } catch (err) {
   console.error('Admin check error:', err);
   return false;
  }
 };

 return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
   {!mounted ? (
    <div className="text-center">Loading...</div>
   ) : (
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
   )}
  </div>
 );
}
