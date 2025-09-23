const { Pool } = require('pg');

// PostgreSQL connection for production (Supabase/Railway)
const createPostgresPool = () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
  }

  const useSsl = (() => {
    // Supabase poolers require SSL; also force SSL if URL contains 'supabase.com'
    if (process.env.FORCE_PG_SSL === '1') return { rejectUnauthorized: false };
    if (connectionString.includes('supabase.com')) return { rejectUnauthorized: false };
    return process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
  })();

  const pool = new Pool({
    connectionString,
    ssl: useSsl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return pool;
};

// Convert SQLite schema to PostgreSQL
const initPostgresDatabase = async (pool) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Customers table (PostgreSQL version)
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        webshop_id INTEGER NOT NULL DEFAULT 1,
        email VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'Nederland',
        registration_ip VARCHAR(45),
        last_login_ip VARCHAR(45),
        user_agent TEXT,
        referrer_source VARCHAR(255),
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(100),
        date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        last_order_date TIMESTAMP,
        total_orders INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0.00,
        lifetime_value DECIMAL(10,2) DEFAULT 0.00,
        customer_status VARCHAR(20) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        webshop_id INTEGER NOT NULL DEFAULT 1,
        customer_id INTEGER REFERENCES customers(id),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'EUR',
        payment_method VARCHAR(50),
        payment_status VARCHAR(20) DEFAULT 'pending',
        shipping_address TEXT,
        billing_address TEXT,
        shipping_method VARCHAR(100),
        shipping_cost DECIMAL(10,2) DEFAULT 0.00,
        tax_amount DECIMAL(10,2) DEFAULT 0.00,
        discount_amount DECIMAL(10,2) DEFAULT 0.00,
        tracking_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        webshop_id INTEGER NOT NULL DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE,
        description TEXT,
        category VARCHAR(100),
        purchase_price DECIMAL(10,2) NOT NULL,
        selling_price DECIMAL(10,2) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        supplier VARCHAR(255),
        supplier_sku VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Order Items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_sku VARCHAR(100),
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // API Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_settings (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(50) NOT NULL,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER,
        UNIQUE(platform, setting_key)
      )
    `);

    // Add indexes for performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');

    await client.query('COMMIT');
    console.log('✅ PostgreSQL database initialized successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createPostgresPool,
  initPostgresDatabase
};
