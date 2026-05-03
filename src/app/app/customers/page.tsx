// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { dataService } from "@/lib/data-service";
import { Plus, Eye, Search, RefreshCw, Download } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
   loadCustomers();
  }, []);

  useEffect(() => {
   filterCustomers();
  }, [customers, searchQuery]);

  const loadCustomers = async (forceRefresh = false) => {
   try {
    setLoading(true);
    const customersData = await dataService.getCustomers(forceRefresh);
    setCustomers(customersData || []);
    setLoading(false);
   } catch (error) {
    console.error("Failed to load customers:", error);
    setLoading(false);
   }
  };

  const filterCustomers = () => {
   let filtered = customers;

   if (searchQuery) {
    filtered = filtered.filter(
     (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
    );
   }

   setFilteredCustomers(filtered);
  };

   const handleExportCSV = () => {
    window.open("/api/export?type=customers&format=csv", "_blank");
   };

   const handleExportKhata = () => {
    window.open("/api/export?type=khata&format=csv", "_blank");
   };

   if (loading) {
   return (
    <div className="p-6 flex items-center justify-center min-h-screen">
     <div className="text-gray-600 font-aeonik">Loading customers...</div>
    </div>
   );
  }

  return (
   <div className="p-6 space-y-6 font-aeonik">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
      <div className="flex gap-2">
       <button
        onClick={handleExportCSV}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
       >
        <Download className="w-4 h-4" />
        Export
       </button>
       <button
        onClick={handleExportKhata}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
       >
        <Download className="w-4 h-4" />
        Khata
       </button>
       <button
        onClick={() => loadCustomers(true)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
       >
        <RefreshCw className="w-4 h-4" />
        Refresh
       </button>
       <Link
        href="/app/customers/new"
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-all hover:shadow-lg"
       >
        <Plus className="w-4 h-4" />
        Add Customer
       </Link>
      </div>
    </div>

    {/* Search Bar */}
    <div className="bg-white shadow-sm border border-gray-100 p-4">
     <div className="relative">
      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
      <input
       type="text"
       placeholder="Search by name or phone..."
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
       className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
      />
     </div>
    </div>

    {/* Customers Table */}
    <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
     <div className="overflow-x-auto">
      <table className="w-full">
       <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Name
         </th>
         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Phone
         </th>
         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Address
         </th>
         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Khata Balance
         </th>
         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
         </th>
        </tr>
       </thead>
       <tbody className="divide-y divide-gray-200">
        {filteredCustomers.length === 0 ? (
         <tr>
          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
           No customers found
          </td>
         </tr>
        ) : (
         filteredCustomers.map((customer) => {
           const balance = customer.current_balance || 0;
           return (
             <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-medium text-gray-900">
               {customer.name}
              </td>
              <td className="px-6 py-4 text-gray-600">{customer.phone || "-"}</td>
              <td className="px-6 py-4 text-gray-600">{customer.address || "-"}</td>
              <td className="px-6 py-4">
               <span className={`font-semibold ${balance > 0 ? "text-red-600" : "text-gray-600"}`}>
                PKR {balance.toLocaleString()}
               </span>
              </td>
              <td className="px-6 py-4">
               <Link
                href={`/app/customers/${customer.id}`}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
               >
                <Eye className="w-4 h-4" />
                View
               </Link>
              </td>
             </tr>
           );
         })
        )}
       </tbody>
      </table>
     </div>
    </div>
   </div>
  );
}
