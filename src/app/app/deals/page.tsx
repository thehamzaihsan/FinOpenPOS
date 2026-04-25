// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import pb from "@/lib/pb";
import { dataService } from "@/lib/data-service";
import { Plus, Edit2, Trash2, RefreshCw } from "lucide-react";

export default function DealsPage() {
 const [deals, setDeals] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  loadDeals();
 }, []);

 const loadDeals = async (forceRefresh = false) => {
  try {
   const data = await dataService.getDeals(forceRefresh);
   setDeals(data || []);
   setLoading(false);
  } catch (error) {
   console.error("Failed to load deals:", error);
   setLoading(false);
  }
 };

  const handleDelete = async (dealId: string) => {
   if (!confirm("Delete this deal?")) return;

   try {
    await pb.collection('deals').update(dealId, { is_active: false });

    dataService.invalidateDealsCache();
    loadDeals(true);
   } catch (error: any) {
    console.error("Failed to delete deal:", error);
    alert(`Failed to delete deal: ${error.message || "Unknown error"}`);
   }
  };

 if (loading) {
  return (
   <div className="p-6 flex items-center justify-center min-h-screen">
    <div className="text-gray-600">Loading deals...</div>
   </div>
  );
 }

 return (
  <div className="p-6 space-y-6">
   <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
    <div className="flex gap-2">
     <button
      onClick={() => loadDeals(true)}
      title="Refresh data"
      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
     >
      <RefreshCw className="w-4 h-4" />
      Refresh
     </button>
     <Link
      href="/app/deals/new"
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium"
     >
      <Plus className="w-4 h-4" />
      Create Deal
     </Link>
    </div>
   </div>

   <div className="bg-white shadow overflow-hidden">
    <div className="overflow-x-auto">
     <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
       <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Description
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Products
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Actions
        </th>
       </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
       {deals.length === 0 ? (
        <tr>
         <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
          No deals yet. Create one to get started!
         </td>
        </tr>
       ) : (
        deals.map((deal) => (
         <tr key={deal.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 font-medium text-gray-900">
           {deal.name}
          </td>
          <td className="px-6 py-4 text-gray-700">{deal.description}</td>
          <td className="px-6 py-4 text-gray-700">-</td>
          <td className="px-6 py-4">
           <div className="flex gap-2">
            <Link
             href={`/app/deals/${deal.id}/edit`}
             className="text-blue-600 hover:text-blue-700"
            >
             <Edit2 className="w-4 h-4" />
            </Link>
            <button
             onClick={() => handleDelete(deal.id)}
             className="text-red-600 hover:text-red-700"
            >
             <Trash2 className="w-4 h-4" />
            </button>
           </div>
          </td>
         </tr>
        ))
       )}
      </tbody>
     </table>
    </div>
   </div>
  </div>
 );
}
