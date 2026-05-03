"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Store, Phone, MapPin, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createProfile } from "@/lib/profile-client";

interface ShopSetup {
  shop_name: string;
  shop_phone: string;
  shop_address: string;
  receipt_header: string;
  receipt_footer: string;
  thermal_printer: string;
  tax_number: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shop, setShop] = useState<ShopSetup>({
    shop_name: "",
    shop_phone: "",
    shop_address: "",
    receipt_header: "Thank you for shopping with us!",
    receipt_footer: "Please come again!",
    thermal_printer: "",
    tax_number: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const boot = async () => {
      // Check for SQLite session
      const session = localStorage.getItem("pos_session");
      if (session) {
        try {
          const res = await fetch("/api/profile", {
            headers: { "Authorization": `Bearer ${session}` }
          });
          if (res.ok) {
            router.replace("/app/dashboard");
          }
        } catch (e) {
          localStorage.removeItem("pos_session");
        }
      }
    };
    boot();
  }, [router]);

  const handleSignup = async () => {
    setError("");
    if (!shop.shop_name) {
      setError("Shop name is required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const profile = await createProfile({
        shopName: shop.shop_name,
        shopPhone: shop.shop_phone,
        shopAddress: shop.shop_address,
        password: password,
      });
      
      // Note: createProfile in Rust handles SQLite admin provisioning via create_profile
      // redirected to login to establish frontend session
      router.push(`/auth/login?profileId=${encodeURIComponent(profile.id)}`);
    } catch (err: any) {
      setError(err.message || "Failed to create shop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="border-none shadow-xl max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">Create Your Shop</CardTitle>
          <CardDescription>
            Set up your shop in just a few steps
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label><Store className="w-4 h-4 inline mr-1" /> Shop Name *</Label>
              <Input
                placeholder="My Shop"
                value={shop.shop_name}
                onChange={(e) => setShop({ ...shop, shop_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label><Phone className="w-4 h-4 inline mr-1" /> Phone</Label>
              <Input
                placeholder="+92 300 1234567"
                value={shop.shop_phone}
                onChange={(e) => setShop({ ...shop, shop_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label><MapPin className="w-4 h-4 inline mr-1" /> Address</Label>
            <Input
              placeholder="Shop Address"
              value={shop.shop_address}
              onChange={(e) => setShop({ ...shop, shop_address: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Admin Password *</Label>
              <Input
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password *</Label>
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label><Printer className="w-4 h-4 inline mr-1" /> Thermal Printer (optional)</Label>
            <Input
              placeholder="Epson TM-T88"
              value={shop.thermal_printer}
              onChange={(e) => setShop({ ...shop, thermal_printer: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Receipt Header</Label>
              <Input
                placeholder="Thank you!"
                value={shop.receipt_header}
                onChange={(e) => setShop({ ...shop, receipt_header: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Receipt Footer</Label>
              <Input
                placeholder="Please come again!"
                value={shop.receipt_footer}
                onChange={(e) => setShop({ ...shop, receipt_footer: e.target.value })}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
            onClick={handleSignup}
            disabled={loading || !shop.shop_name || !password}
          >
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            {loading ? "Creating Shop..." : "Create Shop"}
          </Button>
          <p className="text-center text-sm text-gray-600">
            Already have an account? <a href="/auth/login" className="text-blue-600 font-medium">Login</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
