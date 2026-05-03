"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppProfile, getActiveProfile, listProfiles, switchProfile } from "@/lib/profile-client";
import { Loader2, LogIn, PlusCircle, Store } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<AppProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const boot = async () => {
      // Check SQLite session for single-user feel
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

      const [allProfiles, activeProfile] = await Promise.all([
        listProfiles().catch(() => []),
        getActiveProfile().catch(() => null),
      ]);

      setProfiles(allProfiles);

      if (allProfiles.length > 0) {
        const preferred = activeProfile?.id || allProfiles[0].id;
        setSelectedProfileId(preferred);
        
        if (!activeProfile || activeProfile.id !== preferred) {
            await switchProfile(preferred);
            await new Promise((r) => setTimeout(r, 500));
        }
        
        // Go to login if not authenticated
        router.push(`/auth/login?profileId=${encodeURIComponent(preferred)}`);
        return;
      } else {
        router.push("/auth/onboarding");
        return;
      }
    };

    boot();
  }, [router]);

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId) || null,
    [profiles, selectedProfileId]
  );

  const handleContinueLogin = async () => {
    if (!selectedProfileId) {
      setError("Please select a shop profile.");
      return;
    }

    setError("");
    setContinuing(true);
    try {
      const active = await getActiveProfile().catch(() => null);
      if (!active || active.id !== selectedProfileId) {
        await switchProfile(selectedProfileId);
        await new Promise((r) => setTimeout(r, 1000));
      }
      router.push(`/auth/login?profileId=${encodeURIComponent(selectedProfileId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load selected profile.");
    } finally {
      setContinuing(false);
    }
  };

  if (loading && !continuing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading app start...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white border border-gray-200 shadow-lg p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">FinOpenPOS</h1>
          <p className="text-sm text-gray-600">Select a shop profile to login, or create a new shop.</p>
        </div>

        {profiles.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {profiles.map((profile) => {
              const isSelected = profile.id === selectedProfileId;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={`w-full text-left p-4 border transition-colors ${
                    isSelected
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Store className={`w-5 h-5 ${isSelected ? "text-blue-700" : "text-gray-500"}`} />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{profile.shopName}</p>
                      <p className="text-sm text-gray-600 truncate">{profile.shopPhone || "No phone"}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
            No shop profiles found. Create your first shop to begin.
          </div>
        )}

        {selectedProfile && (
          <div className="bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700">
            Selected: <span className="font-medium">{selectedProfile.shopName}</span>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleContinueLogin}
            disabled={!selectedProfileId || continuing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {continuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Login
          </button>
          <button
            type="button"
            onClick={() => router.push("/auth/onboarding")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-800 hover:bg-gray-50"
          >
            <PlusCircle className="w-4 h-4" />
            Signup
          </button>
        </div>
      </div>
    </div>
  );
}
