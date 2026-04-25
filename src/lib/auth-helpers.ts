import pb from './pb';

export async function getSession() {
  return pb.authStore.model;
}

export async function getUser() {
  return pb.authStore.model;
}

export async function isAuthenticated() {
  return pb.authStore.isValid;
}

export async function isAdmin() {
  const user = pb.authStore.model;
  if (!user) return false;
  
  // In PocketBase, we can check for is_admin or role fields
  return user.role === 'admin' || user.is_admin === true;
}
