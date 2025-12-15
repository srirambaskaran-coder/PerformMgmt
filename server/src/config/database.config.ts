// Database Configuration for different environments
import type { config as MSSQLConfig } from 'mssql';
import { getEnvironment, type Environment } from './cors.config';

interface DatabaseConfig {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
    enableArithAbort: boolean;
    connectionTimeout: number;
    requestTimeout: number;
  };
}

// Database configurations for each environment
const databaseConfigs: Record<Environment, DatabaseConfig> = {
  development: {
    server: process.env.DB_SERVER_DEV || 'localhost',
    port: parseInt(process.env.DB_PORT_DEV || '1433'),
    database: process.env.DB_DATABASE_DEV || 'PMS_DB_DEV',
    user: process.env.DB_USER_DEV || 'pms_app_user',
    password: process.env.DB_PASSWORD_DEV || '',
    options: {
      encrypt: process.env.DB_ENCRYPT_DEV === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE_DEV === 'true',
      enableArithAbort: true,
      connectionTimeout: 30000,
      requestTimeout: 30000,
    },
  },
  qc: {
    server: process.env.DB_SERVER_QC || 'localhost',
    port: parseInt(process.env.DB_PORT_QC || '1433'),
    database: process.env.DB_DATABASE_QC || 'PMS_DB_QC',
    user: process.env.DB_USER_QC || 'pms_app_user',
    password: process.env.DB_PASSWORD_QC || '',
    options: {
      encrypt: process.env.DB_ENCRYPT_QC === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE_QC === 'true',
      enableArithAbort: true,
      connectionTimeout: 30000,
      requestTimeout: 30000,
    },
  },
  production: {
    server: process.env.DB_SERVER_PROD || 'localhost',
    port: parseInt(process.env.DB_PORT_PROD || '1433'),
    database: process.env.DB_DATABASE_PROD || 'PMS_DB',
    user: process.env.DB_USER_PROD || 'pms_app_user',
    password: process.env.DB_PASSWORD_PROD || '',
    options: {
      encrypt: process.env.DB_ENCRYPT_PROD === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE_PROD === 'false',
      enableArithAbort: true,
      connectionTimeout: 30000,
      requestTimeout: 30000,
    },
  },
};

export function getDatabaseConfig(): MSSQLConfig {
  const env = getEnvironment();
  const config = databaseConfigs[env];

  console.log(`🗄️  Database Configuration: ${env.toUpperCase()}`);
  console.log(`   Server: ${config.server}:${config.port}`);
  console.log(`   Database: ${config.database}`);

  return config as MSSQLConfig;
}

export function getConnectionString(): string {
  const env = getEnvironment();
  const config = databaseConfigs[env];
  
  return `mssql://${config.user}:${encodeURIComponent(config.password)}@${config.server}:${config.port}/${config.database}`;
}
