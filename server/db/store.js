import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, isMySQLActive } from './mysql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All JSON data files live here
export const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Per-collection write queues prevent concurrent file corruption
const queues = {};

// ─── Internal helpers ──────────────────────────────────────────────────────────

function readFile(name) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function enqueueWrite(name, data) {
  if (!queues[name]) queues[name] = Promise.resolve();
  queues[name] = queues[name].then(
    () =>
      new Promise((resolve, reject) => {
        const filePath = path.join(DATA_DIR, `${name}.json`);
        const tmp = filePath + '.tmp';
        fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8', err => {
          if (err) return reject(err);
          fs.rename(tmp, filePath, err2 => {
            if (err2) reject(err2);
            else resolve();
          });
        });
      })
  );
  return queues[name];
}

// ─── MySQL Mapping Helpers ───────────────────────────────────────────────────

async function insertMySQL(table, record) {
  if (!isMySQLActive()) return;
  const pool = getPool();
  try {
    if (table === 'users') {
      const pwd = record.password || '$2a$10$dummyHashForUserUpdatesWithoutPasswordChange';
      await pool.query(
        `INSERT INTO users (id, name, email, password, role, avatar, bio, phone, location, farm_name, plan, plan_expires_at, joined)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           name = VALUES(name),
           role = VALUES(role),
           avatar = COALESCE(VALUES(avatar), avatar),
           bio = COALESCE(VALUES(bio), bio),
           phone = COALESCE(VALUES(phone), phone),
           location = COALESCE(VALUES(location), location),
           farm_name = COALESCE(VALUES(farm_name), farm_name),
           plan = VALUES(plan),
           plan_expires_at = VALUES(plan_expires_at),
           password = IF(VALUES(password) LIKE '$2a$10$dummyHash%', password, VALUES(password));`,
        [
          record.id,
          record.name || 'User',
          record.email,
          pwd,
          record.role || 'buyer',
          record.avatar || null,
          record.bio || null,
          record.phone || null,
          record.location || null,
          record.farmName || record.farm_name || null,
          record.plan || 'free',
          record.planExpiresAt || record.plan_expires_at || null,
          record.joined || null,
        ]
      );
    } else if (table === 'products') {
      await pool.query(
        `INSERT INTO products (id, name, category, farm, owner_email, seller_avatar, location, phone, price, unit, img, badge, badge_color, badge_text_color, description, stock, stock_qty, rating, reviews, view_count, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock=VALUES(stock), status=VALUES(status);`,
        [
          record.id,
          record.name,
          record.category || 'Vegetables',
          record.farm || null,
          record.ownerEmail || record.owner_email,
          record.sellerAvatar || record.seller_avatar || null,
          record.location || null,
          record.phone || null,
          record.price || 0,
          record.unit || 'kg',
          record.img || null,
          record.badge || null,
          record.badgeColor || record.badge_color || '#E8F5E9',
          record.badgeTextColor || record.badge_text_color || '#2E7D32',
          record.description || null,
          record.stock || 'In stock',
          record.stockQty || record.stock_qty || 0,
          record.rating || 5.0,
          record.reviews || 0,
          record.viewCount || record.view_count || 0,
          record.status || 'active',
        ]
      );
    } else if (table === 'subscriptions') {
      await pool.query(
        `INSERT INTO subscriptions (id, user_email, plan, amount_ghs, paystack_ref, status, paid_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          record.id,
          record.userEmail || record.user_email,
          record.plan,
          record.amountGhs || record.amount_ghs || 0,
          record.paystackRef || record.paystack_ref || null,
          record.status || 'active',
          record.paidAt || record.paid_at || new Date(),
          record.expiresAt || record.expires_at || null,
        ]
      );
    } else if (table === 'messages') {
      await pool.query(
        `INSERT INTO messages (id, sender_email, sender_name, sender_avatar, recipient_email, text, time_label, timestamp_ms, is_read)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          record.id,
          record.senderEmail || record.sender_email,
          record.senderName || record.sender_name,
          record.senderAvatar || record.sender_avatar || null,
          record.recipientEmail || record.recipient_email,
          record.text,
          record.time || record.time_label || null,
          record.timestamp || record.timestamp_ms || Date.now(),
          record.isRead || record.is_read || 0,
        ]
      );
    }
  } catch (err) {
    console.warn(`[MySQL Write Error] Table ${table}:`, err.message);
  }
}

