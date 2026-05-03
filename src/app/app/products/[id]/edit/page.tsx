"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { dataService } from "@/lib/data-service";
import { ArrowLeft, Save, Trash2, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    item_code: "",
    sku: "",
    purchase_price: 0,
    sale_price: 0,
    quantity: 0,
    min_stock: 5,
    min_discount: 0,
    max_discount: 0,
    unit: "piece",
    category: "",
  });

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const product = await dataService.getProduct(params.id as string);
        if (product) {
          setFormData({
            name: product.name || "",
            description: product.description || "",
            item_code: product.item_code || "",
            sku: product.sku || "",
            purchase_price: product.purchase_price || 0,
            sale_price: product.sale_price || product.price || 0,
            quantity: product.quantity || product.stock || 0,
            min_stock: product.min_stock || 5,
            min_discount: product.min_discount || 0,
            max_discount: product.max_discount || 0,
            unit: product.unit || "piece",
            category: product.category || "",
          });
        }
      } catch (error) {
        console.error("Failed to load product:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [params.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const session = localStorage.getItem("pos_session");
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session}`
        },
        body: JSON.stringify(formData)
      });
      
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to update product");
      
      dataService.invalidateProductsCache();
      router.push("/app/products");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto font-aeonik">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/app/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600">Update inventory details for {formData.name}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-none shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Item Code / Barcode</Label>
                <Input 
                  value={formData.item_code}
                  onChange={(e) => setFormData({...formData, item_code: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg">Pricing & Stock</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Purchase Price (PKR)</Label>
              <Input 
                type="number"
                value={formData.purchase_price}
                onChange={(e) => setFormData({...formData, purchase_price: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>Sale Price (PKR)</Label>
              <Input 
                type="number"
                value={formData.sale_price}
                onChange={(e) => setFormData({...formData, sale_price: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>Current Quantity</Label>
              <Input 
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>Min. Stock Alert</Label>
              <Input 
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({...formData, min_stock: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>Min. Discount (%)</Label>
              <Input 
                type="number"
                value={formData.min_discount}
                onChange={(e) => setFormData({...formData, min_discount: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>Max. Discount (%)</Label>
              <Input 
                type="number"
                value={formData.max_discount}
                onChange={(e) => setFormData({...formData, max_discount: Number(e.target.value)})}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 min-w-[150px]" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
