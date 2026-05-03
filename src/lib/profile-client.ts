export interface AppProfile {
  id: string;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  adminEmail: string;
  createdAt: number;
}

interface CreateProfilePayload {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  password: string;
}

function isTauriRuntime(): boolean {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window;
}

async function invokeTauri<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriRuntime()) {
    throw new Error("Tauri runtime is not available");
  }

  const core = await import("@tauri-apps/api/core");
  return core.invoke<T>(command, args);
}

export async function listProfiles(): Promise<AppProfile[]> {
  try {
    return await invokeTauri<AppProfile[]>("list_profiles");
  } catch {
    return [];
  }
}

export async function getActiveProfile(): Promise<AppProfile | null> {
  try {
    const profile = await invokeTauri<AppProfile | null>("get_active_profile");
    return profile ?? null;
  } catch {
    return null;
  }
}

export async function createProfile(payload: CreateProfilePayload): Promise<AppProfile> {
  return invokeTauri<AppProfile>("create_profile", { input: payload });
}

export async function switchProfile(profileId: string): Promise<AppProfile> {
  return invokeTauri<AppProfile>("switch_profile", { profileId });
}

export async function ensureProfileSuperuser(profileId: string, password: string): Promise<void> {
  await invokeTauri<void>("ensure_profile_superuser", { profileId, password });
}
