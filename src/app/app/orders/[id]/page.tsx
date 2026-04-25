// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
 const [returnedItems, setReturnedItems] = useState<Record<string, number>>({});

  useEffect(() => {
   loadOrderData();
  }, [orderId]);

  const loadOrderData = async () => {
   if (!orderId) return;
   try {
const response = await fetch(`/api/orders/${orderId}`, {
      headers: {
        "x-pb-email": localStorage.getItem("pb_admin_email") || "",
        "x-pb-password": localStorage.getItem("pb_admin_password") || "",
      }
     });
     
     if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to load order: ${response.status} ${errorText}`);
     }

     const json = await response.json();
     const order = json.data || json;
     setOrder(order);
     setItems(order.items || order.order_items || []);
     setLoading(false);
    } catch (error) {
     console.error("Failed to load order:", error);
     setLoading(false);
    }
   };

  const calculateRefundAmount = () => {
   return items.reduce((sum, item) => {
    const returnQty = returnedItems[item.id] || 0;
    const unitPriceAfterDiscount = item.line_total / item.quantity;
    return sum + (returnQty * unitPriceAfterDiscount);
   }, 0);
  };

  const handleRefund = async () => {
   if (!order) return;

   setRefunding(true);
   try {
    const refundAmountToProcess = calculateRefundAmount();
    const returnedItemsList = items
      .filter(item => (returnedItems[item.id] || 0) > 0)
      .map(item => ({
        order_item_id: item.id,
        product_id: item.product_id,
        return_quantity: returnedItems[item.id]
      }));

    if (returnedItemsList.length === 0) {
      throw new Error("Please select at least one item to return");
    }

    const response = await fetch(`/api/orders/${orderId}/refund`, {
     method: "POST",
     headers: { "Content-Type": "application/json",
        "x-pb-email": localStorage.getItem("pb_admin_email") || "",
        "x-pb-password": localStorage.getItem("pb_admin_password") || "",
     },
     body: JSON.stringify({
      refund_amount: refundAmountToProcess,
      returned_items: returnedItemsList,
      reason: "Product return",
     }),
    });

    if (!response.ok) {
     const error = await response.json();
     throw new Error(error.error || "Failed to process return");
    }

    setShowRefundModal(false);
    setReturnedItems({});
    loadOrderData();
    alert("Return processed successfully");
   } catch (error) {
    console.error("Failed to process return:", error);
    alert(`Failed to process return: ${error instanceof Error ? error.message : "Unknown error"}`);
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
              {item.product_name || `Product ${item.product_id?.slice(0, 8) || 'N/A'}`}
             </td>
             <td className="py-3 px-4 text-gray-700">{item.quantity}</td>
             <td className="py-3 px-4 text-gray-700">
              PKR {item.unit_price.toLocaleString()}
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
        Return Product
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

   {/* Return Modal */}
   {showRefundModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
     <div className="bg-white p-6 w-[500px] max-w-[90vw] space-y-4 max-h-[90vh] overflow-y-auto rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900">Return Product</h3>

      <div className="space-y-3">
       {items.map(item => (
        <div key={item.id} className="flex items-center justify-between gap-4 p-3 border border-gray-200 rounded">
<div>
            <p className="font-medium text-gray-900">{item.product_name || `Product ${item.product_id?.slice(0, 8) || 'N/A'}`}</p>
            <p className="text-sm text-gray-500">
             Price: PKR {(item.line_total / item.quantity).toLocaleString()} | In Order: {item.quantity}
            </p>
           </div>
         <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Return Qty:</label>
          <input
           type="number"
           min="0"
           max={item.quantity}
           value={returnedItems[item.id] || 0}
           onChange={(e) => {
            const val = parseInt(e.target.value) || 0;
            setReturnedItems(prev => ({
             ...prev,
             [item.id]: Math.min(Math.max(0, val), item.quantity)
            }));
           }}
           className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
         </div>
        </div>
       ))}
      </div>

      <div className="flex justify-between items-center py-2 border-t border-gray-200 mt-4">
       <span className="font-semibold text-gray-900">Total Refund:</span>
       <span className="font-bold text-red-600">PKR {calculateRefundAmount().toLocaleString()}</span>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
       <button
        onClick={() => {
         setShowRefundModal(false);
         setReturnedItems({});
        }}
        className="flex-1 border border-gray-300 py-2 hover:bg-gray-50 font-medium rounded"
       >
        Cancel
       </button>
       <button
        onClick={handleRefund}
        disabled={refunding || calculateRefundAmount() === 0}
        className="flex-1 bg-red-600 text-white py-2 hover:bg-red-700 disabled:bg-gray-400 font-medium rounded"
       >
        {refunding ? "Processing..." : "Process Return"}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}
