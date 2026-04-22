// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase-client";
import {
 DollarSign,
 ShoppingCart,
 AlertCircle,
 TrendingUp,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
 const [stats, setStats] = useState({
  todaysSales: 0,
  ordersToday: 0,
  outstandingKhata: 0,
  topProduct: null as any,
 });
 const [last7Days, setLast7Days] = useState<Array<{ date: string; sales: number }>>([]);
 const [lastOrders, setLastOrders] = useState<Array<any>>([]);
 const [topProducts, setTopProducts] = useState<Array<any>>([]);
 const [khataStats, setKhataStats] = useState({
  total: 0,
  customersWithKhata: 0,
 });
 const [loading, setLoading] = useState(true);

 const supabase = getSupabaseClient();

 useEffect(() => {
  loadDashboardData();
 }, []);

 const loadDashboardData = async () => {
  try {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) return;

   // Get today's stats
   const today = new Date().toISOString().split("T")[0];
   const { data: todayOrders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", today) as any;

   const todaysSalesTotal = (todayOrders || []).reduce(
    (sum: number, order: any) => sum + (order.total_amount || 0),
    0
   );

   // Get outstanding khata
   const { data: khataAccounts } = await supabase
    .from("khata_accounts")
    .select("*")
    .eq("user_id", user.id)
    .gt("current_balance", 0) as any;

   const outstandingTotal = (khataAccounts || []).reduce(
    (sum: number, acc: any) => sum + (acc.current_balance || 0),
    0
   );

   setStats({
    todaysSales: todaysSalesTotal,
    ordersToday: todayOrders?.length || 0,
    outstandingKhata: outstandingTotal,
    topProduct: null,
   });

   setKhataStats({
    total: outstandingTotal,
    customersWithKhata: khataAccounts?.length || 0,
   });

   // Get last 7 days chart data
   const chartData = [];
   for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const { data: dayOrders } = await supabase
     .from("orders")
     .select("*")
     .eq("user_id", user.id)
     .gte("created_at", dateStr)
     .lt("created_at", new Date(date.getTime() + 86400000).toISOString()) as any;

    const dayTotal = (dayOrders || []).reduce(
     (sum: number, order: any) => sum + (order.total_amount || 0),
     0
    );

    chartData.push({
     date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
     sales: dayTotal,
    });
   }
   setLast7Days(chartData);

   // Get last 5 orders
   const { data: orders } = await supabase
    .from("orders")
    .select("*, customers(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5) as any;

   setLastOrders(orders || []);

   // Get top 5 products
   const { data: monthOrders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) as any;


   const productMap = new Map();
   (monthOrders || []).forEach((order: any) => {
    (order.order_items || []).forEach((item: any) => {
     const key = item.product_id;
     if (!productMap.has(key)) {
      productMap.set(key, { id: key, qty: 0, name: item.product_name });
     }
     const current = productMap.get(key);
     current.qty += item.quantity;
     productMap.set(key, current);
    });
   });

   const sortedProducts = Array.from(productMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
   setTopProducts(sortedProducts);

   setLoading(false);
  } catch (error) {
   console.error("Failed to load dashboard data:", error);
   setLoading(false);
  }
 };

 if (loading) {
  return (
   <div className="p-6 flex items-center justify-center min-h-screen">
    <div className="text-gray-600">Loading dashboard...</div>
   </div>
  );
 }

 return (
  <div className="p-6 space-y-6">
   {/* Page Title */}
   <div>
    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
    <p className="text-gray-600">Overview of your business today</p>
   </div>

   {/* Stat Cards */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard
     label="Today's Sales"
     value={`PKR ${stats.todaysSales.toLocaleString()}`}
     icon={DollarSign}
     color="blue"
    />
    <StatCard
     label="Orders Today"
     value={stats.ordersToday.toString()}
     icon={ShoppingCart}
     color="green"
    />
    <StatCard
     label="Outstanding Khata"
     value={`PKR ${stats.outstandingKhata.toLocaleString()}`}
     icon={AlertCircle}
     color="red"
    />
    <StatCard
     label="Customers w/ Khata"
     value={khataStats.customersWithKhata.toString()}
     icon={TrendingUp}
     color="purple"
    />
   </div>

   {/* Charts */}
   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Sales Chart */}
    <div className="bg-white shadow p-6">
     <h2 className="text-lg font-semibold text-gray-900 mb-4">
      Last 7 Days Sales
     </h2>
     <ResponsiveContainer width="100%" height={300}>
      <LineChart data={last7Days}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="date" />
       <YAxis />
       <Tooltip />
       <Line
        type="monotone"
        dataKey="sales"
        stroke="#3b82f6"
        strokeWidth={2}
       />
      </LineChart>
     </ResponsiveContainer>
    </div>

    {/* Top Products Bar Chart */}
    <div className="bg-white shadow p-6">
     <h2 className="text-lg font-semibold text-gray-900 mb-4">
      Top Products This Month
     </h2>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={topProducts}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="name" />
       <YAxis />
       <Tooltip />
       <Bar dataKey="qty" fill="#10b981" />
      </BarChart>
     </ResponsiveContainer>
    </div>
   </div>

   {/* Tables */}
   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Last Orders */}
    <div className="bg-white shadow p-6">
     <h2 className="text-lg font-semibold text-gray-900 mb-4">
      Last 5 Orders
     </h2>
     <div className="overflow-x-auto">
      <table className="w-full text-sm">
       <thead className="border-b border-gray-200">
        <tr>
         <th className="text-left py-3 px-4 font-medium text-gray-700">
          Order ID
         </th>
         <th className="text-left py-3 px-4 font-medium text-gray-700">
          Customer
         </th>
         <th className="text-left py-3 px-4 font-medium text-gray-700">
          Total
         </th>
         <th className="text-left py-3 px-4 font-medium text-gray-700">
          Status
         </th>
        </tr>
       </thead>
       <tbody>
        {lastOrders.map((order) => (
         <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
          <td className="py-3 px-4 text-gray-900 font-medium">
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
              : order.status === "pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
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

    {/* Khata Summary */}
    <div className="bg-white shadow p-6">
     <h2 className="text-lg font-semibold text-gray-900 mb-4">
      Khata Summary
     </h2>
     <div className="space-y-4">
      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 ">
       <p className="text-sm text-red-700 font-medium">Total Outstanding</p>
       <p className="text-3xl font-bold text-red-900 mt-1">
        PKR {khataStats.total.toLocaleString()}
       </p>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 ">
       <p className="text-sm text-blue-700 font-medium">
        Customers with Open Khata
       </p>
       <p className="text-3xl font-bold text-blue-900 mt-1">
        {khataStats.customersWithKhata}
       </p>
      </div>
      <button className="w-full bg-blue-600 text-white py-2 hover:bg-blue-700 transition-colors font-medium">
       View All Khata Accounts
      </button>
     </div>
    </div>
   </div>
  </div>
 );
}

interface StatCardProps {
 label: string;
 value: string;
 icon: React.ComponentType<{ className?: string }>;
 color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
 const colorClasses = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  red: "bg-red-50 text-red-600",
  purple: "bg-purple-50 text-purple-600",
 };

 return (
  <div className="bg-white shadow p-6">
   <div className="flex items-center justify-between">
    <div>
     <p className="text-gray-600 text-sm font-medium">{label}</p>
     <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
    <div className={`p-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
     <Icon className="w-6 h-6" />
    </div>
   </div>
  </div>
 );
}
