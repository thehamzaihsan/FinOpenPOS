"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AppProfile, getActiveProfile } from "@/lib/profile-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booting, setBooting] = useState(true);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const boot = async () => {
      if (searchParams.get("logout") === "true") {
        localStorage.removeItem("pos_session");
      }

      const savedSession = localStorage.getItem("pos_session");
      if (savedSession) {
        try {
          const res = await fetch("/api/profile", {
            headers: { "Authorization": `Bearer ${savedSession}` }
          });
          if (res.ok) {
            router.replace("/app/dashboard");
            return;
          }
        } catch (e) {
          localStorage.removeItem("pos_session");
        }
      }

      try {
        const active = await getActiveProfile();
        setProfile(active);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load selected shop.");
      } finally {
        setBooting(false);
      }
    };

    boot();
  }, [router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!profile) {
      setError("Please select a shop profile first.");
      return;
    }

    if (!password) {
      setError("Please enter password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.adminEmail,
          password,
          profileId: profile.id
        })
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        throw new Error("Server error — please try again");
      }
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Invalid credentials");
      }

      localStorage.setItem("pos_session", json.sessionId);
      router.replace("/app/dashboard");
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Invalid credentials or server error");
    } finally {
      setLoading(false);
    }
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading shop login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="border-none shadow-xl max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">Welcome Back</CardTitle>
          <CardDescription>
            {profile ? `Login to ${profile.shopName}` : "Shop profile not selected"}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {profile && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{profile.shopName}</p>
                <p>{profile.shopPhone || "No phone contact"}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Admin Password</Label>
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                placeholder="Enter password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
              disabled={loading || !profile}
            >
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/")}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Change Shop
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading shop login...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
