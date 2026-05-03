// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { dataService } from "@/lib/data-service";
import { Plus, Edit2, Search, Upload, RefreshCw, Download } from "lucide-react";

export default function ProductsPage() {
 const [products, setProducts] = useState<any[]>([]);
 const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState("");
 const [currentPage, setCurrentPage] = useState(1);
 const itemsPerPage = 10;

 useEffect(() => {
  loadProducts();
 }, []);

 useEffect(() => {
  filterProducts();
 }, [products, searchQuery]);

 const loadProducts = async (forceRefresh = false) => {
  try {
   setLoading(true);
   const data = await dataService.getProducts(forceRefresh);
   setProducts(data || []);
   setLoading(false);
  } catch (error) {
   console.error("Failed to load products:", error);
   setLoading(false);
  }
 };

 const filterProducts = () => {
  let filtered = products;

  if (searchQuery) {
   filtered = filtered.filter(
    (p) =>
     p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (p.item_code && p.item_code.toLowerCase().includes(searchQuery.toLowerCase()))
   );
  }

  setFilteredProducts(filtered);
  setCurrentPage(1);
 };

 const startIdx = (currentPage - 1) * itemsPerPage;
 const paginatedProducts = filteredProducts.slice(
  startIdx,
  startIdx + itemsPerPage
 );
 const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleExportCSV = () => {
   window.open("/api/export?type=products&format=csv", "_blank");
  };

  if (loading) {
  return (
   <div className="p-6 flex items-center justify-center min-h-screen">
    <div className="text-gray-600 font-aeonik">Loading products...</div>
   </div>
  );
 }

 return (
  <div className="p-6 space-y-6 font-aeonik">
   <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold text-gray-900">Products</h1>
     <div className="flex gap-2">
      <button
       onClick={handleExportCSV}
       className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
      >
       <Download className="w-4 h-4" />
       Export CSV
      </button>
      <button
       onClick={() => loadProducts(true)}
       title="Refresh data"
       className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
      >
       <RefreshCw className="w-4 h-4" />
       Refresh
      </button>
     <Link
      href="/app/products/import"
      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
     >
      <Upload className="w-4 h-4" />
      Import CSV
     </Link>
     <Link
      href="/app/products/new"
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-all hover:shadow-lg"
     >
      <Plus className="w-4 h-4" />
      Add Product
     </Link>
    </div>
   </div>

   {/* Search Bar */}
   <div className="bg-white shadow-sm border border-gray-100 p-4">
    <div className="relative">
     <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
     <input
      type="text"
      placeholder="Search by product name or item code..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
     />
    </div>
   </div>

   {/* Products Table */}
   <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
    <div className="overflow-x-auto">
     <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
       <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Item Code
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Price
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Quantity
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Unit
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Actions
        </th>
       </tr>
      </thead>
       <tbody className="divide-y divide-gray-200">
        {paginatedProducts.length === 0 ? (
         <tr>
          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
           No products found
          </td>
         </tr>
        ) : (
         paginatedProducts.map((product) => (
          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
           <td className="px-6 py-4 font-medium text-gray-900">
            {product.name}
           </td>
           <td className="px-6 py-4 text-gray-600">{product.item_code || "-"}</td>
           <td className="px-6 py-4 text-gray-900 font-medium">
            PKR {(product.sale_price || product.price || 0).toLocaleString()}
           </td>
           <td className={`px-6 py-4 font-medium ${(product.quantity || product.stock || 0) <= (product.min_stock || 5) ? 'text-red-600' : 'text-gray-600'}`}>
            {product.quantity || product.stock || 0}
           </td>
           <td className="px-6 py-4 text-gray-600 capitalize">
            {product.unit}
           </td>
           <td className="px-6 py-4">
            <Link
             href={`/app/products/${product.id}/edit`}
             className="text-blue-600 hover:text-blue-700 p-1"
            >
             <Edit2 className="w-4 h-4" />
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
      <div className="text-sm text-gray-500">
       Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, filteredProducts.length)} of{" "}
       {filteredProducts.length} products
      </div>
      <div className="flex gap-2">
       <button
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 border border-gray-300 hover:bg-gray-100 disabled:opacity-50 transition-colors"
       >
        Previous
       </button>
       <button
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border border-gray-300 hover:bg-gray-100 disabled:opacity-50 transition-colors"
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
