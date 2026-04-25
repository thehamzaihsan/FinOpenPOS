// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import pb from "@/lib/pb";
import { dataService } from "@/lib/data-service";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, Download, Printer } from "lucide-react";

export default function ReportsPage() {
 const [startDate, setStartDate] = useState(
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
 );
 const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
 const [profitData, setProfitData] = useState<any[]>([]);
 const [bestProducts, setBestProducts] = useState<any[]>([]);
 const [khataStats, setKhataStats] = useState<any[]>([]);
 const [loading, setLoading] = useState(false);

const loadReports = async () => {
   setLoading(true);
   try {
    const isAuthed = pb.authStore.isValid;
    if (!isAuthed) return;

    // Filter format for PocketBase
    const filter = `created >= "${startDate} 00:00:00" && created <= "${endDate} 23:59:59"`;

    // Profit data
    const orders = await pb.collection('orders').getFullList({
      filter,
      expand: 'order_items_via_order',
    });

    const profitByDay = new Map();
    (orders || []).forEach((order: any) => {
     const date = new Date(order.created).toLocaleDateString();
     const dayData = profitByDay.get(date) || { date, revenue: 0, cost: 0 };
     dayData.revenue += order.total_amount || 0;
     
     const items = order.expand?.order_items_via_order || [];
     items.forEach((item: any) => {
      dayData.cost += (item.unit_price || 0) * (item.quantity || 0) * 0.7; // Estimate cost
     });
     profitByDay.set(date, dayData);
    });

    setProfitData(Array.from(profitByDay.values()).slice(0, 30));

    // Best selling products
    const productMap = new Map();
    (orders || []).forEach((order: any) => {
     const items = order.expand?.order_items_via_order || [];
     items.forEach((item: any) => {
      const key = item.product_id;
      const current = productMap.get(key) || { name: item.product_name || "Unknown", units: 0, revenue: 0 };
      current.units += item.quantity || 0;
      current.revenue += (item.unit_price || 0) * (item.quantity || 0);
      productMap.set(key, current);
     });
    });

    const sorted = Array.from(productMap.values())
     .sort((a, b) => b.units - a.units)
     .slice(0, 10);

    setBestProducts(sorted);

    // Khata stats
    const khataAccounts = await pb.collection('khata_accounts').getFullList({
      filter: 'current_balance > 0',
      expand: 'customer_id',
    });

    setKhataStats(khataAccounts || []);
    setLoading(false);
   } catch (error) {
    console.error("Failed to load reports:", error);
    setLoading(false);
   }
  };

 useEffect(() => {
  loadReports();
 }, []);

 const totalRevenue = profitData.reduce((sum, d) => sum + d.revenue, 0);
 const totalCost = profitData.reduce((sum, d) => sum + d.cost, 0);
 const totalProfit = totalRevenue - totalCost;

 return (
  <div className="p-6 space-y-6">
   <h1 className="text-3xl font-bold text-gray-900">Reports</h1>

   {/* Date Range Selector */}
   <div className="bg-white shadow p-4 flex items-end gap-4">
    <div>
     <label className="block text-sm font-medium text-gray-700 mb-1">
      Start Date
     </label>
     <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className="px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
     />
    </div>

    <div>
     <label className="block text-sm font-medium text-gray-700 mb-1">
      End Date
     </label>
     <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      className="px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
     />
    </div>

    <button
     onClick={loadReports}
     className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium"
    >
     Load Reports
    </button>
   </div>

   {loading ? (
    <div className="text-center text-gray-600 py-12">Loading reports...</div>
   ) : (
    <div className="space-y-6">
     {/* Profit Summary */}
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white shadow p-6">
       <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
       <p className="text-3xl font-bold text-gray-900 mt-2">
        PKR {totalRevenue.toLocaleString()}
       </p>
      </div>
      <div className="bg-white shadow p-6">
       <p className="text-gray-600 text-sm font-medium">Total Cost</p>
       <p className="text-3xl font-bold text-gray-900 mt-2">
        PKR {totalCost.toLocaleString()}
       </p>
      </div>
      <div className="bg-white shadow p-6">
       <p className="text-gray-600 text-sm font-medium">Gross Profit</p>
       <p className="text-3xl font-bold text-green-600 mt-2">
        PKR {totalProfit.toLocaleString()}
       </p>
      </div>
     </div>

     {/* Profit Chart */}
     <div className="bg-white shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Profit Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
       <LineChart data={profitData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" />
        <Line type="monotone" dataKey="cost" stroke="#ef4444" name="Cost" />
       </LineChart>
      </ResponsiveContainer>
     </div>

     {/* Best Selling Products */}
     <div className="bg-white shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h2>
      <div className="overflow-x-auto">
       <table className="w-full text-sm">
        <thead className="border-b border-gray-200">
         <tr>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Units Sold</th>
          <th className="text-right py-3 px-4 font-medium text-gray-700">Revenue</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
         {bestProducts.map((product, idx) => (
          <tr key={idx} className="hover:bg-gray-50">
           <td className="py-3 px-4 text-gray-900 font-medium">{product.name}</td>
           <td className="py-3 px-4 text-gray-700">{product.units}</td>
           <td className="py-3 px-4 text-right text-gray-900">
            PKR {product.revenue.toLocaleString()}
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     </div>

     {/* Khata Stats */}
     <div className="bg-white shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Khata Statistics</h2>
      <div className="overflow-x-auto">
       <table className="w-full text-sm">
        <thead className="border-b border-gray-200">
         <tr>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
          <th className="text-right py-3 px-4 font-medium text-gray-700">Balance Due</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
         {khataStats.map((account) => (
          <tr key={account.id} className="hover:bg-gray-50">
           <td className="py-3 px-4 text-gray-900 font-medium">
            {account.customers?.name}
           </td>
           <td className="py-3 px-4 text-gray-700">
            {account.customers?.phone || "-"}
           </td>
           <td className="py-3 px-4 text-right text-red-600 font-medium">
            PKR {account.balance.toLocaleString()}
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}
