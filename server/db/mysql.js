import mysql from 'mysql2/promise';
import { config } from '../config.js';

let pool = null;
let isConnected = false;

/**
 * Initialize MySQL Connection & create agrolink database / tables if not present.
 */
export async function initMySQL() {
  try {
    // 1. Connection without DB selected to ensure database creation
    const tempConn = await mysql.createConnection({
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      password: config.dbPassword,
    });

    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await tempConn.end();

    // 2. Create Connection Pool for agrolink database
    pool = mysql.createPool({
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test connection
    const conn = await pool.getConnection();
    conn.release();

    // 3. Auto-create core tables
    await createTables();

    isConnected = true;
    console.log(`\n🐬 MySQL Database Connected Successfully! (${config.dbUser}@${config.dbHost}:${config.dbPort}/${config.dbName})`);
    return true;
  } catch (err) {
    console.warn(`\n⚠️  MySQL connection failed (${err.message}). Defaulting to JSON file persistence layer.`);
    isConnected = false;
    return false;
  }
}

async function createTables() {
  if (!pool) return;

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(191) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('farmer','buyer','admin') NOT NULL DEFAULT 'buyer',
      avatar TEXT DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      phone VARCHAR(30) DEFAULT NULL,
      location VARCHAR(150) DEFAULT NULL,
      farm_name VARCHAR(150) DEFAULT NULL,
      plan ENUM('free','starter','business') NOT NULL DEFAULT 'free',
      plan_expires_at DATETIME DEFAULT NULL,
      joined VARCHAR(20) DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS products (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(80) NOT NULL DEFAULT 'Vegetables',
      farm VARCHAR(150) DEFAULT NULL,
      owner_email VARCHAR(191) NOT NULL,
      seller_avatar TEXT DEFAULT NULL,
      location VARCHAR(150) DEFAULT NULL,
      phone VARCHAR(30) DEFAULT NULL,
      price DECIMAL(12,2) NOT NULL,
      unit VARCHAR(20) NOT NULL DEFAULT 'kg',
      img TEXT DEFAULT NULL,
      badge VARCHAR(50) DEFAULT NULL,
      badge_color VARCHAR(20) DEFAULT '#E8F5E9',
      badge_text_color VARCHAR(20) DEFAULT '#2E7D32',
      description TEXT DEFAULT NULL,
      stock VARCHAR(100) DEFAULT 'In stock',
      stock_qty INT UNSIGNED NOT NULL DEFAULT 0,
      rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
      reviews INT UNSIGNED NOT NULL DEFAULT 0,
      view_count INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive','draft') NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS subscriptions (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_email VARCHAR(191) NOT NULL,
      plan ENUM('free','starter','business') NOT NULL,
      amount_ghs DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      paystack_ref VARCHAR(100) DEFAULT NULL,
      status ENUM('active','expired','cancelled') NOT NULL DEFAULT 'active',
      paid_at DATETIME DEFAULT NULL,
      expires_at DATETIME DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(80) PRIMARY KEY,
      sender_email VARCHAR(191) NOT NULL,
      sender_name VARCHAR(120) NOT NULL,
      sender_avatar TEXT DEFAULT NULL,
      recipient_email VARCHAR(191) NOT NULL,
      text TEXT NOT NULL,
      time_label VARCHAR(20) DEFAULT NULL,
      timestamp_ms BIGINT UNSIGNED NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
  ];

  for (const query of queries) {
    await pool.query(query);
  }
}

export function getPool() {
  return pool;
}

export function isMySQLActive() {
  return isConnected && pool !== null;
}
