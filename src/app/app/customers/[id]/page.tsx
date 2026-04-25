// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { dataService } from "@/lib/data-service";
import { ArrowLeft, Eye } from "lucide-react";

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

 useEffect(() => {
  loadCustomerData();
 }, [customerId]);

 const loadCustomerData = async () => {
  try {
   const [customerData, ordersData, khataData] = await Promise.all([
    dataService.getCustomer(customerId),
    dataService.getOrdersByCustomer(customerId),
    dataService.getKhataAccount(customerId),
   ]);

   setCustomer(customerData);
   setOrders(ordersData || []);
   setKhata(khataData || null);

   // PocketBase expanded data for transactions if using getKhataAccount
   if (khataData?.expand?.khata_transactions_via_khata_account) {
    setKhataTransactions(khataData.expand.khata_transactions_via_khata_account);
   }

   setLoading(false);
  } catch (error) {
   console.error("Failed to load customer data:", error);
   setLoading(false);
  }
 };

 if (loading) {
  return (
   <div className="p-6 flex items-center justify-center min-h-screen">
    <div className="text-gray-600">Loading customer...</div>
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
     <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
     <p className="text-gray-600">{customer.phone || "No phone"}</p>
    </div>
   </div>

   {/* Tabs */}
   <div className="border-b border-gray-200 flex gap-8">
    {["overview", "orders", "khata"].map((tab) => (
     <button
      key={tab}
      onClick={() => setActiveTab(tab as any)}
      className={`py-3 px-1 font-medium capitalize transition-colors ${
       activeTab === tab
        ? "border-b-2 border-blue-600 text-blue-600"
        : "text-gray-600 hover:text-gray-900"
      }`}
     >
      {tab}
     </button>
    ))}
   </div>

   {/* Overview Tab */}
   {activeTab === "overview" && (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
     <div className="bg-white shadow p-6">
      <p className="text-gray-600 text-sm">Total Orders</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</p>
     </div>
     <div className="bg-white shadow p-6">
      <p className="text-gray-600 text-sm">Total Spent</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">
       PKR {totalSpent.toLocaleString()}
      </p>
     </div>
     <div className="bg-white shadow p-6">
      <p className="text-gray-600 text-sm">Avg Order Value</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">
       PKR {avgOrderValue.toLocaleString()}
      </p>
     </div>
    </div>
   )}

   {/* Orders Tab */}
   {activeTab === "orders" && (
    <div className="bg-white shadow overflow-hidden">
     <div className="overflow-x-auto">
      <table className="w-full text-sm">
       <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
         <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
          Order ID
         </th>
         <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
          Date
         </th>
         <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
          Total
         </th>
         <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
          Status
         </th>
        </tr>
       </thead>
       <tbody className="divide-y divide-gray-200">
        {orders.length === 0 ? (
         <tr>
          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
           No orders yet
          </td>
         </tr>
        ) : (
         orders.map((order) => (
          <tr key={order.id} className="hover:bg-gray-50">
           <td className="px-6 py-4 font-medium text-gray-900">
            {order.id.slice(0, 8)}
           </td>
           <td className="px-6 py-4 text-gray-700">
            {new Date(order.created_at).toLocaleDateString()}
           </td>
           <td className="px-6 py-4 text-gray-900">
            PKR {(order.total_amount || 0).toLocaleString()}
           </td>
           <td className="px-6 py-4">
            <span
             className={`px-3 py-1 text-xs font-medium ${
              order.status === "completed"
               ? "bg-green-100 text-green-700"
               : "bg-yellow-100 text-yellow-700"
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
       {/* Balance Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-200 p-6">
         <p className="text-sm text-red-700 font-medium">Current Balance</p>
         <p className="text-4xl font-bold text-red-900 mt-2">
          PKR {khata.balance.toLocaleString()}
         </p>
         <p className="text-xs text-red-600 mt-2">
          {khata.balance > 0 ? "Amount due" : "Amount available"}
         </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-6">
         <p className="text-sm text-blue-700 font-medium">Opening Balance</p>
         <p className="text-2xl font-bold text-blue-900 mt-2">
          PKR {(khata.opening_balance || 0).toLocaleString()}
         </p>
        </div>
       </div>

       {/* Transaction History */}
       <div className="bg-white shadow">
        <div className="px-6 py-4 border-b border-gray-200">
         <h3 className="font-semibold text-gray-900">Transaction History</h3>
         <p className="text-sm text-gray-600 mt-1">
          {khataTransactions.length} transactions
         </p>
        </div>
        <div className="overflow-x-auto">
         <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
           <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
             Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
             Description
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">
             Amount
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">
             Running Balance
            </th>
           </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
           {khataTransactions.length === 0 ? (
            <tr>
             <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
              No transactions yet
             </td>
            </tr>
           ) : (
            khataTransactions.map((transaction, idx) => {
             // Calculate running balance
             const previousBalance =
              idx === 0
               ? khata.opening_balance || 0
               : khataTransactions[idx - 1].balance_after || 0;
             const runningBalance =
              previousBalance +
              (transaction.transaction_type === "debit"
               ? -Math.abs(transaction.amount || 0)
               : Math.abs(transaction.amount || 0));

             return (
              <tr key={transaction.id} className="hover:bg-gray-50">
               <td className="px-6 py-4 text-gray-700">
                {new Date(transaction.transaction_date).toLocaleDateString(
                 "en-PK",
                 {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                 }
                )}
               </td>
               <td className="px-6 py-4">
                <div>
                 <p className="text-gray-900 font-medium">
                  {transaction.description || "—"}
                 </p>
                 {transaction.reference_id && (
                  <p className="text-xs text-gray-500">
                   Ref: {transaction.reference_id}
                  </p>
                 )}
                </div>
               </td>
               <td className="px-6 py-4 text-right">
                <span
                 className={`font-medium ${
                  transaction.transaction_type === "debit"
                   ? "text-red-600"
                   : "text-green-600"
                 }`}
                >
                 {transaction.transaction_type === "debit" ? "-" : "+"}PKR{" "}
                 {Math.abs(transaction.amount || 0).toLocaleString()}
                </span>
               </td>
               <td className="px-6 py-4 text-right">
                <span
                 className={`font-medium px-3 py-1 text-xs ${
                  runningBalance > 0
                   ? "bg-red-100 text-red-700"
                   : "bg-green-100 text-green-700"
                 }`}
                >
                 PKR {runningBalance.toLocaleString()}
                </span>
               </td>
              </tr>
             );
            })
           )}
          </tbody>
         </table>
        </div>
       </div>
      </>
     ) : (
      <div className="bg-gray-50 border border-gray-200 p-6 text-center">
       <p className="text-gray-600">No Khata account yet</p>
      </div>
     )}
    </div>
   )}
  </div>
 );
}
