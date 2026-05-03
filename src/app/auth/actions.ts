"use server";

import { revalidatePath } from "next/cache";

export async function logout(): Promise<{ error?: string }> {
  try {
    // Session cookie cleanup is handled client-side via /api/auth/logout.
    revalidatePath("/", "layout");
    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}
