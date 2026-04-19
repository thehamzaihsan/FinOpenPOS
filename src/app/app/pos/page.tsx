// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { dataService } from "@/lib/data-service";
import { Plus, Minus, Trash2, Printer, AlertCircle, X } from "lucide-react";

interface CartItem {
 id: string;
 productId: string;
 name: string;
 variant?: string;
 quantity: number;
 unitPrice: number;
 discount: number;
 maxDiscount: number;
}

interface Product {
 id: string;
 name: string;
 item_code: string;
 sale_price: number;
 quantity: number;
 min_discount: number;
 max_discount: number;
 variants?: Array<{ id: string; name: string; sale_price: number }>;
}

interface Customer {
 id: string;
 name: string;
 phone?: string;
}

export default function POSPage() {
 const [products, setProducts] = useState<Product[]>([]);
 const [customers, setCustomers] = useState<Customer[]>([]);
 const [cart, setCart] = useState<CartItem[]>([]);
 const [saleType, setSaleType] = useState<"walk-in" | "retail">("walk-in");
 const [selectedCustomer, setSelectedCustomer] = useState<string>("");
 const [amountPaid, setAmountPaid] = useState<number>(0);
 const [paymentMethod, setPaymentMethod] = useState<string>("cash");
 const [searchQuery, setSearchQuery] = useState("");
 const [showNewCustomer, setShowNewCustomer] = useState(false);
 const [newCustomerName, setNewCustomerName] = useState("");
 const [newCustomerPhone, setNewCustomerPhone] = useState("");
 const [loading, setLoading] = useState(true);
 const [activeTab, setActiveTab] = useState<"products" | "deals">("products");
 const [orderError, setOrderError] = useState<string>("");
 const [showFilters, setShowFilters] = useState(false);
 const [minPrice, setMinPrice] = useState<number>(0);
 const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
   loadData();
  }, []);

 const loadData = async (forceRefresh = false) => {
  try {
   const [products, customers] = await Promise.all([
    dataService.getProducts(forceRefresh),
    dataService.getCustomers(forceRefresh),
   ]);

   setProducts(products || []);
   setCustomers(customers || []);
   setLoading(false);
  } catch (error) {
   console.error("Failed to load data:", error);
   setLoading(false);
  }
 };

 const addToCart = (product: Product) => {
  const newItem: CartItem = {
   id: `${product.id}-${Date.now()}`,
   productId: product.id,
   name: product.name,
   quantity: 1,
   unitPrice: product.sale_price,
   discount: 0,
   maxDiscount: product.max_discount,
  };
  setCart([...cart, newItem]);
 };

 const updateCartItem = (id: string, updates: Partial<CartItem>) => {
  setCart(
   cart.map((item) =>
    item.id === id ? { ...item, ...updates } : item
   )
  );
 };

 const removeFromCart = (id: string) => {
  setCart(cart.filter((item) => item.id !== id));
 };

 const calculateLineTotal = (item: CartItem): number => {
  const subtotal = item.quantity * item.unitPrice;
  const discountAmount = (subtotal * item.discount) / 100;
  return subtotal - discountAmount;
 };

 const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
 const totalDiscount = cart.reduce(
  (sum, item) => sum + (item.quantity * item.unitPrice * item.discount) / 100,
  0
 );
 const totalDue = subtotal - totalDiscount;
 const balance = totalDue - amountPaid;
 
 // Walk-in: must pay in full. Retail: can have credit
 const canComplete = saleType === "walk-in" 
  ? balance === 0 
  : selectedCustomer !== "";

  const handleCompleteOrder = async () => {
   setOrderError("");
   
   if (cart.length === 0) {
    setOrderError("Cart is empty");
    return;
   }

   if (!canComplete) {
    setOrderError("Cannot complete order. Check balance and payment method.");
    return;
   }

    try {
     // Determine status based on payment
     const orderStatus = amountPaid >= totalDue ? "paid" : "partial";
     
     const orderData: any = {
      subtotal: subtotal,
      discount_total: totalDiscount,
      total_amount: totalDue,
      amount_paid: amountPaid,
      payment_method: paymentMethod,
      status: orderStatus,
      is_khata: balance > 0,
     };

     // Only add customer_id for retail sales
     if (saleType === "retail" && selectedCustomer) {
      orderData.customer_id = selectedCustomer;
     }

     // Create order via API
     const orderResponse = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
     });

     if (!orderResponse.ok) {
      const error = await orderResponse.json();
      setOrderError(`Order creation failed: ${error.error || "Unknown error"}`);
      return;
     }

     const { data: order } = await orderResponse.json();

     // Add order items via API
     const orderItems = cart.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount_pct: item.discount,
      discount_amount: (item.unitPrice * item.quantity * item.discount) / 100,
      line_total: (item.unitPrice * item.quantity) - ((item.unitPrice * item.quantity * item.discount) / 100),
     }));

     const itemsResponse = await fetch(`/api/orders/${order.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: orderItems }),
     });

     if (!itemsResponse.ok) {
      const error = await itemsResponse.json();
      setOrderError(`Failed to add items: ${error.error || "Unknown error"}`);
      return;
     }

     alert("Order created successfully!");
     setCart([]);
     setAmountPaid(0);
     setSelectedCustomer("");
     setOrderError("");
     // Invalidate orders cache
     dataService.invalidateOrdersCache();
    } catch (error) {
     console.error("Failed to create order:", error);
     setOrderError(
      error instanceof Error ? error.message : "Failed to create order"
     );
    }
  };

  const handleAddCustomer = async () => {
   if (!newCustomerName.trim()) {
    alert("Customer name is required");
    return;
   }

   try {
    const response = await fetch("/api/customers", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
      name: newCustomerName,
      phone: newCustomerPhone,
     }),
    });

    if (!response.ok) {
     const error = await response.json();
     throw new Error(error.error || "Failed to create customer");
    }

    const { data: customer } = await response.json();

    setCustomers([...customers, customer]);
    setSelectedCustomer(customer.id);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setShowNewCustomer(false);
    // Invalidate cache so next load gets fresh data
    dataService.invalidateCustomersCache();
   } catch (error) {
    console.error("Failed to add customer:", error);
    alert(`Failed to add customer: ${error instanceof Error ? error.message : "Unknown error"}`);
   }
  };

 if (loading) {
  return (
   <div className="p-6 flex items-center justify-center min-h-screen">
    <div className="text-gray-600">Loading POS...</div>
   </div>
  );
 }

 const filteredProducts = products.filter((p) => {
  // Search query
  const matchesSearch =
   p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
   p.item_code.toLowerCase().includes(searchQuery.toLowerCase());

  // Price range
  const matchesPrice =
   p.sale_price >= minPrice && p.sale_price <= maxPrice;

  // Stock availability
  const matchesStock = !inStockOnly || p.quantity > 0;

  return matchesSearch && matchesPrice && matchesStock;
 });

 return (
  <div className="p-6 space-y-6">
   <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>

   {/* Error Alert */}
   {orderError && (
    <div className="bg-red-50 border border-red-200 p-4 flex gap-3">
     <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
     <div>
      <h3 className="font-semibold text-red-900">Error</h3>
      <p className="text-red-700 text-sm mt-1">{orderError}</p>
     </div>
    </div>
   )}

   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Left Panel - Product Selector */}
    <div className="lg:col-span-2 space-y-4">
     {/* Search & Tabs */}
     <div className="bg-white shadow p-4 space-y-4">
      {/* Search Input */}
      <div className="relative">
       <input
        type="text"
        placeholder="Search products by name or code..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 pr-10"
       />
       <button
        onClick={() => setShowFilters(!showFilters)}
        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors ${
         showFilters
          ? "bg-blue-100 text-blue-600"
          : "text-gray-400 hover:text-gray-600"
        }`}
        title="Advanced Filters"
       >
        <svg
         className="w-5 h-5"
         fill="none"
         stroke="currentColor"
         viewBox="0 0 24 24"
        >
         <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
         />
        </svg>
       </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
       <div className="space-y-3 p-4 bg-blue-50 border border-blue-200">
        <h4 className="font-semibold text-gray-900 text-sm">Filters</h4>

        {/* Price Range */}
        <div className="space-y-2">
         <label className="text-xs font-medium text-gray-700">
          Price Range: PKR {minPrice.toLocaleString()} - PKR{" "}
          {maxPrice.toLocaleString()}
         </label>
         <div className="flex gap-2">
          <input
           type="number"
           value={minPrice}
           onChange={(e) => setMinPrice(parseFloat(e.target.value) || 0)}
           placeholder="Min"
           className="flex-1 px-2 py-1 border border-gray-300 text-sm"
          />
          <input
           type="number"
           value={maxPrice}
           onChange={(e) => setMaxPrice(parseFloat(e.target.value) || 100000)}
           placeholder="Max"
           className="flex-1 px-2 py-1 border border-gray-300 text-sm"
          />
         </div>
        </div>

        {/* Stock Filter */}
        <div className="flex items-center gap-2">
         <input
          type="checkbox"
          id="inStock"
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
          className="border-gray-300"
         />
         <label
          htmlFor="inStock"
          className="text-sm font-medium text-gray-700 cursor-pointer"
         >
          In Stock Only
         </label>
        </div>

        {/* Reset Filters */}
        <button
         onClick={() => {
          setMinPrice(0);
          setMaxPrice(100000);
          setInStockOnly(false);
          setShowFilters(false);
         }}
         className="w-full px-3 py-1.5 bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
         Clear Filters
        </button>
       </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
       <button
        onClick={() => setActiveTab("products")}
        className={`px-4 py-2 font-medium transition-colors ${
         activeTab === "products"
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-700"
        }`}
       >
        Products
       </button>
       <button
        onClick={() => setActiveTab("deals")}
        className={`px-4 py-2 font-medium transition-colors ${
         activeTab === "deals"
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-700"
        }`}
       >
        Deals
       </button>
      </div>
     </div>

     {/* Products Grid */}
     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {filteredProducts.map((product) => (
       <div key={product.id} className="bg-white shadow p-4 hover:shadow-lg transition-shadow">
        <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-2">{product.item_code}</p>
        <p className="text-lg font-bold text-blue-600 mb-3">
         PKR {product.sale_price}
        </p>
        <button
         onClick={() => addToCart(product)}
         className="w-full bg-blue-600 text-white py-2 hover:bg-blue-700 transition-colors text-sm font-medium"
        >
         Add to Cart
        </button>
       </div>
      ))}
     </div>
    </div>

    {/* Right Panel - Cart & Order Summary */}
    <div className="space-y-4">
     {/* Sale Type Selector */}
     <div className="bg-white shadow-md border border-gray-100 p-4">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
       Sale Type
      </label>
      <div className="grid grid-cols-2 gap-3">
       <button
        onClick={() => {
         setSaleType("walk-in");
         setSelectedCustomer("");
        }}
        className={`py-3 px-4 font-bold transition-all border-2 ${
         saleType === "walk-in"
          ? "border-blue-600 bg-blue-50 text-blue-700"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
        }`}
       >
        👤 Walk-in
       </button>
       <button
        onClick={() => setSaleType("retail")}
        className={`py-3 px-4 font-bold transition-all border-2 ${
         saleType === "retail"
          ? "border-green-600 bg-green-50 text-green-700"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
        }`}
       >
        👥 Retail
       </button>
      </div>
     </div>

     {/* Customer Selector - Only for Retail */}
     {saleType === "retail" && (
      <div className="bg-white shadow-md border border-gray-100 p-4 space-y-3">
       <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
        Select Retail Customer
       </label>

       {customers.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 p-4 text-center">
         <p className="text-sm text-blue-700 font-medium mb-3">
          No retail customers yet
         </p>
         <button
          onClick={() => setShowNewCustomer(true)}
          className="w-full bg-blue-600 text-white py-2 hover:bg-blue-700 font-medium text-sm"
         >
          + Add First Customer
         </button>
        </div>
       ) : (
        <>
         <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium"
         >
          <option value="">-- Select a customer --</option>
          {customers.map((c) => (
           <option key={c.id} value={c.id}>
            {c.name} {c.phone ? `(${c.phone})` : ""}
           </option>
          ))}
         </select>
         <button
          onClick={() => setShowNewCustomer(true)}
          className="w-full border-2 border-dashed border-green-600 text-green-600 py-2.5 hover:bg-green-50 transition-colors text-sm font-bold"
         >
          + Add New Retail Customer
         </button>
        </>
       )}
      </div>
     )}

     {/* Walk-in Info - Only for Walk-in */}
     {saleType === "walk-in" && (
      <div className="bg-blue-50 border-2 border-blue-200 p-4">
       <p className="text-sm font-bold text-blue-900 mb-2">👤 Walk-in Sale</p>
       <p className="text-xs text-blue-700 mb-3">
        Walk-in customers must pay in full. No credit allowed.
       </p>
       <div className="bg-white p-2 text-center">
        <p className="text-xs text-gray-600">Customer</p>
        <p className="font-bold text-gray-900">Anonymous Walk-in</p>
       </div>
      </div>
     )}

     {/* New Customer Modal */}
     {showNewCustomer && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
       <div className="bg-white p-6 w-96 shadow-lg">
        <div className="flex justify-between items-center mb-4">
         <h3 className="text-lg font-bold text-gray-900">Add Retail Customer</h3>
         <button onClick={() => setShowNewCustomer(false)}>
          <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
         </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
         Retail customers can have credit balance on their account.
        </p>
        <input
         type="text"
         placeholder="Customer Name"
         value={newCustomerName}
         onChange={(e) => setNewCustomerName(e.target.value)}
         className="w-full px-3 py-2 border border-gray-300 mb-3 focus:ring-2 focus:ring-blue-500"
        />
        <input
         type="text"
         placeholder="Phone (optional)"
         value={newCustomerPhone}
         onChange={(e) => setNewCustomerPhone(e.target.value)}
         className="w-full px-3 py-2 border border-gray-300 mb-4 focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
         <button
          onClick={() => setShowNewCustomer(false)}
          className="flex-1 border border-gray-300 py-2 hover:bg-gray-50 font-medium"
         >
          Cancel
         </button>
         <button
          onClick={handleAddCustomer}
          className="flex-1 bg-blue-600 text-white py-2 hover:bg-blue-700 font-medium"
         >
          Add Customer
         </button>
        </div>
       </div>
      </div>
     )}

     {/* Cart Items */}
     <div className="bg-gradient-to-br from-slate-50 to-white shadow-md border border-gray-100 p-4 flex flex-col max-h-[500px]">
      <div className="flex items-center justify-between mb-4">
       <h3 className="font-bold text-gray-900 text-lg">Order Summary</h3>
       <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 ">
        {cart.length} items
       </span>
      </div>

      {/* Cart Items Scrollable Area */}
      <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-2">
       {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
         <div className="text-4xl mb-2">📦</div>
         <p className="text-sm">Cart is empty</p>
        </div>
       ) : (
        <>
         {cart.map((item) => (
          <div
           key={item.id}
           className="bg-white border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all space-y-3"
          >
           {/* Item Header */}
           <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
             <p className="font-semibold text-gray-900 text-sm truncate">
              {item.name}
             </p>
             <p className="text-xs text-gray-500">
              @ PKR {item.unitPrice.toLocaleString()}
             </p>
            </div>
            <button
             onClick={() => removeFromCart(item.id)}
             className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
            >
             <Trash2 className="w-4 h-4" />
            </button>
           </div>

           {/* Quantity Controls */}
           <div className="flex items-center gap-1.5 bg-gray-50 p-2">
            <button
             onClick={() =>
              updateCartItem(item.id, {
               quantity: Math.max(1, item.quantity - 1),
              })
             }
             className="p-1 hover:bg-gray-200 transition-colors"
            >
             <Minus className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <input
             type="number"
             value={item.quantity}
             onChange={(e) =>
              updateCartItem(item.id, {
               quantity: parseInt(e.target.value) || 1,
              })
             }
             className="flex-1 text-center border-0 bg-white font-semibold text-sm py-1 focus:ring-2 focus:ring-blue-400"
             min="1"
            />
            <button
             onClick={() =>
              updateCartItem(item.id, {
               quantity: item.quantity + 1,
              })
             }
             className="p-1 hover:bg-gray-200 transition-colors"
            >
             <Plus className="w-3.5 h-3.5 text-gray-600" />
            </button>
           </div>

           {/* Discount Input */}
           {item.maxDiscount > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 p-2">
             <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
              Disc:
             </label>
             <input
              type="number"
              value={item.discount}
              onChange={(e) => {
               const val = Math.min(
                parseFloat(e.target.value) || 0,
                item.maxDiscount
               );
               updateCartItem(item.id, { discount: val });
              }}
              className="flex-1 border border-blue-200 bg-white py-1 px-2 text-xs focus:ring-2 focus:ring-blue-400"
              min="0"
              max={item.maxDiscount}
             />
             <span className="text-xs text-gray-600 font-medium">
              % (max {item.maxDiscount}%)
             </span>
            </div>
           )}

           {/* Line Total */}
           <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-600">Line Total:</span>
            <span className="font-bold text-blue-600 text-sm">
             PKR {calculateLineTotal(item).toLocaleString()}
            </span>
           </div>
          </div>
         ))}
        </>
       )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-3" />

      {/* Summary Section */}
      <div className="space-y-2 mb-4">
       <div className="flex justify-between text-xs">
        <span className="text-gray-600">Subtotal</span>
        <span className="font-medium text-gray-900">
         PKR {subtotal.toLocaleString()}
        </span>
       </div>
       {totalDiscount > 0 && (
        <div className="flex justify-between text-xs">
         <span className="text-gray-600">Discount</span>
         <span className="font-medium text-red-600">
          -PKR {totalDiscount.toLocaleString()}
         </span>
        </div>
       )}
       <div className="flex justify-between text-sm font-bold bg-gradient-to-r from-blue-50 to-blue-100 p-2">
        <span className="text-gray-900">Total Due</span>
        <span className="text-blue-700">
         PKR {totalDue.toLocaleString()}
        </span>
       </div>
      </div>
     </div>

     {/* Summary */}
     <div className="bg-white shadow-md border border-gray-100 p-4 space-y-4">
      {/* Amount Paid Section */}
      <div>
       <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
        Amount Paid
       </label>
       <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">
         PKR
        </span>
        <input
         type="number"
         value={amountPaid}
         onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
         className="w-full pl-12 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-lg"
         min="0"
         placeholder="0"
        />
       </div>
      </div>

      {/* Payment Method */}
      <div>
       <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
        Payment Method
       </label>
       <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
       >
        <option value="cash">💵 Cash</option>
        <option value="card">💳 Card</option>
        <option value="bank_transfer">🏦 Bank Transfer</option>
       </select>
      </div>

      {/* Balance Alert */}
      {balance !== 0 && (
       <div
        className={`p-3 text-sm flex gap-3 border-2 ${
         balance > 0
          ? "bg-yellow-50 border-yellow-200 text-yellow-700"
          : "bg-green-50 border-green-200 text-green-700"
        }`}
       >
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
         {balance > 0 ? (
          <div>
           <p className="font-semibold">Balance Due</p>
           <p className="text-lg font-bold">
            PKR {balance.toLocaleString()}
           </p>
          </div>
         ) : (
          <div>
           <p className="font-semibold">Change to Return</p>
           <p className="text-lg font-bold">
            PKR {Math.abs(balance).toLocaleString()}
           </p>
          </div>
         )}
        </div>
       </div>
      )}

      {/* Walk-in Credit Warning */}
      {balance > 0 && saleType === "walk-in" && (
       <div className="p-3 text-sm bg-red-50 border-2 border-red-200 text-red-700 flex gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
         <p className="font-semibold">Walk-in Payment Required</p>
         <p className="text-xs mt-1">
          Walk-in customers must pay the full amount.
         </p>
        </div>
       </div>
      )}

      {/* Complete Order Button */}
      <button
       onClick={handleCompleteOrder}
       disabled={!canComplete || cart.length === 0}
       className={`w-full py-3 font-bold text-white transition-all flex items-center justify-center gap-2 text-lg ${
        canComplete && cart.length > 0
         ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl"
         : "bg-gray-400 cursor-not-allowed"
       }`}
      >
       <Printer className="w-5 h-5" />
       Complete Order
      </button>
     </div>
    </div>
   </div>
  </div>
 );
}
