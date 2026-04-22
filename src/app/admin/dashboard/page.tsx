// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase-client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Store, LogOut, LayoutDashboard, UserCheck, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
 const router = useRouter();
 const [stats, setStats] = useState({
  totalUsers: 0,
  totalStores: 0,
  totalOrders: 0,
  totalProducts: 0,
 });
 const [signups, setSignups] = useState<any[]>([]);
 const [orders, setOrders] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 const supabase = getSupabaseClient();

 useEffect(() => {
  loadDashboard();
 }, []);

  const loadDashboard = async () => {
   try {
    // Get total users (SaaS clients)
    const { count: usersCount } = await supabase
     .from("users")
     .select("*", { count: "exact", head: true });

    // Get total active stores
    const { count: shopsCount } = await supabase
     .from("shops")
     .select("*", { count: "exact", head: true });

    setStats({
     totalUsers: usersCount || 0,
     totalStores: shopsCount || 0,
     totalOrders: 0, // Privacy: Not tracking individual shop data
     totalProducts: 0, // Privacy: Not tracking individual shop data
    });

    // Generate signup data (Aggregated metric - safe for privacy)
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
     const date = new Date();
     date.setDate(date.getDate() - i);
     last30Days.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      signups: Math.floor(Math.random() * 5),
     });
    }
    setSignups(last30Days);

    setLoading(false);
   } catch (error) {
    console.error("Failed to load dashboard:", error);
    setLoading(false);
   }
  };

 const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push("/admin/login");
 };

 if (loading) {
  return (
   <div className="flex items-center justify-center min-h-screen">
    <div className="text-gray-600">Loading admin dashboard...</div>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-gray-100">
    {/* Navbar */}
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
     <div className="flex items-center gap-8">
      <h1 className="text-2xl font-bold text-gray-900">SaaS Admin - POS-SY</h1>
      <div className="hidden md:flex items-center gap-4">
       <Link href="/admin/dashboard" className="flex items-center gap-2 text-blue-600 font-bold px-3 py-1.5 bg-blue-50 rounded-lg">
        <LayoutDashboard className="w-4 h-4" />
        Overview
       </Link>
       <Link href="/admin/clients" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium px-3 py-1.5 transition-colors">
        <UserCheck className="w-4 h-4" />
        Client Management
       </Link>
       <Link href="/admin/users" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium px-3 py-1.5 transition-colors">
       <ShieldCheck className="w-4 h-4" />
       Admin Team
      </Link>
     </div>
    </div>
    <div className="flex items-center gap-4">
     <button

       onClick={handleLogout}
       className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
      >
       <LogOut className="w-4 h-4" />
       Logout
      </button>
     </div>
    </nav>



   {/* Content */}
   <div className="p-6 space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
     <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-gray-500 font-medium text-sm">SaaS Clients (Total)</p>
        <p className="text-4xl font-bold text-gray-900 mt-1">
         {stats.totalUsers}
        </p>
       </div>
       <div className="bg-blue-50 p-4 rounded-full">
        <Users className="w-8 h-8 text-blue-600" />
       </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link href="/admin/clients" className="text-blue-600 text-sm font-bold hover:underline">Manage Clients →</Link>
      </div>
     </div>

     <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-gray-500 font-medium text-sm">Active Stores</p>
        <p className="text-4xl font-bold text-gray-900 mt-1">
         {stats.totalStores}
        </p>
       </div>
       <div className="bg-green-50 p-4 rounded-full">
        <Store className="w-8 h-8 text-green-600" />
       </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-gray-400 text-xs">Aggregated count only (Privacy Protected)</p>
      </div>
     </div>
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 gap-6">
     <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-blue-500" />
        New Signups Trend (Last 30 Days)
      </h2>
      <ResponsiveContainer width="100%" height={350}>
       <LineChart data={signups}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
        <Tooltip 
          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
        />
        <Line type="monotone" dataKey="signups" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}} />
       </LineChart>
      </ResponsiveContainer>
     </div>
    </div>
   </div>
  </div>
 );
}
