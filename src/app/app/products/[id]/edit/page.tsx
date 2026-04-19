// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase-client";
import { ArrowLeft } from "lucide-react";

export default function EditProductPage() {
 const params = useParams();
 const router = useRouter();
 const productId = params.id as string;

 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [formData, setFormData] = useState({
  name: "",
  description: "",
  purchasePrice: 0,
  salePrice: 0,
  unit: "piece",
  itemCode: "",
  quantity: 0,
  minDiscount: 0,
  maxDiscount: 0,
 });

 const supabase = getSupabaseClient();

 useEffect(() => {
  loadProduct();
 }, [productId]);

 const loadProduct = async () => {
  try {
   const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

   if (error) throw error;

   setFormData({
    name: data.name,
    description: data.description || "",
    purchasePrice: data.purchase_price,
    salePrice: data.sale_price,
    unit: data.unit,
    itemCode: data.item_code,
    quantity: data.quantity,
    minDiscount: data.min_discount,
    maxDiscount: data.max_discount,
   });

   setLoading(false);
  } catch (error) {
   console.error("Failed to load product:", error);
   setLoading(false);
  }
 };

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
   ...prev,
   [name]: name.includes("Price") || name.includes("Discount") || name === "quantity" ? parseFloat(value) || 0 : value,
  }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);

  try {
   await supabase
    .from("products")
    .update({
     name: formData.name,
     description: formData.description,
     purchase_price: formData.purchasePrice,
     sale_price: formData.salePrice,
     unit: formData.unit,
     item_code: formData.itemCode,
     quantity: formData.quantity,
     min_discount: formData.minDiscount,
     max_discount: formData.maxDiscount,
    })
    .eq("id", productId);

   alert("Product updated successfully!");
   router.push("/app/products");
  } catch (error) {
   console.error("Failed to update product:", error);
   alert("Failed to update product");
  } finally {
   setSaving(false);
  }
 };

 if (loading) {
  return (
   <div className="p-6 flex items-center justify-center min-h-screen">
    <div className="text-gray-600">Loading product...</div>
   </div>
  );
 }

 return (
  <div className="p-6 space-y-6">
   <div className="flex items-center gap-4">
    <Link href="/app/products" className="p-2 hover:bg-gray-100 ">
     <ArrowLeft className="w-6 h-6 text-gray-600" />
    </Link>
    <div>
     <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
     <p className="text-gray-600">Update product information</p>
    </div>
   </div>

   <form onSubmit={handleSubmit} className="space-y-6">
    <div className="bg-white shadow p-6 space-y-4">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Product Name
       </label>
       <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       />
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Item Code
       </label>
       <input
        type="text"
        name="itemCode"
        value={formData.itemCode}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       />
      </div>
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       Description
      </label>
      <textarea
       name="description"
       value={formData.description}
       onChange={handleInputChange}
       rows={3}
       className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
      />
     </div>

     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Unit
       </label>
       <select
        name="unit"
        value={formData.unit}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       >
        <option value="piece">Piece</option>
        <option value="dozen">Dozen</option>
        <option value="kg">Kilogram</option>
        <option value="packet">Packet</option>
        <option value="litre">Litre</option>
        <option value="meter">Meter</option>
       </select>
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Purchase Price
       </label>
       <input
        type="number"
        name="purchasePrice"
        value={formData.purchasePrice}
        onChange={handleInputChange}
        step="0.01"
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       />
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Sale Price
       </label>
       <input
        type="number"
        name="salePrice"
        value={formData.salePrice}
        onChange={handleInputChange}
        step="0.01"
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       />
      </div>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Quantity
       </label>
       <input
        type="number"
        name="quantity"
        value={formData.quantity}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       />
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Min Discount %
       </label>
       <input
        type="number"
        name="minDiscount"
        value={formData.minDiscount}
        onChange={handleInputChange}
        step="0.01"
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       />
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Max Discount %
       </label>
       <input
        type="number"
        name="maxDiscount"
        value={formData.maxDiscount}
        onChange={handleInputChange}
        step="0.01"
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       />
      </div>
     </div>
    </div>

    <div className="flex gap-4">
     <Link
      href="/app/products"
      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-center"
     >
      Cancel
     </Link>
     <button
      type="submit"
      disabled={saving}
      className="flex-1 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 font-medium"
     >
      {saving ? "Saving..." : "Save Changes"}
     </button>
    </div>
   </form>
  </div>
 );
}
