"use server";

import pb from "@/lib/pb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function logout(): Promise<{ error?: string }> {
  try {
    pb.authStore.clear();
    revalidatePath("/", "layout");
    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}
