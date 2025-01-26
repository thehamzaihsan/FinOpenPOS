"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import {
  Loader2Icon,
  PlusCircle,
  Trash2,
  SearchIcon,
  FilterIcon,
  FilePenIcon,
  EyeIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Combobox } from "@/components/ui/combobox";
import Link from "next/link";

type Khata = {
  shop_id: number;
  total_balance: number;
  shop_name: string;
};

type Shops = {
  id: number;
  name: string;
};

export default function KhatasPage() {
  const [khatas, setKhatas] = useState<Khata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewKhataDialog, setShowNewKhataDialog] = useState(false);
  const [newKhataCustomerName, setNewKhataCustomerName] = useState("");
  const [newKhataTotal, setNewKhataTotal] = useState("");
  const [isEditKhataDialogOpen, setIsEditKhataDialogOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [khataToDelete, setKhataToDelete] = useState<Khata | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
  });
  const [selectedKhataId, setSelectedKhataId] = useState<number | null>(null);
  const [shops, setShops] = useState<Shops[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shops | null>(null);

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

  const fetchKhatas = async () => {
    try {
      const response = await fetch("/api/khata");
      if (!response.ok) {
        throw new Error("Failed to fetch khatas");
      }
      const data = await response.json();
      setKhatas(data);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {

    fetchKhatas();
    fetchShops();
  }, []);

  const filteredKhatas = useMemo(() => {
    return khatas.filter((khata) => {
      return khata.shop_name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [ khatas, searchTerm]);

  const resetSelectedKhata = () => {
    setSelectedKhataId(null);
    setNewKhataCustomerName("");
    setNewKhataTotal("");
  };

  const handleEditKhata = useCallback(async () => {
    if (selectedShop === null) {
      console.log("NO SHOP SELECTED");
      return;
    }
  
    if (parseFloat(newKhataTotal) < 0) {
      console.log("Invalid amount: Amount cannot be negative");
      return;
    }
  
    try {
      const updatedKhata = {
        amount: parseFloat(newKhataTotal),
        shopID: selectedShop?.id,
      };
  
      const response = await fetch("/api/khata", {
        method: "POST", // Use PUT for updating
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedKhata),
      });
  
      if (!response.ok) {
        throw new Error("Error updating khata");
      }
  
     
      fetchKhatas();
      setShowNewKhataDialog(false);
      resetSelectedKhata();
    } catch (error) {
      console.error(error);
    }
  }, [newKhataTotal, khatas, selectedShop]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Khatas</h1>
        <Card>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSelectShop = (shopId: number | string) => {
    const shop = shops.find((c) => c.id === shopId);
    if (shop) {
      console.log(shop);
      setSelectedShop(shop);
    }
  };

  return (
    <Card className="flex flex-col gap-6 p-6">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search khatas..."
                value={searchTerm}
                onChange={handleSearch}
                className="pr-8"
              />
              <SearchIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <Button size="sm" onClick={() => setShowNewKhataDialog(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Clear Khata
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop ID</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKhatas.map((khata) => (
                <TableRow key={khata.shop_id}>
                  <TableCell>{khata.shop_id}</TableCell>
                  <TableCell>{khata.shop_name}</TableCell>
                  <TableCell>Rs {khata.total_balance.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/khatas/${khata.shop_id}`}
                        prefetch={false}
                      >
                        <Button size="icon" variant="ghost">
                          <EyeIcon className="w-4 h-4" />
                          <span className="sr-only">View</span>
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        {/* Pagination can be added here if needed */}
      </CardFooter>

      <Dialog
        open={showNewKhataDialog || isEditKhataDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setShowNewKhataDialog(false);
            setIsEditKhataDialogOpen(false);
            resetSelectedKhata();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"Create New Khata"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <Combobox
                items={shops}
                placeholder="Select Shop"
                noSelect={selectedShop === null}
                onSelect={handleSelectShop}
              />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total">Total</Label>
              <Input
                id="total"
                type="number"
                value={newKhataTotal}
                onChange={(e) => setNewKhataTotal(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4"></div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowNewKhataDialog(false);
                setIsEditKhataDialogOpen(false);
                resetSelectedKhata();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditKhata}>
              {showNewKhataDialog ? "Create Khata" : "Update Khata"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
