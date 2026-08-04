-- =============================================================================
--  AgroLink Ghana — MySQL Database Schema
--  Database: agrolink
--  Focus   : Real-time Users, Products, Subscriptions, and Messages
--  Version : 2.0.0
-- =============================================================================

CREATE DATABASE IF NOT EXISTS agrolink
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agrolink;

-- ─── Safe re-run: drop tables in reverse FK dependency order ──────────────────
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;


-- =============================================================================
-- 1. USERS
--    Stores all accounts: farmers, buyers, and administrators.
-- =============================================================================
CREATE TABLE users (
  id              VARCHAR(64)   NOT NULL,          -- e.g. 'user-1700000000000'
  name            VARCHAR(120)  NOT NULL,
  email           VARCHAR(191)  NOT NULL,
  password        VARCHAR(255)  NOT NULL,          -- bcrypt hash
  role            ENUM('farmer','buyer','admin') NOT NULL DEFAULT 'buyer',
  avatar          TEXT          DEFAULT NULL,      -- URL to avatar image
  bio             TEXT          DEFAULT NULL,
  phone           VARCHAR(30)   DEFAULT NULL,
  location        VARCHAR(150)  DEFAULT NULL,      -- e.g. 'Ashanti Region'
  farm_name       VARCHAR(150)  DEFAULT NULL,      -- farmer display name

  -- Premium plan status
  plan            ENUM('free','starter','business') NOT NULL DEFAULT 'free',
  plan_expires_at DATETIME      DEFAULT NULL,

  -- Verification flags
  verified            TINYINT(1) NOT NULL DEFAULT 0,
  organic_certified   TINYINT(1) NOT NULL DEFAULT 0,

  -- Shop customisation
  shop_theme          VARCHAR(30) DEFAULT NULL,
  shop_banner         TEXT        DEFAULT NULL,
  whatsapp_number     VARCHAR(30) DEFAULT NULL,

  joined      VARCHAR(20)   DEFAULT NULL,          -- e.g. 'Jan 2026'
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE  KEY uq_users_email (email),
  INDEX       idx_users_role (role),
  INDEX       idx_users_plan (plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 2. PRODUCTS
--    Real-time product listings posted by farmers & admins.
-- =============================================================================
CREATE TABLE products (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name             VARCHAR(200)    NOT NULL,
  category         ENUM('Vegetables','Fruits','Grains','Fertilizers',
                        'Machinery','Provisions','Livestock','Processed Foods')
                                   NOT NULL DEFAULT 'Vegetables',
  farm             VARCHAR(150)    DEFAULT NULL,
  owner_email      VARCHAR(191)    NOT NULL,
  seller_avatar    TEXT            DEFAULT NULL,
  location         VARCHAR(150)    DEFAULT NULL,
  phone            VARCHAR(30)     DEFAULT NULL,
  price            DECIMAL(12,2)   NOT NULL,
  unit             VARCHAR(20)     NOT NULL DEFAULT 'kg',
  img              TEXT            DEFAULT NULL,
  badge            VARCHAR(50)     DEFAULT NULL,
  badge_color      VARCHAR(20)     DEFAULT '#E8F5E9',
  badge_text_color VARCHAR(20)     DEFAULT '#2E7D32',
  description      TEXT            DEFAULT NULL,
  stock            VARCHAR(100)    DEFAULT 'In stock',
  stock_qty        INT UNSIGNED    NOT NULL DEFAULT 0,
  rating           DECIMAL(3,2)    NOT NULL DEFAULT 5.00,
  reviews          INT UNSIGNED    NOT NULL DEFAULT 0,
  view_count       INT UNSIGNED    NOT NULL DEFAULT 0,
  status           ENUM('active','inactive','draft') NOT NULL DEFAULT 'active',

  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX     idx_products_owner    (owner_email),
  INDEX     idx_products_category (category),
  INDEX     idx_products_status   (status),
  FULLTEXT  KEY ft_products_search (name, description),
  CONSTRAINT fk_products_owner FOREIGN KEY (owner_email)
    REFERENCES users (email) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 3. SUBSCRIPTIONS
--    Subscription payment history & active plan metadata.
-- =============================================================================
CREATE TABLE subscriptions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_email     VARCHAR(191)    NOT NULL,
  plan           ENUM('free','starter','business') NOT NULL,
  amount_ghs     DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  paystack_ref   VARCHAR(100)    DEFAULT NULL,
  status         ENUM('active','expired','cancelled') NOT NULL DEFAULT 'active',
  paid_at        DATETIME        DEFAULT NULL,
  expires_at     DATETIME        DEFAULT NULL,

  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_subs_user    (user_email),
  INDEX idx_subs_status  (status),
  CONSTRAINT fk_subs_user FOREIGN KEY (user_email)
    REFERENCES users (email) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 4. MESSAGES
--    Real-time direct chat messages between platform users.
-- =============================================================================
CREATE TABLE messages (
  id              VARCHAR(80)   NOT NULL,          -- e.g. 'msg-1700000000000-xyz'
  sender_email    VARCHAR(191)  NOT NULL,
  sender_name     VARCHAR(120)  NOT NULL,
  sender_avatar   TEXT          DEFAULT NULL,
  recipient_email VARCHAR(191)  NOT NULL,
  text            TEXT          NOT NULL,
  time_label      VARCHAR(20)   DEFAULT NULL,
  timestamp_ms    BIGINT UNSIGNED NOT NULL,
  is_read         TINYINT(1)    NOT NULL DEFAULT 0,

  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_messages_sender       (sender_email),
  INDEX idx_messages_recipient    (recipient_email),
  INDEX idx_messages_timestamp    (timestamp_ms),
  INDEX idx_messages_conversation (sender_email, recipient_email),
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_email)
    REFERENCES users (email) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_messages_recipient FOREIGN KEY (recipient_email)
    REFERENCES users (email) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
--  TRIGGERS — Sync subscriptions to user plan status
-- =============================================================================

CREATE TRIGGER trg_sync_user_plan_on_sub_insert
AFTER INSERT ON subscriptions
FOR EACH ROW
  UPDATE users
  SET
    plan            = NEW.plan,
    plan_expires_at = NEW.expires_at
  WHERE email = NEW.user_email
    AND NEW.status = 'active';

CREATE TRIGGER trg_sync_user_plan_on_sub_update
AFTER UPDATE ON subscriptions
FOR EACH ROW
  UPDATE users
  SET
    plan = CASE
             WHEN NEW.status = 'active' THEN NEW.plan
             WHEN NEW.status IN ('expired', 'cancelled') THEN 'free'
             ELSE plan
           END,
    plan_expires_at = CASE
                        WHEN NEW.status = 'active' THEN NEW.expires_at
                        WHEN NEW.status IN ('expired', 'cancelled') THEN NULL
                        ELSE plan_expires_at
                      END
  WHERE email = NEW.user_email;


-- =============================================================================
--  SEED DATA
-- =============================================================================

INSERT INTO users
  (id, name, email, password, role, avatar, bio, phone, location, farm_name, joined)
VALUES
  ('dev-admin-001',
   'AgroLink Admin',
   'classicgenius@dev',
   '$2b$10$e8w.R21f3jB1p2G.7K3Hce9q2Z3e2W0G1F3D5E7H9I0J1K2L3M4N5',
   'admin',
   'https://ui-avatars.com/api/?name=Dev+Admin&background=1a472a&color=fff',
   'AgroLink Platform Administrator',
   '+233 24 000 0000', 'Accra', 'AgroLink Admin HQ', 'Jan 2026'),

  ('farmer-001',
   'James Asante',
   'james.asante@agrolink.gh',
   '$2b$10$e8w.R21f3jB1p2G.7K3Hce9q2Z3e2W0G1F3D5E7H9I0J1K2L3M4N5',
   'farmer',
   'https://ui-avatars.com/api/?name=James+Asante&background=3B823E&color=fff',
   'Cocoa and maize farmer from Ashanti Region.',
   '+233 24 123 4567', 'Ashanti Region', 'Greenfield Farm', 'Jan 2026'),

  ('buyer-001',
   'Accra Fresh Market',
   'accra.fresh@market.gh',
   '$2b$10$e8w.R21f3jB1p2G.7K3Hce9q2Z3e2W0G1F3D5E7H9I0J1K2L3M4N5',
   'buyer',
   'https://ui-avatars.com/api/?name=Accra+Fresh&background=F4C430&color=1C3322',
   'Wholesale buyer for Accra Fresh Market.',
   '+233 20 111 2222', 'Greater Accra', NULL, 'Feb 2026');

INSERT INTO products
  (name, category, farm, owner_email, location, phone,
   price, unit, img, badge, badge_color, badge_text_color,
   description, stock, stock_qty, rating, reviews, status)
VALUES
  ('Fresh Tomatoes',
   'Vegetables', 'Greenfield Farm', 'james.asante@agrolink.gh',
   'Ashanti Region', '+233 24 123 4567',
   15.00, 'kg',
   'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80',
   'VEGETABLES', '#E8F5E9', '#2E7D32',
   'Freshly harvested organic tomatoes from the heart of Ashanti.',
   '500kg available', 500, 4.80, 124, 'active'),

  ('Premium Maize',
   'Grains', 'Greenfield Farm', 'james.asante@agrolink.gh',
   'Northern Region', '+233 55 987 6543',
   10.50, 'kg',
   'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&q=80',
   'GRAINS', '#FFF3E0', '#E65100',
   'High-quality yellow maize, sun-dried and sorted for purity.',
   '2000kg available', 2000, 4.60, 89, 'active');
