export async function getSession() {
  const res = await fetch("/api/profile", { cache: "no-store" }).catch(() => null);
  if (!res || !res.ok) return null;
  const json = await res.json();
  return json?.data || null;
}

export async function getUser() {
  return getSession();
}

export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}

export async function isAdmin() {
  const user: any = await getSession();
  if (!user) return false;
  return user.role === 'admin' || user.is_admin === true;
}
