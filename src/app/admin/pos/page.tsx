"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2Icon } from "lucide-react";
type Product = {
  id: number;
  name: string;
  price:number;
  sale_price: number;
};

type Shops = {
  id: number;
  name: string;
  Address: string;
  phone: string;
  owner: string;
};

interface POSProduct extends Product {
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shops[]>([]);
  const [amount_paid, setAmountPaid] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<POSProduct[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shops | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchShops();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
    setLoading(false);
  };

  const fetchShops = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/shops");
      if (!response.ok) throw new Error("Failed to fetch shops");
      const data = await response.json();
      setShops(data);
    } catch (error) {
      console.error("Error fetching shops:", error);
    }
    setLoading(false);
  };

  const handleSelectProduct = (productId: number | string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (selectedProducts.some((p) => p.id === productId)) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.id === productId ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const handleSelectShop = (shopId: number | string) => {
    const shop = shops.find((c) => c.id === shopId);
    if (shop) {
      console.log(shop);
      setSelectedShop(shop);
    }
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    setSelectedProducts(
      selectedProducts.map((p) =>
        p.id === productId ? { ...p, quantity: newQuantity } : p
      )
    );
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const total = selectedProducts.reduce(
    (sum, product) => sum + product.sale_price * (product.quantity || 1),
    0
  );

  const buy_total = selectedProducts.reduce(
    (sum, product) => sum + product.price * (product.quantity || 1),
    0
  );

  const handleCreateOrder = async () => {
    setError("");
    setLoading(true);
    if (!selectedShop || selectedProducts.length === 0) {
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopId: selectedShop.id,
          amount_paid,
          products: selectedProducts.map((p) => ({
            id: p.id,
            quantity: p.quantity,
            price: p.sale_price,
          })),
          total,
          buy_total,
        }),
      });

      // Check if the response is not OK
      if (!response.ok) {
        // Parse the error response to get the error message
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      // Parse the successful response
      const order = await response.json();

      // Reset the form
      setSelectedProducts([]);
      setSelectedShop(null);
      setAmountPaid(0);
    } catch (error: any) {
      console.error("Error creating order:", error.message);
      // Optionally, display the error message to the user
      setError(error.message);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {error.length > 0 && (
        <Alert className="mb-4 bg-red-600 text-white">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Sale Details</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Combobox
              items={shops}
              placeholder="Select Shop"
              noSelect={selectedShop === null}
              onSelect={handleSelectShop}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <Combobox
            items={products}
            placeholder="Select Product"
            noSelect
            onSelect={handleSelectProduct}
            className="!mt-5"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>${product.sale_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <input
                      type="number"
                      min="1"
                      value={product.quantity || 1}
                      onChange={(e) =>
                        handleQuantityChange(
                          product.id,
                          parseInt(e.target.value)
                        )
                      }
                      className="w-16 p-1 border rounded"
                    />
                  </TableCell>
                  <TableCell>
                    ${((product.quantity || 1) * product.sale_price).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveProduct(product.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center gap-2  justify-between">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Amount_Paid" className="text-right">
                Amount Paid
              </Label>
              <Input
                id="Amount_Paid"
                type="number"
                value={amount_paid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="col-span-3"
              ></Input>
            </div>
            <strong>Total: ${total.toFixed(2)}</strong>
          </div>
          <div className="mt-4">
            <Button
              onClick={handleCreateOrder}
              disabled={selectedProducts.length === 0 || !selectedShop}
            >
              Create Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
