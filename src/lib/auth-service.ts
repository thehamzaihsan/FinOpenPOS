export class AuthService {
  async login(email: string, password: string) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        return { data: null, error: data?.error || "Failed to login" };
      }
      return { data: data.data, error: null };
    } catch (error: any) {
      console.error('Login error:', error);
      return { data: null, error: error.message || 'Failed to login' };
    }
  }

  async logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
  }

  async getSession() {
    const res = await fetch("/api/profile", { cache: "no-store" }).catch(() => null);
    if (!res || !res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  }

  async isAdmin() {
    const user: any = await this.getSession();
    if (!user) return false;
    return user.role === 'admin' || user.is_admin === true;
  }

  isAuthenticated() {
    return !!(typeof window !== "undefined" && localStorage.getItem("pos_session"));
  }
}

export const authService = new AuthService();
