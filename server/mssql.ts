import "dotenv/config";
import sql from "mssql";
import { getDatabaseConfig } from "./config/database.config";

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    // Get environment-specific database configuration
    const config = getDatabaseConfig();

    poolPromise = new sql.ConnectionPool({
      ...config,
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    }).connect();
  }
  return poolPromise;
}

export async function closePool() {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = null;
  }
}
