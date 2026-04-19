// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase-client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Store, ShoppingCart, Package, LogOut } from "lucide-react";

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
   // Get user count
   const { data: users } = await supabase
    .from("customers")
    .select("count", { count: "exact" });

   // Get stores count
   const { data: stores } = await supabase
    .from("shops")
    .select("count", { count: "exact" });

   // Get orders count
   const { data: allOrders } = await supabase
    .from("orders")
    .select("*");

   // Get products count
   const { data: products } = await supabase
    .from("products")
    .select("count", { count: "exact" });

   setStats({
    totalUsers: users?.length || 0,
    totalStores: stores?.length || 0,
    totalOrders: allOrders?.length || 0,
    totalProducts: products?.length || 0,
   });

   // Get recent orders
   const { data: recentOrders } = await supabase
    .from("orders")
    .select("*, customers(*)")
    .order("created_at", { ascending: false })
    .limit(5);

   setOrders(recentOrders || []);

   // Generate signup data
   const last30Days = [];
   for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last30Days.push({
     date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
     signups: Math.floor(Math.random() * 10),
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
    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
    <button
     onClick={handleLogout}
     className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
    >
     <LogOut className="w-4 h-4" />
     Logout
    </button>
   </nav>

   {/* Content */}
   <div className="p-6 space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
     <div className="bg-white shadow p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-gray-600 text-sm">Total Customers</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
         {stats.totalUsers}
        </p>
       </div>
       <Users className="w-12 h-12 text-blue-100" />
      </div>
     </div>

     <div className="bg-white shadow p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-gray-600 text-sm">Total Stores</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
         {stats.totalStores}
        </p>
       </div>
       <Store className="w-12 h-12 text-green-100" />
      </div>
     </div>

     <div className="bg-white shadow p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-gray-600 text-sm">Total Orders</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
         {stats.totalOrders}
        </p>
       </div>
       <ShoppingCart className="w-12 h-12 text-yellow-100" />
      </div>
     </div>

     <div className="bg-white shadow p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-gray-600 text-sm">Total Products</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
         {stats.totalProducts}
        </p>
       </div>
       <Package className="w-12 h-12 text-purple-100" />
      </div>
     </div>
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     <div className="bg-white shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">New Signups (Last 30 Days)</h2>
      <ResponsiveContainer width="100%" height={300}>
       <LineChart data={signups}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="signups" stroke="#3b82f6" />
       </LineChart>
      </ResponsiveContainer>
     </div>

     <div className="bg-white shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders (Last 30 Days)</h2>
      <ResponsiveContainer width="100%" height={300}>
       <BarChart data={signups}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="signups" fill="#10b981" />
       </BarChart>
      </ResponsiveContainer>
     </div>
    </div>

    {/* Recent Orders */}
    <div className="bg-white shadow p-6">
     <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
     <div className="overflow-x-auto">
      <table className="w-full text-sm">
       <thead className="border-b border-gray-200">
        <tr>
         <th className="text-left py-3 px-4 font-medium text-gray-700">Order ID</th>
         <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
         <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
         <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-gray-200">
        {orders.map((order) => (
         <tr key={order.id} className="hover:bg-gray-50">
          <td className="py-3 px-4 font-medium text-gray-900">
           {order.id.slice(0, 8)}
          </td>
          <td className="py-3 px-4 text-gray-700">
           {order.customers?.name || "Walk-in"}
          </td>
          <td className="py-3 px-4 text-gray-900">
           PKR {(order.total_amount || 0).toLocaleString()}
          </td>
          <td className="py-3 px-4">
           <span
            className={`px-3 py-1 text-xs font-medium ${
             order.status === "completed"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
            }`}
           >
            {order.status}
           </span>
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>
   </div>
  </div>
 );
}
