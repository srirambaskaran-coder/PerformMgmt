import { getPool } from '../mssql';
import sql from 'mssql';
import { logger } from '../utils/logger';

export class BaseRepository {
  protected async executeQuery<T>(query: string, params?: any): Promise<T[]> {
    try {
      const pool = await getPool();
      const request = pool.request();

      // Add parameters if provided
      if (params) {
        Object.keys(params).forEach(key => {
          request.input(key, params[key]);
        });
      }

      const result = await request.query(query);
      return result.recordset as T[];
    } catch (error) {
      logger.error('Database query error', { query, error });
      throw error;
    }
  }

  protected async executeProcedure<T>(
    procedureName: string,
    params?: Record<string, any>
  ): Promise<T[]> {
    try {
      const pool = await getPool();
      const request = pool.request();

      // Add parameters if provided
      if (params) {
        Object.keys(params).forEach(key => {
          request.input(key, params[key]);
        });
      }

      const result = await request.execute(procedureName);
      return result.recordset as T[];
    } catch (error) {
      logger.error('Stored procedure error', { procedureName, error });
      throw error;
    }
  }

  protected async executeScalar<T>(query: string, params?: any): Promise<T | null> {
    const result = await this.executeQuery<{ value: T }>(query, params);
    return result.length > 0 ? result[0].value : null;
  }
}
