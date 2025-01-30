'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
export async function login(formData: FormData) {
  const supabase = createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.log(error);
    return { error: error.message }; // Return the error message
  }

  revalidatePath("/admin", "layout");
  redirect("/admin"); // Redirect on success
}

export async function logout() {
  const supabase = createClient();

  // Sign out the user
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error);
    return { error: error.message }; // Return the error message
  }

  // Revalidate paths (if needed)
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");

  // Redirect to the login page or home page
  redirect("/login"); // Change this to your desired redirect path
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.log(error)
    redirect('/error')
  }

  revalidatePath('/admin', 'layout')
  redirect('/admin')
}

export async function generateExampleData(user_uid: string) {
  const supabase = createClient()
}