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

  // External APIs & Email
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
  gnewsApiKey: process.env.GNEWS_API_KEY || '',

  // Email delivery — supports Gmail SMTP, Brevo, Resend, SendGrid
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '465'),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.EMAIL_FROM || process.env.SMTP_USER || '',
  brevoApiKey: process.env.BREVO_API_KEY || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',

  // MySQL Database Config (Supports Railway & Local MySQL)
  dbUrl: process.env.MYSQL_URL || process.env.MYSQLURL || process.env.DATABASE_URL || '',
  dbHost: process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  dbPort: parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DB_PORT || '3306'),
  dbUser: process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USER || 'root',
  dbPassword: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  dbName: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || 'agrolink',
  dbSsl: process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true',

  // Helpers
  isDev: (process.env.NODE_ENV || 'development') === 'development',
};
