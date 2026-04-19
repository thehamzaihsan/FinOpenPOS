// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase-client";
import { ArrowLeft, Printer, Download, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Order {
 id: string;
 customer_id?: string;
 created_at: string;
 total_amount: number;
 amount_paid: number;
 balance_due: number;
 status: string;
 payment_method: string;
 is_khata: boolean;
 customers?: {
  id: string;
  name: string;
  phone?: string;
 };
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  discount_amount: number;
  line_total: number;
}

export default function OrderDetailPage() {
 const params = useParams();
 const router = useRouter();
 const orderId = params.id as string;

 const [order, setOrder] = useState<Order | null>(null);
 const [items, setItems] = useState<OrderItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [refunding, setRefunding] = useState(false);
 const [showRefundModal, setShowRefundModal] = useState(false);
 const [refundType, setRefundType] = useState<"full" | "partial">("full");
 const [refundAmount, setRefundAmount] = useState(0);

 const supabase = getSupabaseClient();

 useEffect(() => {
  loadOrderData();
 }, [orderId]);

 const loadOrderData = async () => {
  try {
   const [orderRes, itemsRes] = await Promise.all([
    supabase
     .from("orders")
     .select("*, customers(*)")
     .eq("id", orderId)
     .single(),
    supabase.from("order_items").select("*").eq("order_id", orderId),
   ]);

   if (orderRes.error) throw orderRes.error;
   setOrder(orderRes.data);
   setItems(itemsRes.data || []);
   setLoading(false);
  } catch (error) {
   console.error("Failed to load order:", error);
   setLoading(false);
  }
 };

 const handleRefund = async () => {
  if (!order) return;

  setRefunding(true);
  try {
   const refundAmountToProcess = refundType === "full" ? order.amount_paid : refundAmount;

   // @ts-ignore - Supabase type issue
   const { error } = await supabase
    .from("orders")
    .update({
     status: refundType === "full" ? "refunded" : "partial_refund",
     amount_paid: order.amount_paid - refundAmountToProcess,
     balance_due: order.balance_due + refundAmountToProcess,
    })
    .eq("id", orderId);

   if (error) throw error;

   setShowRefundModal(false);
   loadOrderData();
   alert("Refund processed successfully");
  } catch (error) {
   console.error("Failed to process refund:", error);
   alert("Failed to process refund");
  } finally {
   setRefunding(false);
  }
 };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const totalDiscount = items.reduce(
   (sum, item) => sum + item.discount_amount,
   0
  );

 if (loading) {
  return (
   <div className="p-6 flex items-center justify-center min-h-screen">
    <div className="text-gray-600">Loading order...</div>
   </div>
  );
 }

 if (!order) {
  return (
   <div className="p-6">
    <div className="text-center text-gray-600">Order not found</div>
   </div>
  );
 }

 return (
  <div className="p-6 space-y-6">
   {/* Header */}
   <div className="flex items-center gap-4">
    <button
     onClick={() => router.back()}
     className="p-2 hover:bg-gray-100 transition-colors"
    >
     <ArrowLeft className="w-6 h-6 text-gray-600" />
    </button>
    <div>
     <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
     <p className="text-gray-600">Order ID: {order.id}</p>
    </div>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Main Content */}
    <div className="lg:col-span-2 space-y-6">
     {/* Order Header */}
     <div className="bg-white shadow p-6 space-y-4">
      <div className="flex items-start justify-between">
       <div>
        <h2 className="text-lg font-semibold text-gray-900">
         {order.customers?.name || "Walk-in Customer"}
        </h2>
        {order.customers?.phone && (
         <p className="text-gray-600 text-sm">{order.customers.phone}</p>
        )}
        <p className="text-gray-500 text-sm">
         {new Date(order.created_at).toLocaleString()}
        </p>
       </div>
       <span
        className={`px-4 py-2 font-medium text-sm ${
         order.status === "completed"
          ? "bg-green-100 text-green-700"
          : order.status === "pending"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-red-100 text-red-700"
        }`}
       >
        {order.status}
       </span>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
       <div>
        <p className="text-gray-600 text-sm">Payment Method</p>
        <p className="font-medium text-gray-900 capitalize">
         {order.payment_method}
        </p>
       </div>
       {order.is_khata && (
        <div>
         <p className="text-gray-600 text-sm">Khata Account</p>
         <p className="font-medium text-blue-600">Yes</p>
        </div>
       )}
      </div>
     </div>

     {/* Order Items */}
     <div className="bg-white shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
       Items
      </h3>
      <div className="overflow-x-auto">
       <table className="w-full text-sm">
        <thead className="border-b border-gray-200">
         <tr>
          <th className="text-left py-3 px-4 font-medium text-gray-700">
           Product
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">
           Qty
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">
           Unit Price
          </th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">
           Discount
          </th>
          <th className="text-right py-3 px-4 font-medium text-gray-700">
           Total
          </th>
         </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item) => (
           <tr key={item.id}>
            <td className="py-3 px-4 text-gray-900 font-medium">
             Product {item.product_id.slice(0, 8)}
            </td>
            <td className="py-3 px-4 text-gray-700">{item.quantity}</td>
            <td className="py-3 px-4 text-gray-700">
             PKR {item.unit_price}
            </td>
            <td className="py-3 px-4 text-gray-700">
             {item.discount_pct > 0 ? `${item.discount_pct}%` : '-'}
            </td>
            <td className="py-3 px-4 text-right text-gray-900 font-medium">
             PKR {item.line_total.toLocaleString()}
            </td>
           </tr>
          ))}
        </tbody>
       </table>
      </div>
     </div>
    </div>

    {/* Sidebar - Summary & Actions */}
    <div className="space-y-6">
     {/* Summary */}
     <div className="bg-white shadow p-6 space-y-3">
      <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

      <div className="space-y-2 pb-3 border-b border-gray-200">
       <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal:</span>
        <span className="font-medium">PKR {subtotal.toLocaleString()}</span>
       </div>
       <div className="flex justify-between text-sm">
        <span className="text-gray-600">Discount:</span>
        <span className="font-medium">
         -PKR {totalDiscount.toLocaleString()}
        </span>
       </div>
      </div>

      <div className="space-y-2 pb-3 border-b border-gray-200">
       <div className="flex justify-between text-base font-bold">
        <span>Total Amount:</span>
        <span>PKR {order.total_amount.toLocaleString()}</span>
       </div>
       <div className="flex justify-between text-base font-bold">
        <span>Amount Paid:</span>
        <span className="text-green-600">
         PKR {order.amount_paid.toLocaleString()}
        </span>
       </div>
      </div>

      <div className="flex justify-between text-lg font-bold">
       <span>Balance Due:</span>
       <span
        className={
         order.balance_due > 0 ? "text-red-600" : "text-green-600"
        }
       >
        PKR {order.balance_due.toLocaleString()}
       </span>
      </div>
     </div>

     {/* Actions */}
     <div className="bg-white shadow p-6 space-y-3">
      <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>

      {order.status !== "refunded" && (
       <button
        onClick={() => setShowRefundModal(true)}
        className="w-full border-2 border-red-600 text-red-600 py-2 hover:bg-red-50 transition-colors font-medium"
       >
        Refund Order
       </button>
      )}

      <button className="w-full border-2 border-blue-600 text-blue-600 py-2 hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-2">
       <Printer className="w-4 h-4" />
       Print Thermal
      </button>

      {order.customers && (
       <button className="w-full border-2 border-green-600 text-green-600 py-2 hover:bg-green-50 transition-colors font-medium flex items-center justify-center gap-2">
        <Download className="w-4 h-4" />
        Full Invoice
       </button>
      )}
     </div>

     {order.is_khata && (
      <div className="bg-blue-50 border border-blue-200 p-4">
       <p className="text-sm text-blue-900">
        <span className="font-semibold">Balance on Khata:</span> This order has an outstanding balance that will be added to the customer's khata account.
       </p>
      </div>
     )}
    </div>
   </div>

   {/* Refund Modal */}
   {showRefundModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
     <div className="bg-white p-6 w-96 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Process Refund</h3>

      <div className="space-y-3">
       <label className="flex items-center gap-3">
        <input
         type="radio"
         value="full"
         checked={refundType === "full"}
         onChange={(e) => setRefundType(e.target.value as "full" | "partial")}
         className="w-4 h-4"
        />
        <span className="text-gray-900">
         Full Refund (PKR {order.amount_paid.toLocaleString()})
        </span>
       </label>

       <label className="flex items-center gap-3">
        <input
         type="radio"
         value="partial"
         checked={refundType === "partial"}
         onChange={(e) => setRefundType(e.target.value as "full" | "partial")}
         className="w-4 h-4"
        />
        <span className="text-gray-900">Partial Refund</span>
       </label>
      </div>

      {refundType === "partial" && (
       <input
        type="number"
        placeholder="Enter refund amount"
        value={refundAmount}
        onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
        max={order.amount_paid}
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500"
       />
      )}

      <div className="flex gap-3 pt-4 border-t border-gray-200">
       <button
        onClick={() => setShowRefundModal(false)}
        className="flex-1 border border-gray-300 py-2 hover:bg-gray-50 font-medium"
       >
        Cancel
       </button>
       <button
        onClick={handleRefund}
        disabled={refunding}
        className="flex-1 bg-red-600 text-white py-2 hover:bg-red-700 disabled:bg-gray-400 font-medium"
       >
        {refunding ? "Processing..." : "Process Refund"}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}
