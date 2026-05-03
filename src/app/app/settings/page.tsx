"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, User, Store, DollarSign, Printer, Trash2, LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { dataService } from "@/lib/data-service";

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
      setLoading(true);
      try {
        const session = localStorage.getItem("pos_session");
        if (!session) {
            router.replace("/auth/login");
            return;
        }

        const res = await fetch("/api/profile", {
            headers: { "Authorization": `Bearer ${session}` }
        });
        if (!res.ok) {
            router.replace("/auth/login");
            return;
        }
        const profileJson = await res.json();
        const profile = profileJson.data;
        setUser(profile);
        
        setSettings(prev => ({
          ...prev,
          name: profile.name || "",
          email: profile.email || "",
        }));
        
        const shopSettings = await dataService.getShopSettings();
        if (shopSettings) {
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
        }
      } catch (e) {
          console.error("Failed to load settings:", e);
      } finally {
          setLoading(false);
      }
    };
    
    loadData();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    
    try {
      // Update profile
      const session = localStorage.getItem("pos_session");
      await fetch("/api/profile", {
          method: "POST",
          headers: { 
              "Authorization": `Bearer ${session}`,
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ name: settings.name })
      });

      // Update shop settings via dataService
      const existing = await dataService.getShopSettings();
      await dataService.updateShopSettings(existing?.id || null, {
        shop_name: settings.shop_name,
        shop_phone: settings.shop_phone,
        shop_address: settings.shop_address,
        currency: settings.currency,
        receipt_header: settings.receipt_header,
        receipt_footer: settings.receipt_footer,
        thermal_printer: settings.thermal_printer,
        tax_number: settings.tax_number,
        is_active: true
      });
      
      setSuccess("Settings updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pos_session");
    router.push("/auth/login?logout=true");
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your profile and shop preferences</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* User Profile */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Profile Information
            </CardTitle>
            <CardDescription>Update your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  value={settings.name}
                  onChange={(e) => setSettings({...settings, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  value={settings.email}
                  disabled
                  className="bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop Settings */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" /> Shop Details
            </CardTitle>
            <CardDescription>Configure your business information</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input 
                  value={settings.shop_name}
                  onChange={(e) => setSettings({...settings, shop_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  value={settings.shop_phone}
                  onChange={(e) => setSettings({...settings, shop_phone: e.target.value})}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Physical Address</Label>
                <Input 
                  value={settings.shop_address}
                  onChange={(e) => setSettings({...settings, shop_address: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency Symbol</Label>
                <Input 
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax Number (NTN/GST)</Label>
                <Input 
                  value={settings.tax_number}
                  onChange={(e) => setSettings({...settings, tax_number: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" /> Receipt & Printing
            </CardTitle>
            <CardDescription>Customize the appearance of your sales receipts</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Thermal Printer Name</Label>
              <Input 
                value={settings.thermal_printer}
                onChange={(e) => setSettings({...settings, thermal_printer: e.target.value})}
                placeholder="e.g. Epson-TM-T88"
              />
            </div>
            <div className="space-y-2">
              <Label>Header Note</Label>
              <Input 
                value={settings.receipt_header}
                onChange={(e) => setSettings({...settings, receipt_header: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Footer Message</Label>
              <Input 
                value={settings.receipt_footer}
                onChange={(e) => setSettings({...settings, receipt_footer: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4">
          <Button 
            type="button" 
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 min-w-[150px]"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </form>

      {/* Account Deletion */}
      <div className="mt-16 pt-8 border-t border-red-100">
        <Card className="border border-red-100 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </CardTitle>
            <CardDescription className="text-red-600/70">
              Permanently delete all your business data and profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <Button 
                variant="ghost" 
                className="text-red-600 hover:bg-red-50 hover:text-red-700 p-0 h-auto font-medium"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Business Account...
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-red-800">
                  Are you absolutely sure? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={deleteLoading}
                  >
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
