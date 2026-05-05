// SQLite support for local-only deployments
// This is a stub that allows the build to succeed
// At runtime, dynamically import when needed

export function getDb() {
  throw new Error("SQLite not initialized");
}

export function transaction(fn: () => void) {
  throw new Error("SQLite not initialized");
}

export function loginUser(email: string, password: string) {
  throw new Error("SQLite not initialized");
}

export function upsertUser(profileId: string, email: string, password: string) {
  throw new Error("SQLite not initialized");
}

export function deleteSession(sessionId: string) {
  throw new Error("SQLite not initialized");
}
