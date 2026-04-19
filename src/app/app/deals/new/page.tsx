// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase-client";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function NewDealPage() {
 const router = useRouter();
 const [products, setProducts] = useState<any[]>([]);
 const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
 const [loading, setLoading] = useState(false);
 const [formData, setFormData] = useState({
  name: "",
  description: "",
 });

 const supabase = getSupabaseClient();

 useEffect(() => {
  loadProducts();
 }, []);

 const loadProducts = async () => {
  try {
   const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true);

   setProducts(data || []);
  } catch (error) {
   console.error("Failed to load products:", error);
  }
 };

 const handleAddProduct = (productId: string) => {
  const product = products.find((p) => p.id === productId);
  if (product && !selectedProducts.find((p) => p.id === productId)) {
   setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
  }
 };

 const handleRemoveProduct = (productId: string) => {
  setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
   if (!formData.name) {
    alert("Deal name is required");
    setLoading(false);
    return;
   }

   const { data: deal, error: dealError } = await supabase
    .from("deals")
    .insert({
     name: formData.name,
     description: formData.description,
    })
    .select()
    .single();

   if (dealError) throw dealError;

   // Add deal items
   if (selectedProducts.length > 0) {
    const dealItems = selectedProducts.map((p) => ({
     deal_id: deal.id,
     product_id: p.id,
     quantity: p.quantity,
    }));

    await supabase.from("deal_items").insert(dealItems);
   }

   alert("Deal created successfully!");
   router.push("/app/deals");
  } catch (error) {
   console.error("Failed to create deal:", error);
   alert("Failed to create deal");
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="p-6 space-y-6">
   <div className="flex items-center gap-4">
    <Link href="/app/deals" className="p-2 hover:bg-gray-100 ">
     <ArrowLeft className="w-6 h-6 text-gray-600" />
    </Link>
    <div>
     <h1 className="text-3xl font-bold text-gray-900">Create Deal</h1>
     <p className="text-gray-600">Bundle products together for promotions</p>
    </div>
   </div>

   <form onSubmit={handleSubmit} className="space-y-6">
    <div className="bg-white shadow p-6 space-y-4">
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       Deal Name *
      </label>
      <input
       type="text"
       value={formData.name}
       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
       placeholder="e.g., Summer Special"
       required
       className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
      />
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       Description
      </label>
      <textarea
       value={formData.description}
       onChange={(e) => setFormData({ ...formData, description: e.target.value })}
       placeholder="Deal description..."
       rows={3}
       className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
      />
     </div>
    </div>

    <div className="bg-white shadow p-6 space-y-4">
     <h2 className="text-lg font-semibold text-gray-900">Products</h2>

     <div className="relative">
      <input
       type="text"
       placeholder="Search and add products..."
       list="products-list"
       className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       onChange={(e) => {
        if (e.currentTarget.value) {
         const product = products.find((p) =>
          p.name.toLowerCase().includes(e.currentTarget.value.toLowerCase())
         );
         if (product) {
          handleAddProduct(product.id);
          e.currentTarget.value = "";
         }
        }
       }}
      />
      <datalist id="products-list">
       {products.map((p) => (
        <option key={p.id} value={p.name} />
       ))}
      </datalist>
     </div>

     <div className="space-y-2">
      {selectedProducts.length === 0 ? (
       <p className="text-gray-500 italic">No products added yet</p>
      ) : (
       selectedProducts.map((product) => (
        <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 ">
         <div className="flex-1">
          <p className="font-medium text-gray-900">{product.name}</p>
          <p className="text-sm text-gray-500">PKR {product.sale_price}</p>
         </div>
         <button
          type="button"
          onClick={() => handleRemoveProduct(product.id)}
          className="text-red-600 hover:text-red-700"
         >
          <Trash2 className="w-4 h-4" />
         </button>
        </div>
       ))
      )}
     </div>
    </div>

    <div className="flex gap-4">
     <Link
      href="/app/deals"
      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-center"
     >
      Cancel
     </Link>
     <button
      type="submit"
      disabled={loading}
      className="flex-1 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 font-medium"
     >
      {loading ? "Creating..." : "Save Deal"}
     </button>
    </div>
   </form>
  </div>
 );
}
