import pb from './pb';

export class AuthService {
  async login(email: string, password: string) {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      return { data: authData, error: null };
    } catch (error: any) {
      console.error('Login error:', error);
      return { data: null, error: error.message || 'Failed to login' };
    }
  }

  async logout() {
    pb.authStore.clear();
    // In Tauri, we might want to do additional cleanup
  }

  async getSession() {
    return pb.authStore.model;
  }

  async isAdmin() {
    const user = pb.authStore.model;
    if (!user) return false;
    
    // Check if user has admin role or is in admin_users collection
    // In PocketBase, you can have a field 'role' on users
    return user.role === 'admin' || user.is_admin === true;
  }

  isAuthenticated() {
    return pb.authStore.isValid;
  }
}

export const authService = new AuthService();
