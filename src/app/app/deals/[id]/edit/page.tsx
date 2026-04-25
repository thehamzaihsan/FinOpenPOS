// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditDealPage() {
 const params = useParams();
 const router = useRouter();
 const dealId = params.id as string;

 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [formData, setFormData] = useState({
  name: "",
  description: "",
 });

 useEffect(() => {
  loadDeal();
 }, [dealId]);

 const loadDeal = async () => {
  try {
   const response = await fetch(`/api/deals/${dealId}`, {
    headers: {
      "x-pb-email": localStorage.getItem("pb_admin_email") || "",
      "x-pb-password": localStorage.getItem("pb_admin_password") || "",
    }
   });

   if (!response.ok) {
    throw new Error("Failed to load deal");
   }

   const { data } = await response.json();

   setFormData({
    name: data.name,
    description: data.description || "",
   });

   setLoading(false);
  } catch (error) {
   console.error("Failed to load deal:", error);
   setLoading(false);
  }
 };

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
   ...prev,
   [name]: value,
  }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);

  try {
   const response = await fetch(`/api/deals/${dealId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json",
      "x-pb-email": localStorage.getItem("pb_admin_email") || "",
      "x-pb-password": localStorage.getItem("pb_admin_password") || "",
    },
    body: JSON.stringify({
     name: formData.name,
     description: formData.description,
    }),
   });

   if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update deal");
   }

   alert("Deal updated successfully!");
   router.push("/app/deals");
  } catch (error) {
   console.error("Failed to update deal:", error);
   alert(`Failed to update deal: ${error instanceof Error ? error.message : "Unknown error"}`);
  } finally {
   setSaving(false);
  }
 };

 if (loading) {
  return (
   <div className="p-6 flex items-center justify-center min-h-screen">
    <div className="text-gray-600">Loading deal...</div>
   </div>
  );
 }

 return (
  <div className="p-6 space-y-6">
   <div className="flex items-center gap-4">
    <Link href="/app/deals" className="p-2 hover:bg-gray-100 ">
     <ArrowLeft className="w-6 h-6 text-gray-600" />
    </Link>
    <div>
     <h1 className="text-3xl font-bold text-gray-900">Edit Deal</h1>
     <p className="text-gray-600">Update deal information</p>
    </div>
   </div>

   <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
    <div className="bg-white shadow p-6 space-y-4">
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       Deal Name
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
