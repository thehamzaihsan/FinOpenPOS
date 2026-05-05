// SQLite support for local-only deployments
// This is a stub that allows the build to succeed
// At runtime, dynamically import when needed

export function getDb(): any {
  throw new Error("SQLite not initialized");
}

export function transaction(fn: () => void): void {
  throw new Error("SQLite not initialized");
}

export function loginUser(email: string, password: string): any {
  return null;
}

export function upsertUser(profileId: string, email: string, password: string): any {
  return null;
}

export function deleteSession(sessionId: string): void {
  throw new Error("SQLite not initialized");
}

export function getSession(sessionId: string): any {
  return null;
}
