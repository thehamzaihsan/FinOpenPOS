"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { dataService } from "@/lib/data-service";
import { ArrowLeft, Loader2, Download, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomerDetailPage() {
 const params = useParams();
 const router = useRouter();
 const customerId = params.id as string;

 const [customer, setCustomer] = useState<any>(null);
 const [orders, setOrders] = useState<any[]>([]);
 const [khata, setKhata] = useState<any>(null);
 const [khataTransactions, setKhataTransactions] = useState<any[]>([]);
 const [activeTab, setActiveTab] = useState<"overview" | "orders" | "khata">("overview");
 const [loading, setLoading] = useState(true);

 // Payment Modal State
 const [showPaymentModal, setShowPaymentModal] = useState(false);
 const [paymentAmount, setPaymentAmount] = useState("");
 const [paymentNotes, setPaymentNotes] = useState("");
 const [submittingPayment, setSubmittingPayment] = useState(false);

 useEffect(() => {
  loadCustomerData();
 }, [customerId]);

 const loadCustomerData = async (forceRefresh = false) => {
  try {
   const [customerData, ordersData, khataData] = await Promise.all([
    dataService.getCustomer(customerId, forceRefresh),
    dataService.getOrdersByCustomer(customerId),
    dataService.getKhataAccount(customerId, forceRefresh),
   ]);

   setCustomer(customerData);
   setOrders(ordersData || []);
   const kData = khataData || null;
   setKhata(kData);

    // Load khata transactions
    if (kData) {
     const txRes = await fetch(`/api/khata-accounts/${kData.id}/transactions?refresh=${forceRefresh ? Date.now() : ''}`);
     const txJson = await txRes.json();
     if (txJson.success) {
      setKhataTransactions(txJson.data || []);
     }
    }

    setLoading(false);
   } catch (error) {
    console.error("Failed to load customer data:", error);
    setLoading(false);
   }
  };

  const handleRecordPayment = async () => {
    if (!khata) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setSubmittingPayment(true);
    try {
      await dataService.payKhata(khata.id, amount, paymentNotes);
      setPaymentAmount("");
      setPaymentNotes("");
      setShowPaymentModal(false);
      await loadCustomerData(true);
    } catch (error: any) {
      alert(error.message || "Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

 if (loading) {
  return (
   <div className="p-6 flex items-center justify-center min-h-screen">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
   </div>
  );
 }

 if (!customer) {
  return (
   <div className="p-6">
    <div className="text-center text-gray-600">Customer not found</div>
   </div>
  );
 }

  const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;

  const handleExportPDF = () => {
   window.open(`/api/customers/${customerId}/export`, "_blank");
  };

 return (
  <div className="p-8 space-y-8 font-aeonik">
   {/* Header */}
   <div className="flex items-center gap-4">
    <Button
     variant="ghost"
     size="icon"
     onClick={() => router.back()}
    >
     <ArrowLeft className="w-6 h-6" />
    </Button>
    <div>
     <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
     <p className="text-gray-600">{customer.phone || "No phone contact"}</p>
    </div>
    <button
     onClick={handleExportPDF}
     className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors ml-auto"
    >
     <Download className="w-4 h-4" />
     Export PDF
    </button>
   </div>

   {/* Tabs */}
   <div className="border-b border-gray-200 flex gap-8">
    {["overview", "orders", "khata"].map((tab) => (
     <button
      key={tab}
      onClick={() => setActiveTab(tab as any)}
      className={`py-3 px-1 font-bold capitalize transition-colors ${
       activeTab === tab
        ? "border-b-2 border-blue-600 text-blue-600"
        : "text-gray-500 hover:text-gray-900"
      }`}
     >
      {tab}
     </button>
    ))}
   </div>

   {/* Overview Tab */}
   {activeTab === "overview" && (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
     <div className="bg-white border p-6 rounded-xl shadow-sm">
      <p className="text-gray-500 text-sm font-medium">Total Orders</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</p>
     </div>
     <div className="bg-white border p-6 rounded-xl shadow-sm">
      <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
      <p className="text-3xl font-bold text-blue-600 mt-2">
       PKR {totalSpent.toLocaleString()}
      </p>
     </div>
     <div className="bg-white border p-6 rounded-xl shadow-sm">
      <p className="text-gray-500 text-sm font-medium">Avg Order Value</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">
       PKR {Math.round(avgOrderValue).toLocaleString()}
      </p>
     </div>
    </div>
   )}

    {/* Orders Tab */}
    {activeTab === "orders" && (
     <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
       <table className="w-full text-left">
        <thead className="bg-slate-50 border-b">
         <tr>
          <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">
           Order ID
          </th>
          <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">
           Date
          </th>
          <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">
           Total
          </th>
          <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">
           Paid
          </th>
          <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">
           Balance
          </th>
          <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">
           Status
          </th>
         </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
         {orders.length === 0 ? (
          <tr>
           <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
            No orders yet
           </td>
          </tr>
         ) : (
          orders.map((order) => (
           <tr key={order.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 font-bold text-gray-900">
             #{order.id.slice(0, 8)}
            </td>
            <td className="px-6 py-4 text-gray-600">
             {new Date(order.created_at || order.created).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 text-gray-900 font-bold">
             PKR {(order.total_amount || 0).toLocaleString()}
            </td>
            <td className="px-6 py-4 text-green-600 font-medium">
             PKR {(order.amount_paid || 0).toLocaleString()}
            </td>
            <td className="px-6 py-4 font-medium">
             <span className={(order.balance_due || order.total_amount - (order.amount_paid || 0)) > 0 ? "text-red-600" : "text-green-600"}>
              PKR {((order.balance_due || (order.total_amount - (order.amount_paid || 0)))).toLocaleString()}
             </span>
            </td>
            <td className="px-6 py-4">
             <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
               order.status === "completed" || order.status === "paid"
                ? "bg-green-100 text-green-700"
                : order.status === "partial"
                ? "bg-yellow-100 text-yellow-700"
                : order.status === "refunded"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
              }`}
             >
              {order.status}
             </span>
            </td>
           </tr>
          ))
         )}
        </tbody>
       </table>
      </div>
     </div>
    )}

   {/* Khata Tab */}
   {activeTab === "khata" && (
    <div className="space-y-6">
     {khata ? (
      <>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex justify-between items-center">
         <div>
          <p className="text-sm text-red-700 font-bold">Outstanding Balance</p>
          <p className="text-4xl font-bold text-red-900 mt-2">
           PKR {(khata.balance || khata.current_balance || 0).toLocaleString()}
          </p>
         </div>
         <Button 
          onClick={() => setShowPaymentModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-6"
         >
          <Plus className="w-5 h-5 mr-2" />
          Record Payment
         </Button>
        </div>
       </div>

        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
         <div className="px-6 py-4 border-b bg-slate-50">
          <h3 className="font-bold text-gray-900">Transaction History</h3>
         </div>
         {khataTransactions.length > 0 ? (
          <div className="overflow-x-auto">
           <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
             <tr>
              <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase">Date</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase">Type</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase text-right">Amount</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase">Order</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase">Notes</th>
             </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
             {khataTransactions.map((tx: any) => (
              <tr key={tx.id} className="hover:bg-gray-50">
               <td className="px-6 py-3 text-gray-600">
                {new Date(tx.created_at).toLocaleDateString()}
               </td>
               <td className="px-6 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  tx.type === "debit" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}>
                 {tx.type === "debit" ? "Debit (Owed)" : "Credit (Paid)"}
                </span>
               </td>
               <td className={`px-6 py-3 text-right font-bold ${
                 tx.type === "debit" ? "text-red-600" : "text-green-600"
               }`}>
                PKR {(tx.amount || 0).toLocaleString()}
               </td>
               <td className="px-6 py-3 text-gray-600 text-sm">
                {tx.order_id ? `#${tx.order_id.slice(0, 8)}` : "-"}
               </td>
               <td className="px-6 py-3 text-gray-500 text-sm">
                {tx.notes || "-"}
               </td>
              </tr>
             ))}
            </tbody>
           </table>
          </div>
         ) : (
          <div className="p-12 text-center text-gray-500">
           No khata transactions recorded yet.
          </div>
         )}
        </div>
      </>
     ) : (
      <div className="bg-gray-50 border border-dashed border-gray-300 p-12 rounded-xl text-center">
       <p className="text-gray-500 font-medium">No Khata account registered for this customer.</p>
       <p className="text-gray-400 text-sm mt-2">Create an order with partial payment to automatically open a Khata account.</p>
      </div>
     )}
    </div>
   )}

   {/* Payment Modal */}
   {showPaymentModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
     <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
       <h3 className="text-xl font-bold text-gray-900">Record Khata Payment</h3>
       <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
        <X className="w-6 h-6" />
       </button>
      </div>
      <div className="p-6 space-y-4">
       <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
         Payment Amount (PKR)
        </label>
        <input
         type="number"
         value={paymentAmount}
         onChange={(e) => setPaymentAmount(e.target.value)}
         placeholder="Enter amount customer is paying"
         autoFocus
         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
        />
        <p className="text-xs text-gray-500 mt-1">
         Current Balance: PKR {(khata?.current_balance || 0).toLocaleString()}
        </p>
       </div>
       <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
         Notes (Optional)
        </label>
        <textarea
         value={paymentNotes}
         onChange={(e) => setPaymentNotes(e.target.value)}
         placeholder="e.g. Cash payment, Bank transfer..."
         rows={3}
         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
       </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 flex gap-3">
       <Button
        variant="outline"
        onClick={() => setShowPaymentModal(false)}
        className="flex-1 py-6 font-bold"
       >
        Cancel
       </Button>
       <Button
        onClick={handleRecordPayment}
        disabled={submittingPayment || !paymentAmount}
        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-6"
       >
        {submittingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Payment"}
       </Button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}
