"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import pb from "@/lib/pb";
import { LogIn, Lock, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AppProfile, getActiveProfile } from "@/lib/profile-client";

export default function LoginPage() {
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
      // Wait briefly for PB to be ready
      const maxRetries = 10;
      for (let i = 0; i < maxRetries; i++) {
        try {
          await pb.health.check();
          break;
        } catch {
          if (i === maxRetries - 1) {
            setError("Server not ready. Please try again.");
            setBooting(false);
            return;
          }
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      if (pb.authStore.isValid) {
        router.replace("/app/dashboard");
        return;
      }

      try {
        // Never call switchProfile here — PocketBase is already running
        // switchProfile restarts PocketBase which loses the admin session
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
      await pb.admins.authWithPassword(profile.adminEmail, password);

      // Manually persist cookie before navigation
      if (typeof document !== "undefined") {
        document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
        localStorage.setItem("pb_admin_email", profile.adminEmail);
        localStorage.setItem("pb_admin_password", password);
      }

      router.replace("/app/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid password");
    } finally {
      setLoading(false);
    }
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading login...</p>
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
            {profile ? `Login to ${profile.shopName}` : "Select a shop from app start"}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {profile && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{profile.shopName}</p>
                <p>{profile.shopPhone || "No phone"}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Password</Label>
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              Back to App Start
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
