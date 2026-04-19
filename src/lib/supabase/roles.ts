import { createClient } from "./server";

// Get all roles for a user
export async function getUserRoles(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
  
  return data.map(item => item.role);
}

// Check if user has a specific role
export async function userHasRole(userId: string, role: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_roles')
    .select()
    .eq('user_id', userId)
    .eq('role', role)
    .single();
  
  return !!data && !error;
}

// Add a role to a user
export async function addUserRole(userId: string, role: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role });
  
  if (error) console.error('Error adding role:', error);
  return !error;
}

// Remove a role from a user
export async function removeUserRole(userId: string, role: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role);
  
  if (error) console.error('Error removing role:', error);
  return !error;
}