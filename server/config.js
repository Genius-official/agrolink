import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env from the server directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

export const config = {
  port: parseInt(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'agrolink_fallback_secret_not_for_production',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim()),

  // External APIs
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
  gnewsApiKey: process.env.GNEWS_API_KEY || '',

  // MySQL Database Config
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseInt(process.env.DB_PORT) || 3306,
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'agrolink',

  // Helpers
  isDev: (process.env.NODE_ENV || 'development') === 'development',
};
