"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveProfile } from "@/lib/profile-client";
import { dataService } from "@/lib/data-service";
import {
 DollarSign,
 ShoppingCart,
 AlertCircle,
 TrendingUp,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
 const router = useRouter();
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

 useEffect(() => {
    const checkAuth = async () => {
      const session = localStorage.getItem("pos_session");
      if (!session) {
        router.replace("/auth/login");
        return;
      }

      try {
        const active = await getActiveProfile();
        if (!active) { 
          router.replace("/auth/login"); 
          return; 
        }
        await loadDashboardData();
      } catch {
        router.replace("/auth/login");
      }
    };
  
  checkAuth();
 }, []);

  const loadDashboardData = async () => {
   try {
    const dashboardStats = await dataService.getDashboardStats();
    const orders = await dataService.getOrders();
    const products = await dataService.getProducts();

    const salesRes = await fetch("/api/reports/sales?from=" + new Date(new Date().getTime() - 29 * 86400000).toISOString() + "&to=" + new Date().toISOString());
    const salesJson = await salesRes.json();
    const topProductsData = salesJson.success ? (salesJson.data.topProducts || []) : [];

    if (dashboardStats) {
      setStats({
       todaysSales: dashboardStats.todaysSales,
       ordersToday: dashboardStats.ordersToday,
       outstandingKhata: dashboardStats.outstandingKhata,
       topProduct: topProductsData[0] || null,
      });

      setKhataStats({
       total: dashboardStats.outstandingKhata,
       customersWithKhata: dashboardStats.customersWithKhata,
      });

      setLast7Days(dashboardStats.last7Days);
    }

    setLastOrders(orders.slice(0, 5) || []);
    
    setTopProducts(topProductsData.slice(0, 5).map(p => ({
      name: p.name,
      qty: p.qty_sold,
      revenue: p.revenue || 0,
    })));

    setLoading(false);
   } catch (error) {
    console.error("Failed to load dashboard data:", error);
    setLoading(false);
   }
  };

 if (loading) {
  return (
   <div className="p-6 flex items-center justify-center min-h-screen">
    <div className="text-gray-600 font-aeonik">Loading dashboard...</div>
   </div>
  );
 }

 return (
  <div className="p-6 space-y-6 font-aeonik">
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
       Top Products (Last 30 Days)
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
           {order.expand?.customer?.name || "Walk-in"}
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
