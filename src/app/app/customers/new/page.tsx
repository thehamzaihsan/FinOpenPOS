// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import pb from "@/lib/pb";
import { ArrowLeft } from "lucide-react";

export default function NewCustomerPage() {
 const router = useRouter();
 const [loading, setLoading] = useState(false);
 const [formData, setFormData] = useState({
  name: "",
  phone: "",
  address: "",
 });

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
   ...prev,
   [name]: value,
  }));
 };

  const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   setLoading(true);

   try {
    if (!formData.name) {
     alert("Customer name is required");
     setLoading(false);
     return;
    }

    await pb.collection('customers').create({
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      customer_type: 'retail',
      is_active: true,
    });

    alert("Customer created successfully!");
    router.push("/app/customers");
   } catch (error: any) {
    console.error("Failed to create customer:", error);
    alert(`Failed to create customer: ${error.message || "Unknown error"}`);
   } finally {
    setLoading(false);
   }
  };

 return (
  <div className="p-6 space-y-6">
   <div className="flex items-center gap-4">
    <Link href="/app/customers" className="p-2 hover:bg-gray-100 ">
     <ArrowLeft className="w-6 h-6 text-gray-600" />
    </Link>
    <div>
     <h1 className="text-3xl font-bold text-gray-900">Add Customer</h1>
     <p className="text-gray-600">Create a new retail customer account</p>
    </div>
   </div>

   <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
    <div className="bg-white shadow p-6 space-y-4">
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       Full Name *
      </label>
      <input
       type="text"
       name="name"
       value={formData.name}
       onChange={handleInputChange}
       placeholder="e.g., Ali Ahmed"
       required
       className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
      />
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       Phone Number
      </label>
      <input
       type="tel"
       name="phone"
       value={formData.phone}
       onChange={handleInputChange}
       placeholder="e.g., 03001234567"
       className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
      />
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       Address
      </label>
      <textarea
       name="address"
       value={formData.address}
       onChange={handleInputChange}
       placeholder="Customer address..."
       rows={3}
       className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
      />
     </div>
    </div>

    <div className="flex gap-4">
     <Link
      href="/app/customers"
      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-center"
     >
      Cancel
     </Link>
     <button
      type="submit"
      disabled={loading}
      className="flex-1 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 font-medium"
     >
      {loading ? "Creating..." : "Add Customer"}
     </button>
    </div>
   </form>
  </div>
 );
}
