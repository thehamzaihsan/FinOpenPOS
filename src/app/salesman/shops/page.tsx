"use client";

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
import { Textarea } from "@/components/ui/textarea";
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

type Shop = {
  id: number;
  name: string;
  owner: string;
  phone: string;
  Address: string;
};

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewShopDialog, setShowNewShopDialog] = useState(false);
  const [newShopName, setNewShopName] = useState("");
  const [newShopOwner, setNewShopOwner] = useState("");
  const [newShopAddress, setNewShopAddress] = useState("");
  const [newShopPhone, setNewShopPhone] = useState("");
  const [isEditShopDialogOpen, setIsEditShopDialogOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
  });
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await fetch("/api/shops");
        if (!response.ok) {
          throw new Error("Failed to fetch shops");
        }
        const data = await response.json();
        setShops(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      console.log(searchTerm);
      return (
       
       ( shop.name && shop.name.toLowerCase().includes(searchTerm.toLowerCase()) )||
       (shop.phone && shop.phone.includes(searchTerm) )
      );
    });
  }, [shops, searchTerm]);

  const resetSelectedShop = () => {
    setSelectedShopId(null);
    setNewShopName("");
    setNewShopAddress("");
    setNewShopOwner("");
    setNewShopPhone("");
  };

  const handleAddShop = useCallback(async () => {
    try {
      const newShop = {
        name: newShopName,
        owner: newShopOwner,
        phone: newShopPhone,
        Address: newShopAddress,
      };
      const response = await fetch("/api/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newShop),
      });

      if (!response.ok) {
        throw new Error("Error creating shop");
      }

      const createdShop = await response.json();
      setShops([...shops, createdShop]);
      setShowNewShopDialog(false);
      resetSelectedShop();
    } catch (error) {
      console.error(error);
    }
  }, [newShopName, newShopAddress, newShopPhone, newShopOwner, shops]);

  const handleEditShop = useCallback(async () => {
    if (!selectedShopId) return;
    try {
      const updatedShop = {
        name: newShopName,
        owner: newShopOwner,
        phone: newShopPhone,
        Address: newShopAddress,
      };
      const response = await fetch(`/api/shops/${selectedShopId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedShop),
      });

      if (!response.ok) {
        throw new Error("Error updating shop");
      }

      const updatedShopData = await response.json();
      setShops(
        shops.map((c) => (c.id === updatedShopData.id ? updatedShopData : c))
      );
      setIsEditShopDialogOpen(false);
      resetSelectedShop();
    } catch (error) {
      console.error(error);
    }
  }, [newShopName, newShopAddress, newShopPhone, newShopOwner, shops]);

  const handleDeleteShop = useCallback(async () => {
    if (!shopToDelete) return;
    try {
      const response = await fetch(`/api/shops/${shopToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error deleting shop");
      }

      setShops(shops.filter((c) => c.id !== shopToDelete.id));
      setIsDeleteConfirmationOpen(false);
      setShopToDelete(null);
    } catch (error) {
      console.error(error);
    }
  }, [shopToDelete, shops]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      status: value,
    }));
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
        <h1 className="text-2xl font-bold mb-4">Shops</h1>
        <Card>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="flex flex-col gap-6 p-6">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search shops..."
                value={searchTerm}
                onChange={handleSearch}
                className="pr-8"
              />
              <SearchIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          
          </div>
          <Button size="sm" onClick={() => setShowNewShopDialog(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Shop
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShops.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell>{shop.name}</TableCell>
                  <TableCell>{shop.owner}</TableCell>
                  <TableCell>{shop.phone}</TableCell>
                  <TableCell>{shop.Address}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedShopId(shop.id);
                          setNewShopName(shop.name);
                          setNewShopAddress(shop.Address);
                          setNewShopPhone(shop.phone);
                          setNewShopOwner(shop.owner);
                          setIsEditShopDialogOpen(true);
                        }}
                      >
                        <FilePenIcon className="w-4 h-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setShopToDelete(shop);
                          setIsDeleteConfirmationOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
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
        open={showNewShopDialog || isEditShopDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setShowNewShopDialog(false);
            setIsEditShopDialogOpen(false);
            resetSelectedShop();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showNewShopDialog ? "Create New Shop" : "Edit Shop"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newShopName}
                onChange={(e) => setNewShopName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email">Owner</Label>
              <Input
                id="email"
                value={newShopOwner}
                onChange={(e) => setNewShopOwner(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newShopPhone}
                onChange={(e) => setNewShopPhone(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status">Address</Label>
              <Textarea 
               id="address"
               value={newShopAddress}
               onChange={(e) => setNewShopAddress(e.target.value)}
               className="col-span-3"
              ></Textarea>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowNewShopDialog(false);
                setIsEditShopDialogOpen(false);
                resetSelectedShop();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={showNewShopDialog ? handleAddShop : handleEditShop}
            >
              {showNewShopDialog ? "Create Shop" : "Update Shop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteConfirmationOpen}
        onOpenChange={setIsDeleteConfirmationOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          Are you sure you want to delete this shop? This action cannot be
          undone.
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteShop}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
