"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Store, DollarSign, Calendar, CreditCard } from "lucide-react";
import { Separator } from "@/components/ui/seperator";
import { Button } from "@/components/ui/button";

interface OrderDetail {
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  orderId: string;
  shopName: string;
  total: number;
  totalPaid: number;
  date: string;
  details: OrderDetail[];
}

export default function OrderSubPage({
  params,
}: {
  params: { orderId: string };
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/orders/${params.orderId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();
        console.log(data);
        setOrder({
          orderId: data[0].id.toString(),
          shopName: data[0].shop.name,
          total: data[0].total_amount,
          totalPaid: data[0].amount_paid,
          date: data[0].created_at,
          details: data[0].order_items.map((item: any) => ({
            productName: item.product.name,
            quantity: item.quantity,
            price: item.price,
          })),
        });
      } catch (error) {
      } finally {
      }
      setIsLoading(false);
    };

    fetchOrder();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center h-screen">
        No order data available
      </div>
    );
  }

  const paymentStatus =
    order.totalPaid >= order.total ? "Paid" : "Partially Paid";

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Order Dashboard</h1>

      <div className="print-only flex flex-row gap-14">
        <div>
            <span>
              <h1 className="font-bold">OrderId: </h1> {order.orderId}{" "}
            </span>
            <br />
            <span>
              <h1 className="font-bold">ShopName: </h1> {order.shopName}{" "}
            </span>
            <br />
            <span>
              <h1 className="font-bold">Total Ammount: </h1>Rs {order.total}{" "}
            </span>
            <br />
        </div>
        <div>
            <span>
              <h1 className="font-bold">Ammount Paid: </h1>Rs {order.totalPaid}{" "}
            </span>
            <br />
            <span>
              <h1 className="font-bold">Date: </h1>{" "}
              {new Date(order.date).toLocaleDateString()}{" "}
            </span>
            <br />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 no-print">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order ID</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order.orderId}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shop</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order.shopName}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs {order.total.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs {order.totalPaid.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <Badge
                variant={paymentStatus === "Paid" ? "default" : "secondary"}
              >
                {paymentStatus}
              </Badge>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(order.date).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="card-header">
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent className="card-header">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.details.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>Rs {item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    Rs {(item.quantity * item.price).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="my-4" />
          <div className="flex justify-between items-center">
            <p className="font-semibold">Total:</p>
            <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
      <div className="w-full flex justify-end no-print">
        <Button
          className="mt-10"
          onClick={() => {
            window.print();
          }}
        >
          Print
        </Button>
      </div>
    </div>
  );
}
