// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import pb from "@/lib/pb";
import { dataService } from "@/lib/data-service";
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

 useEffect(() => {
  loadProduct();
 }, [productId]);

 const loadProduct = async () => {
  try {
   const data = await dataService.getProduct(productId);

   if (!data) throw new Error("Product not found");

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

  const calculateMaxAllowedDiscount = (salePrice: number, purchasePrice: number): number => {
   if (salePrice <= 0 || salePrice < purchasePrice) return 0;
   return ((salePrice - purchasePrice) / salePrice) * 100;
  };

  const maxAllowedDiscount = calculateMaxAllowedDiscount(formData.salePrice, formData.purchasePrice);

  const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   setSaving(true);

   try {
    if (formData.salePrice < formData.purchasePrice) {
     alert("Sale price must be greater than or equal to purchase price");
     setSaving(false);
     return;
    }

    const maxAllowed = calculateMaxAllowedDiscount(formData.salePrice, formData.purchasePrice);
    if (formData.maxDiscount > maxAllowed) {
     alert(`Max discount cannot exceed ${maxAllowed.toFixed(2)}% without causing a loss`);
     setSaving(false);
     return;
    }

    await pb.collection('products').update(productId, {
      name: formData.name,
      description: formData.description,
      purchase_price: formData.purchasePrice,
      sale_price: formData.salePrice,
      unit: formData.unit,
      item_code: formData.itemCode,
      quantity: formData.quantity,
      min_discount: formData.minDiscount,
      max_discount: formData.maxDiscount,
     });

    alert("Product updated successfully!");
    dataService.invalidateProductsCache();
    router.push("/app/products");
   } catch (error: any) {
    console.error("Failed to update product:", error);
    alert(`Failed to update product: ${error.message || "Unknown error"}`);
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
         className={`w-full px-4 py-2 border focus:ring-2 focus:ring-blue-500 ${
          formData.salePrice < formData.purchasePrice
           ? 'border-red-500 bg-red-50'
           : 'border-gray-300'
         }`}
        />
        {formData.salePrice < formData.purchasePrice && (
         <p className="text-red-600 text-sm mt-1">
          Sale price cannot be less than purchase price
         </p>
        )}
        {formData.salePrice >= formData.purchasePrice && formData.purchasePrice > 0 && (
         <p className="text-green-600 text-sm mt-1">
          Profit margin: {(((formData.salePrice - formData.purchasePrice) / formData.purchasePrice) * 100).toFixed(1)}%
         </p>
        )}
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
         max={maxAllowedDiscount}
         className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
       </div>

       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
         Max Discount %
         <span className="text-gray-500 font-normal text-xs ml-2">
          (Max allowed: {maxAllowedDiscount.toFixed(2)}%)
         </span>
        </label>
        <input
         type="number"
         name="maxDiscount"
         value={formData.maxDiscount}
         onChange={handleInputChange}
         step="0.01"
         max={maxAllowedDiscount}
         className={`w-full px-4 py-2 border focus:ring-2 focus:ring-blue-500 ${
          formData.maxDiscount > maxAllowedDiscount
           ? 'border-red-500 bg-red-50'
           : 'border-gray-300'
         }`}
        />
        {formData.maxDiscount > maxAllowedDiscount && (
         <p className="text-red-600 text-sm mt-1">
          Max discount cannot exceed {maxAllowedDiscount.toFixed(2)}% or you'll be selling at a loss
         </p>
        )}
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
