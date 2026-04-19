// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase-client";
import { dataService } from "@/lib/data-service";
import Link from "next/link";
import { Eye, Search, RefreshCw } from "lucide-react";

interface Order {
 id: string;
 customer_id?: string;
 created_at: string;
 total_amount: number;
 amount_paid: number;
 balance_due: number;
 status: string;
 customers?: {
  name: string;
 };
}

export default function OrdersPage() {
 const [orders, setOrders] = useState<Order[]>([]);
 const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
 const [loading, setLoading] = useState(true);
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState("");
 const [currentPage, setCurrentPage] = useState(1);
 const itemsPerPage = 10;

 const supabase = getSupabaseClient();

 useEffect(() => {
  loadOrders();
 }, []);

 useEffect(() => {
  filterOrders();
 }, [orders, statusFilter, searchQuery]);

 const loadOrders = async (forceRefresh = false) => {
  try {
   // For complex queries with relations, we bypass cache for accuracy
   const { data, error } = await supabase
    .from("orders")
    .select("*, customers(*)")
    .order("created_at", { ascending: false });

   if (error) throw error;
   setOrders(data || []);
   setLoading(false);
  } catch (error) {
   console.error("Failed to load orders:", error);
   setLoading(false);
  }
 };

 const filterOrders = () => {
  let filtered = orders;

  if (statusFilter !== "all") {
   filtered = filtered.filter((o) => o.status === statusFilter);
  }

  if (searchQuery) {
   filtered = filtered.filter(
    (o) =>
     o.id.includes(searchQuery) ||
     o.customers?.name.toLowerCase().includes(searchQuery.toLowerCase())
   );
  }

  setFilteredOrders(filtered);
  setCurrentPage(1);
 };

 const startIdx = (currentPage - 1) * itemsPerPage;
 const paginatedOrders = filteredOrders.slice(
  startIdx,
  startIdx + itemsPerPage
 );
 const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

 const getStatusBadgeClass = (status: string) => {
  switch (status) {
   case "paid":
   case "completed":
    return "bg-green-100 text-green-700";
   case "partial":
    return "bg-blue-100 text-blue-700";
   case "pending":
    return "bg-yellow-100 text-yellow-700";
   case "returned":
   case "refunded":
    return "bg-red-100 text-red-700";
   default:
    return "bg-gray-100 text-gray-700";
  }
 };

 if (loading) {
  return (
   <div className="p-6 flex items-center justify-center min-h-screen">
    <div className="text-gray-600">Loading orders...</div>
   </div>
  );
 }

 return (
  <div className="p-6 space-y-6">
   <h1 className="text-3xl font-bold text-gray-900">Orders</h1>

   {/* Filters */}
   <div className="bg-white shadow p-4 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-end">
    <div className="flex-1">
     <label className="block text-sm font-medium text-gray-700 mb-1">
      Search
     </label>
     <div className="relative">
      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
      <input
       type="text"
       placeholder="Search by order ID or customer..."
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
       className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
      />
     </div>
    </div>

    <div>
     <label className="block text-sm font-medium text-gray-700 mb-1">
      Status
     </label>
     <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
     >
      <option value="all">All Status</option>
      <option value="paid">Paid</option>
      <option value="partial">Partial</option>
      <option value="pending">Pending</option>
      <option value="refunded">Returned</option>
     </select>
    </div>
   </div>

   {/* Orders Table */}
   <div className="bg-white shadow overflow-hidden">
    <div className="overflow-x-auto">
     <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
       <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Order ID
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Customer
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Date & Time
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Total
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Paid
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Balance
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Status
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Actions
        </th>
       </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
       {paginatedOrders.length === 0 ? (
        <tr>
         <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
          No orders found
         </td>
        </tr>
       ) : (
        paginatedOrders.map((order) => (
         <tr key={order.id} className="hover:bg-gray-50 transition-colors">
          <td className="px-6 py-4 font-medium text-gray-900">
           {order.id.slice(0, 8)}
          </td>
          <td className="px-6 py-4 text-gray-700">
           {order.customers?.name || "Walk-in"}
          </td>
          <td className="px-6 py-4 text-gray-700">
           {new Date(order.created_at).toLocaleString()}
          </td>
          <td className="px-6 py-4 text-gray-900 font-medium">
           PKR {order.total_amount.toLocaleString()}
          </td>
          <td className="px-6 py-4 text-gray-700">
           PKR {order.amount_paid.toLocaleString()}
          </td>
          <td
           className={`px-6 py-4 font-medium ${
            order.balance_due > 0
             ? "text-red-600"
             : "text-green-600"
           }`}
          >
           PKR {order.balance_due.toLocaleString()}
          </td>
          <td className="px-6 py-4">
           <span
            className={`px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
             order.status
            )}`}
           >
            {order.status}
           </span>
          </td>
          <td className="px-6 py-4">
           <Link
            href={`/app/orders/${order.id}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
           >
            <Eye className="w-4 h-4" />
            View
           </Link>
          </td>
         </tr>
        ))
       )}
      </tbody>
     </table>
    </div>

    {/* Pagination */}
    {totalPages > 1 && (
     <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
      <div className="text-sm text-gray-600">
       Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, filteredOrders.length)} of{" "}
       {filteredOrders.length} orders
      </div>
      <div className="flex gap-2">
       <button
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
       >
        Previous
       </button>
       {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
         key={page}
         onClick={() => setCurrentPage(page)}
         className={`px-3 py-2 font-medium transition-colors ${
          currentPage === page
           ? "bg-blue-600 text-white"
           : "border border-gray-300 hover:bg-gray-100"
         }`}
        >
         {page}
        </button>
       ))}
       <button
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
       >
        Next
       </button>
      </div>
     </div>
    )}
   </div>
  </div>
 );
}
