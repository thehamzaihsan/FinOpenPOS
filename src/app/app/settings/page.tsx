"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pb";
import { Save, User, Store, DollarSign, Printer, Trash2, LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    name: "",
    email: "",
    shop_name: "",
    shop_phone: "",
    shop_address: "",
    currency: "PKR",
    receipt_header: "",
    receipt_footer: "",
    thermal_printer: "",
    tax_number: "",
  });

  useEffect(() => {
    const loadData = async () => {
      if (!pb.authStore.isValid) {
        router.push("/auth/login");
        return;
      }
      
      setUser(pb.authStore.model);
      setSettings(prev => ({
        ...prev,
        name: pb.authStore.model?.name || "",
        email: pb.authStore.model?.email || "",
      }));
      
      try {
        const shopSettings = await pb.collection("shop_settings").getFirstListItem("is_active = true");
        setSettings(prev => ({
          ...prev,
          shop_name: shopSettings.shop_name || "",
          shop_phone: shopSettings.shop_phone || "",
          shop_address: shopSettings.shop_address || "",
          currency: shopSettings.currency || "PKR",
          receipt_header: shopSettings.receipt_header || "",
          receipt_footer: shopSettings.receipt_footer || "",
          thermal_printer: shopSettings.thermal_printer || "",
          tax_number: shopSettings.tax_number || "",
        }));
      } catch (e) {}
    };
    
    loadData();
  }, [router]);

  const handleSave = async () => {
    setSuccess("");
    setSaving(true);

    try {
      if (user?.id) {
        await pb.collection("users").update(user.id, { name: settings.name });
      }

      try {
        const existing = await pb.collection("shop_settings").getFirstListItem("is_active = true");
        await pb.collection("shop_settings").update(existing.id, {
          shop_name: settings.shop_name,
          shop_phone: settings.shop_phone,
          shop_address: settings.shop_address,
          currency: settings.currency,
          receipt_header: settings.receipt_header,
          receipt_footer: settings.receipt_footer,
          thermal_printer: settings.thermal_printer,
          tax_number: settings.tax_number,
        });
      } catch (e) {
        await pb.collection("shop_settings").create({
          shop_name: settings.shop_name,
          shop_phone: settings.shop_phone,
          shop_address: settings.shop_address,
          currency: settings.currency,
          receipt_header: settings.receipt_header,
          receipt_footer: settings.receipt_footer,
          thermal_printer: settings.thermal_printer,
          tax_number: settings.tax_number,
          is_active: true,
        });
      }

      setSuccess("Settings saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    pb.authStore.clear();
    router.push("/auth/login");
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    
    setDeleteLoading(true);
    try {
      await pb.collection("users").delete(user.id);
      pb.authStore.clear();
      router.push("/auth/onboarding");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-600 mb-8">Manage your account and shop</p>

      {success && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6 text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Account</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={settings.name}
                onChange={(e) => setSettings({...settings, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={settings.email} disabled className="bg-gray-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5" /> Shop Details</CardTitle>
            <CardDescription>Basic shop information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shop Name</Label>
                <Input 
                  value={settings.shop_name}
                  onChange={(e) => setSettings({...settings, shop_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input 
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  value={settings.shop_phone}
                  onChange={(e) => setSettings({...settings, shop_phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax Number</Label>
                <Input 
                  value={settings.tax_number}
                  onChange={(e) => setSettings({...settings, tax_number: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input 
                value={settings.shop_address}
                onChange={(e) => setSettings({...settings, shop_address: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Printer className="w-5 h-5" /> Receipt & Printing</CardTitle>
            <CardDescription>Customize your receipts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Thermal Printer Name</Label>
              <Input 
                value={settings.thermal_printer}
                onChange={(e) => setSettings({...settings, thermal_printer: e.target.value})}
                placeholder="Epson TM-T88VI"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Receipt Header</Label>
                <Input 
                  value={settings.receipt_header}
                  onChange={(e) => setSettings({...settings, receipt_header: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Receipt Footer</Label>
                <Input 
                  value={settings.receipt_footer}
                  onChange={(e) => setSettings({...settings, receipt_footer: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600"><LogOut className="w-5 h-5" /> Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
            
            {!showDeleteConfirm ? (
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="w-full">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
              </Button>
            ) : (
              <div className="bg-red-50 p-4 rounded-lg border border-red-300">
                <div className="flex items-center gap-2 text-red-700 mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Are you sure?</span>
                </div>
                <p className="text-sm text-red-600 mb-3">This will permanently delete your account and all data. This action cannot be undone.</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading}>
                    {deleteLoading ? "Deleting..." : "Yes, Delete"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}