// ─── Collection factory ────────────────────────────────────────────────────────

/**
 * Creates a CRUD interface bound to a named JSON file + MySQL backend.
 * @param {string} name - Collection name (used as filename without .json)
 */
export function collection(name) {
  return {
    /** Return all records, optionally filtered. */
    all(filter) {
      const data = readFile(name);
      return filter ? data.filter(filter) : [...data];
    },

    /** Return first matching record or null. */
    one(filter) {
      return readFile(name).find(filter) ?? null;
    },

    /** Return record by its `id` field (string-coerced comparison). */
    byId(id) {
      return readFile(name).find(r => String(r.id) === String(id)) ?? null;
    },

    /** Count records, optionally filtered. */
    count(filter) {
      const data = readFile(name);
      return filter ? data.filter(filter).length : data.length;
    },

    /** Insert a single record. */
    async insert(record) {
      const data = readFile(name);
      data.push(record);
      await enqueueWrite(name, data);
      insertMySQL(name, record);
      return record;
    },

    /** Insert multiple records at once. */
    async insertMany(records) {
      const data = readFile(name);
      data.push(...records);
      await enqueueWrite(name, data);
      for (const rec of records) {
        insertMySQL(name, rec);
      }
      return records;
    },

    /** Update record by id. Returns updated record or null if not found. */
    async updateById(id, patch) {
      const data = readFile(name);
      const i = data.findIndex(r => String(r.id) === String(id));
      if (i < 0) return null;
      data[i] = { ...data[i], ...patch, updatedAt: new Date().toISOString() };
      await enqueueWrite(name, data);
      insertMySQL(name, data[i]);
      return data[i];
    },

    /** Update all records matching a filter. Returns updated records array. */
    async updateWhere(filter, patch) {
      const data = readFile(name);
      let updated = [];
      for (let i = 0; i < data.length; i++) {
        if (filter(data[i])) {
          data[i] = { ...data[i], ...patch, updatedAt: new Date().toISOString() };
          updated.push(data[i]);
          insertMySQL(name, data[i]);
        }
      }
      await enqueueWrite(name, data);
      return updated;
    },

    /** Delete record by id. Returns true if deleted, false if not found. */
    async removeById(id) {
      const data = readFile(name);
      const i = data.findIndex(r => String(r.id) === String(id));
      if (i < 0) return false;
      data.splice(i, 1);
      await enqueueWrite(name, data);
      if (isMySQLActive()) {
        getPool().query(`DELETE FROM \`${name}\` WHERE id = ?;`, [id]).catch(() => {});
      }
      return true;
    },

    /** Delete all records matching a predicate. Returns count deleted. */
    async removeWhere(filter) {
      const data = readFile(name);
      const kept = data.filter(r => !filter(r));
      const count = data.length - kept.length;
      await enqueueWrite(name, kept);
      return count;
    },

    /** Seed collection only if it is currently empty. Returns true if seeded. */
    async seed(records) {
      if (readFile(name).length > 0) return false;
      await enqueueWrite(name, records);
      for (const rec of records) {
        insertMySQL(name, rec);
      }
      console.log(`  ✓ Seeded ${records.length} records into [${name}]`);
      return true;
    },

    /** Completely overwrite collection contents. */
    async overwrite(records) {
      await enqueueWrite(name, records);
      return records;
    },

    /** Clear entire collection. */
    async clear() {
      await enqueueWrite(name, []);
    },
  };
}

// ─── Named collection exports ──────────────────────────────────────────────────

export const db = {
  users:         collection('users'),
  products:      collection('products'),
  subscriptions: collection('subscriptions'),
  messages:      collection('messages'),
  orders:        collection('orders'),
  bulkOrders:    collection('bulk_orders'),
  notifications: collection('notifications'),
  carts:         collection('carts'),
};
