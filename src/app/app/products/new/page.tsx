// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { dataService } from "@/lib/data-service";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Variant {
 tempId: string;
 name: string;
 itemCode: string;
 purchasePrice: number;
 salePrice: number;
 quantity: number;
 minDiscount: number;
 maxDiscount: number;
}

export default function NewProductPage() {
 const router = useRouter();
 const [loading, setLoading] = useState(false);
 const [variants, setVariants] = useState<Variant[]>([]);
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

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
   ...prev,
   [name]: name.includes("Price") || name.includes("Discount") || name === "quantity" ? parseFloat(value) || 0 : value,
  }));
 };

 const addVariant = () => {
  setVariants([
   ...variants,
   {
    tempId: Date.now().toString(),
    name: "",
    itemCode: "",
    purchasePrice: 0,
    salePrice: 0,
    quantity: 0,
    minDiscount: 0,
    maxDiscount: 0,
   },
  ]);
 };

 const updateVariant = (tempId: string, field: string, value: any) => {
  setVariants(
   variants.map((v) =>
    v.tempId === tempId
     ? { ...v, [field]: typeof value === "string" ? value : value }
     : v
   )
  );
 };

 const removeVariant = (tempId: string) => {
  setVariants(variants.filter((v) => v.tempId !== tempId));
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
   if (!formData.name || !formData.itemCode) {
    alert("Product name and item code are required");
    setLoading(false);
    return;
   }

   // Create product via dataService
   const product = await dataService.createProduct({
     name: formData.name,
     description: formData.description,
     purchase_price: formData.purchasePrice,
     sale_price: formData.salePrice,
     unit: formData.unit,
     item_code: formData.itemCode,
     quantity: variants.length === 0 ? formData.quantity : 0,
     min_discount: formData.minDiscount,
     max_discount: formData.maxDiscount,
   });

   // Add variants if any
   if (variants.length > 0) {
    for (const v of variants) {
      await dataService.createVariant({
        product: product.id,
        variant_name: v.name,
        item_code: v.itemCode,
        purchase_price: v.purchasePrice,
        sale_price: v.salePrice,
        quantity: v.quantity,
        min_discount: v.minDiscount,
        max_discount: v.maxDiscount,
      });
    }
   }

   alert("Product created successfully!");
   router.push("/app/products");
  } catch (error) {
   console.error("Failed to create product:", error);
   alert(`Failed to create product: ${error instanceof Error ? error.message : "Unknown error"}`);
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="p-6 space-y-6">
   {/* Header */}
   <div className="flex items-center gap-4">
    <Link href="/app/products" className="p-2 hover:bg-gray-100 transition-colors">
     <ArrowLeft className="w-6 h-6 text-gray-600" />
    </Link>
    <div>
     <h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
     <p className="text-gray-600">Add a new product to your inventory</p>
    </div>
   </div>

   <form onSubmit={handleSubmit} className="space-y-6">
    {/* Basic Information */}
    <div className="bg-white shadow p-6 space-y-4">
     <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Product Name *
       </label>
       <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        placeholder="e.g., Apple"
        required
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       />
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Item Code *
       </label>
       <input
        type="text"
        name="itemCode"
        value={formData.itemCode}
        onChange={handleInputChange}
        placeholder="e.g., APP001"
        required
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
       placeholder="Product description..."
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
        placeholder="0"
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
        placeholder="0"
        step="0.01"
        required
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       />
      </div>
     </div>

     {variants.length === 0 && (
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Quantity
       </label>
       <input
        type="number"
        name="quantity"
        value={formData.quantity}
        onChange={handleInputChange}
        placeholder="0"
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       />
      </div>
     )}

     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Min Discount %
       </label>
       <input
        type="number"
        name="minDiscount"
        value={formData.minDiscount}
        onChange={handleInputChange}
        placeholder="0"
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
        placeholder="0"
        step="0.01"
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       />
      </div>
     </div>
    </div>

    {/* Variants Section */}
    <div className="bg-white shadow p-6 space-y-4">
     <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">Variants</h2>
      <button
       type="button"
       onClick={addVariant}
       className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
      >
       <Plus className="w-4 h-4" />
       Add Variant
      </button>
     </div>

     {variants.length > 0 && (
      <div className="space-y-4">
       {variants.map((variant) => (
        <div key={variant.tempId} className="border border-gray-200 p-4 space-y-4">
         <div className="flex justify-end">
          <button
           type="button"
           onClick={() => removeVariant(variant.tempId)}
           className="text-red-600 hover:text-red-700"
          >
           <Trash2 className="w-4 h-4" />
          </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
           <label className="block text-xs font-medium text-gray-700 mb-1">
            Variant Name
           </label>
           <input
            type="text"
            value={variant.name}
            onChange={(e) => updateVariant(variant.tempId, "name", e.target.value)}
            placeholder="e.g., Red"
            className="w-full px-3 py-2 border border-gray-300 text-sm"
           />
          </div>

          <div>
           <label className="block text-xs font-medium text-gray-700 mb-1">
            Item Code
           </label>
           <input
            type="text"
            value={variant.itemCode}
            onChange={(e) => updateVariant(variant.tempId, "itemCode", e.target.value)}
            placeholder="e.g., APP001-RED"
            className="w-full px-3 py-2 border border-gray-300 text-sm"
           />
          </div>

          <div>
           <label className="block text-xs font-medium text-gray-700 mb-1">
            Purchase Price
           </label>
           <input
            type="number"
            value={variant.purchasePrice}
            onChange={(e) => updateVariant(variant.tempId, "purchasePrice", parseFloat(e.target.value) || 0)}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 text-sm"
           />
          </div>

          <div>
           <label className="block text-xs font-medium text-gray-700 mb-1">
            Sale Price
           </label>
           <input
            type="number"
            value={variant.salePrice}
            onChange={(e) => updateVariant(variant.tempId, "salePrice", parseFloat(e.target.value) || 0)}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 text-sm"
           />
          </div>

          <div>
           <label className="block text-xs font-medium text-gray-700 mb-1">
            Quantity
           </label>
           <input
            type="number"
            value={variant.quantity}
            onChange={(e) => updateVariant(variant.tempId, "quantity", parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 text-sm"
           />
          </div>

          <div>
           <label className="block text-xs font-medium text-gray-700 mb-1">
            Max Discount %
           </label>
           <input
            type="number"
            value={variant.maxDiscount}
            onChange={(e) => updateVariant(variant.tempId, "maxDiscount", parseFloat(e.target.value) || 0)}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 text-sm"
           />
          </div>
         </div>
        </div>
       ))}
      </div>
     )}

     {variants.length === 0 && (
      <p className="text-sm text-gray-500 italic">
       No variants added. Click "Add Variant" to add product variants.
      </p>
     )}
    </div>

    {/* Submit Buttons */}
    <div className="flex gap-4">
     <Link
      href="/app/products"
      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-center"
     >
      Cancel
     </Link>
     <button
      type="submit"
      disabled={loading}
      className="flex-1 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
     >
      {loading ? "Creating..." : "Save Product"}
     </button>
    </div>
   </form>
  </div>
 );
}
