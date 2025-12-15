// Re-export MSSQL pool for backward compatibility
// All database operations should now use stored procedures via getPool()
export { getPool, closePool } from "./mssql";

// Deprecated: kept for gradual migration, will be removed
// Use getPool() and stored procedures instead
export const pool = null;
export const db = null;
