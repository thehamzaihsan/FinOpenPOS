// This file is only loaded at runtime on the server
// DO NOT import this in client code

declare global {
  var _dbInstance: any;
}

export async function getDb() {
  if (typeof globalThis._dbInstance !== "undefined") {
    return globalThis._dbInstance;
  }

  try {
    const { DatabaseSync } = await import("node:sqlite");
    const { existsSync, mkdirSync } = await import("node:fs");
    const { dirname, join } = await import("node:path");

    const DB_PATH = join(process.cwd(), "data", "finopenpos.db");
    
    if (!existsSync(dirname(DB_PATH))) {
      mkdirSync(dirname(DB_PATH), { recursive: true });
    }

    globalThis._dbInstance = new DatabaseSync(DB_PATH);
    return globalThis._dbInstance;
  } catch (error) {
    console.error("Failed to initialize SQLite:", error);
    throw error;
  }
}
