"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
interface Transaction {
  id: number; // Unique identifier for the transaction
  shop_id: number;
  shops: { name: string };
  balance: number; // Balance associated with the transaction
  order_id: number | null; // Order ID (can be null if not associated with an order)
  transaction_date: string; // Date of the transaction
  total_balance: number; // Total balance (fetched from the `shop_balances` view)
}

export default function ShopTransactions({
  params,
}: {
  params: { shopId: string };
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKhatas = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/khata/${params.shopId}`);
      if (!response.ok) throw new Error("Failed to fetch shops");
      const data = await response.json();
      setTransactions(data);
      console.log(data);
    } catch (error) {
      console.error("Error fetching shops:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchKhatas();
  }, []);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {transactions[0]?.shops?.name}
        </h1>
        <p className="text-xl">
          Total Balance:{" "}
          <span
            className={
              transactions[0]?.total_balance >= 0
                ? "text-green-600"
                : "text-red-600"
            }
          >
            Rs {transactions[0]?.total_balance.toFixed(2)}
          </span>
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Transaction Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.id}</TableCell>
                <TableCell
                  className={
                    transaction.balance >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  Rs {transaction.balance.toFixed(2)}
                </TableCell>
                <TableCell>{transaction.order_id || "N/A"}</TableCell>
                <TableCell>
                  {new Date(transaction.transaction_date).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
