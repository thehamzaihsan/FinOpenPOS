// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { dataService } from "@/lib/data-service";
import { Plus, Edit2, Search, Upload, RefreshCw } from "lucide-react";

export default function ProductsPage() {
 const [products, setProducts] = useState<any[]>([]);
 const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState("");
 const [currentPage, setCurrentPage] = useState(1);
 const [showFilters, setShowFilters] = useState(false);
 const [minPrice, setMinPrice] = useState<number>(0);
 const [maxPrice, setMaxPrice] = useState<number>(100000);
 const [inStockOnly, setInStockOnly] = useState(false);
 const [sortBy, setSortBy] = useState<"name" | "price" | "quantity" | "created">(
  "created"
 );
 const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
 
 const itemsPerPage = 10;

 useEffect(() => {
  loadProducts();
 }, []);

 useEffect(() => {
  filterProducts();
 }, [products, searchQuery, minPrice, maxPrice, inStockOnly, sortBy, sortOrder]);

 const loadProducts = async (forceRefresh = false) => {
  try {
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
     p.item_code.toLowerCase().includes(searchQuery.toLowerCase())
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

 if (loading) {
  return (
   <div className="p-6 flex items-center justify-center min-h-screen">
    <div className="text-gray-600">Loading products...</div>
   </div>
  );
 }

 return (
  <div className="p-6 space-y-6">
   <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold text-gray-900">Products</h1>
    <div className="flex gap-2">
     <button
      onClick={() => loadProducts(true)}
      title="Refresh data"
      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
     >
      <RefreshCw className="w-4 h-4" />
      Refresh
     </button>
     <Link
      href="/app/products/import"
      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
     >
      <Upload className="w-4 h-4" />
      Import CSV
     </Link>
     <Link
      href="/app/products/new"
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium"
     >
      <Plus className="w-4 h-4" />
      Add Product
     </Link>
    </div>
   </div>

   {/* Search Bar */}
   <div className="bg-white shadow p-4">
    <div className="relative">
     <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
     <input
      type="text"
      placeholder="Search by product name or item code..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
     />
    </div>
   </div>

   {/* Products Table */}
   <div className="bg-white shadow overflow-hidden">
    <div className="overflow-x-auto">
     <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
       <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Item Code
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Price
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Quantity
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Unit
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
         Actions
        </th>
       </tr>
      </thead>
       <tbody className="divide-y divide-gray-200">
        {paginatedProducts.length === 0 ? (
         <tr>
          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
           No products found
          </td>
         </tr>
        ) : (
         paginatedProducts.map((product) => (
          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
           <td className="px-6 py-4 font-medium text-gray-900">
            {product.name}
           </td>
           <td className="px-6 py-4 text-gray-700">{product.item_code}</td>
           <td className="px-6 py-4 text-gray-900">
            PKR {product.sale_price}
           </td>
           <td className="px-6 py-4 text-gray-700">{product.quantity}</td>
           <td className="px-6 py-4 text-gray-700 capitalize">
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
      <div className="text-sm text-gray-600">
       Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, filteredProducts.length)} of{" "}
       {filteredProducts.length} products
      </div>
      <div className="flex gap-2">
       <button
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
       >
        Previous
       </button>
       <button
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
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
