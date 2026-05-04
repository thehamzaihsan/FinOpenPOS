"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dataService } from "@/lib/data-service";
import { Plus, Edit2, Search, Trash2, Zap, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadFile } from "@/lib/utils";

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchParams] = useState("");

  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const data = await dataService.getDeals();
        setDeals(data || []);
      } catch (error) {
        console.error("Error fetching deals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  const filteredDeals = deals.filter((deal) =>
    deal.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 font-aeonik">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deals & Offers</h1>
          <p className="text-gray-600">Manage promotional bundles and discounts</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => downloadFile("/api/export?type=deals&format=csv")}
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Link href="/app/deals/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> New Deal
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search deals..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchParams(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-gray-600 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Deal Name</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Discount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Zap className="w-8 h-8 text-slate-300" />
                      <p>No promotional deals found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{deal.name}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{deal.description || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        {deal.type === 'percentage' ? `${deal.value}% OFF` : `PKR ${deal.value} OFF`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-bold ${deal.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${deal.is_active ? 'bg-green-600' : 'bg-gray-400'}`} />
                        {deal.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="text-blue-600">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
