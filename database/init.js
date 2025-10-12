const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './database/crm.db';

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database verbinding mislukt:', err.message);
  } else {
    console.log('✅ Verbonden met SQLite database');
  }
});

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Customers table (now multi-tenant with tracking)
      db.run(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          webshop_id INTEGER NOT NULL DEFAULT 1,
          email VARCHAR(255) NOT NULL,
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
          date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          last_order_date DATETIME,
          total_orders INTEGER DEFAULT 0,
          total_spent DECIMAL(10,2) DEFAULT 0.00,
          lifetime_value DECIMAL(10,2) DEFAULT 0.00,
          customer_status VARCHAR(20) DEFAULT 'active',
          tags TEXT,
          notes TEXT,
          FOREIGN KEY (webshop_id) REFERENCES webshops (id),
          UNIQUE(webshop_id, email)
        )
      `);

      // Orders table
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          order_number VARCHAR(50) UNIQUE NOT NULL,
          order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(20) DEFAULT 'pending',
          total_amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'EUR',
          payment_method VARCHAR(50),
          shipping_address TEXT,
          tracking_number VARCHAR(100),
          notes TEXT,
          FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
      `);

      // Order items table
      db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_name VARCHAR(255) NOT NULL,
          product_sku VARCHAR(100),
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders (id)
        )
      `);

      // Customer interactions table
      db.run(`
        CREATE TABLE IF NOT EXISTS customer_interactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          interaction_type VARCHAR(50) NOT NULL,
          subject VARCHAR(255),
          description TEXT,
          date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100),
          FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
      `);

      // Users table for authentication
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          role VARCHAR(20) DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          is_active BOOLEAN DEFAULT 1
        )
      `);

      // Webshops/Tenants table
      db.run(`
        CREATE TABLE IF NOT EXISTS webshops (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) NOT NULL,
          domain VARCHAR(255),
          description TEXT,
          owner_id INTEGER NOT NULL,
          subscription_plan VARCHAR(50) DEFAULT 'basic',
          settings TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (owner_id) REFERENCES users (id)
        )
      `);

      // User webshop access table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_webshop_access (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          webshop_id INTEGER NOT NULL,
          role VARCHAR(50) DEFAULT 'viewer',
          granted_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (webshop_id) REFERENCES webshops (id),
          FOREIGN KEY (granted_by) REFERENCES users (id),
          UNIQUE(user_id, webshop_id)
        )
      `);

      // API integrations table
      db.run(`
        CREATE TABLE IF NOT EXISTS api_integrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          webshop_id INTEGER NOT NULL,
          integration_type VARCHAR(100) NOT NULL,
          platform_name VARCHAR(100) NOT NULL,
          api_key_encrypted TEXT,
          api_secret_encrypted TEXT,
          webhook_url TEXT,
          settings TEXT,
          status VARCHAR(50) DEFAULT 'inactive',
          last_sync DATETIME,
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (webshop_id) REFERENCES webshops (id),
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // API sync logs table
      db.run(`
        CREATE TABLE IF NOT EXISTS api_sync_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          integration_id INTEGER NOT NULL,
          sync_type VARCHAR(100) NOT NULL,
          status VARCHAR(50) NOT NULL,
          records_processed INTEGER DEFAULT 0,
          errors_count INTEGER DEFAULT 0,
          error_details TEXT,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY (integration_id) REFERENCES api_integrations (id)
        )
      `);

      // Subscription plans table
      db.run(`
        CREATE TABLE IF NOT EXISTS subscription_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          price_monthly DECIMAL(10,2) NOT NULL,
          price_yearly DECIMAL(10,2),
          max_customers INTEGER DEFAULT -1,
          max_orders INTEGER DEFAULT -1,
          max_products INTEGER DEFAULT -1,
          max_webshops INTEGER DEFAULT 1,
          features TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Subscriptions table
      db.run(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          webshop_id INTEGER NOT NULL,
          plan_id INTEGER NOT NULL,
          status VARCHAR(50) DEFAULT 'active',
          billing_cycle VARCHAR(20) DEFAULT 'monthly',
          current_period_start DATE NOT NULL,
          current_period_end DATE NOT NULL,
          cancel_at_period_end BOOLEAN DEFAULT 0,
          trial_end DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (webshop_id) REFERENCES webshops (id),
          FOREIGN KEY (plan_id) REFERENCES subscription_plans (id)
        )
      `);

      // Payment providers table
      db.run(`
        CREATE TABLE IF NOT EXISTS payment_providers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          webshop_id INTEGER NOT NULL,
          provider_name VARCHAR(100) NOT NULL,
          provider_type VARCHAR(50) NOT NULL,
          api_key_encrypted TEXT,
          webhook_secret_encrypted TEXT,
          settings TEXT,
          is_active BOOLEAN DEFAULT 1,
          test_mode BOOLEAN DEFAULT 1,
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (webshop_id) REFERENCES webshops (id),
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Payments/Transactions table
      db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          webshop_id INTEGER NOT NULL,
          order_id INTEGER,
          subscription_id INTEGER,
          provider_id INTEGER NOT NULL,
          provider_payment_id VARCHAR(255),
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'EUR',
          status VARCHAR(50) DEFAULT 'pending',
          payment_method VARCHAR(100),
          customer_email VARCHAR(255),
          description TEXT,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (webshop_id) REFERENCES webshops (id),
          FOREIGN KEY (order_id) REFERENCES orders (id),
          FOREIGN KEY (subscription_id) REFERENCES subscriptions (id),
          FOREIGN KEY (provider_id) REFERENCES payment_providers (id)
        )
      `);

      // SaaS revenue tracking
      db.run(`
        CREATE TABLE IF NOT EXISTS saas_revenue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date DATE NOT NULL,
          mrr DECIMAL(10,2) DEFAULT 0.00,
          arr DECIMAL(10,2) DEFAULT 0.00,
          new_customers INTEGER DEFAULT 0,
          churned_customers INTEGER DEFAULT 0,
          total_customers INTEGER DEFAULT 0,
          avg_revenue_per_user DECIMAL(10,2) DEFAULT 0.00,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Email logs table
      db.run(`
        CREATE TABLE IF NOT EXISTS email_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          subject VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          template VARCHAR(50) DEFAULT 'default',
          sent_by INTEGER NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id),
          FOREIGN KEY (sent_by) REFERENCES users (id)
        )
      `);

      // API Settings table
      db.run(`
        CREATE TABLE IF NOT EXISTS api_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          platform VARCHAR(50) NOT NULL,
          setting_key VARCHAR(100) NOT NULL,
          setting_value TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_by INTEGER,
          updated_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id),
          FOREIGN KEY (updated_by) REFERENCES users (id),
          UNIQUE(platform, setting_key)
        )
      `);

      // Ad campaigns table
      db.run(`
        CREATE TABLE IF NOT EXISTS ad_campaigns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) NOT NULL,
          platform VARCHAR(50) NOT NULL,
          campaign_id VARCHAR(255),
          status VARCHAR(20) DEFAULT 'active',
          budget DECIMAL(10,2),
          spent DECIMAL(10,2) DEFAULT 0.00,
          impressions INTEGER DEFAULT 0,
          clicks INTEGER DEFAULT 0,
          conversions INTEGER DEFAULT 0,
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Ad metrics table
      db.run(`
        CREATE TABLE IF NOT EXISTS ad_metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          campaign_id INTEGER NOT NULL,
          date DATE NOT NULL,
          impressions INTEGER DEFAULT 0,
          clicks INTEGER DEFAULT 0,
          spent DECIMAL(10,2) DEFAULT 0.00,
          conversions INTEGER DEFAULT 0,
          revenue DECIMAL(10,2) DEFAULT 0.00,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (campaign_id) REFERENCES ad_campaigns (id)
        )
      `);

      // Products table with photo support
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          webshop_id INTEGER NOT NULL DEFAULT 1,
          name VARCHAR(255) NOT NULL,
          sku VARCHAR(100),
          description TEXT,
          category VARCHAR(100),
          purchase_price DECIMAL(10,2) DEFAULT 0.00,
          selling_price DECIMAL(10,2) DEFAULT 0.00,
          stock_quantity INTEGER DEFAULT 0,
          weight_grams INTEGER DEFAULT 0,
          length_cm DECIMAL(5,2) DEFAULT 0.00,
          width_cm DECIMAL(5,2) DEFAULT 0.00,
          height_cm DECIMAL(5,2) DEFAULT 0.00,
          shipping_cost DECIMAL(10,2) DEFAULT 0.00,
          primary_image_url TEXT,
          image_urls TEXT,
          supplier VARCHAR(255),
          supplier_sku VARCHAR(100),
          tags TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (webshop_id) REFERENCES webshops (id),
          UNIQUE(webshop_id, sku)
        )
      `);

      // Shipping rules table
      db.run(`
        CREATE TABLE IF NOT EXISTS shipping_rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) NOT NULL,
          country VARCHAR(100) NOT NULL,
          min_weight INTEGER DEFAULT 0,
          max_weight INTEGER DEFAULT 999999,
          min_order_value DECIMAL(10,2) DEFAULT 0.00,
          max_order_value DECIMAL(10,2) DEFAULT 999999.99,
          shipping_cost DECIMAL(10,2) NOT NULL,
          free_shipping_threshold DECIMAL(10,2),
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tax rules table
      db.run(`
        CREATE TABLE IF NOT EXISTS tax_rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) NOT NULL,
          country VARCHAR(100) NOT NULL,
          tax_rate DECIMAL(5,2) NOT NULL,
          applies_to VARCHAR(100) DEFAULT 'all',
          product_category VARCHAR(100),
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Fixed costs table
      db.run(`
        CREATE TABLE IF NOT EXISTS fixed_costs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          billing_cycle VARCHAR(20) DEFAULT 'monthly',
          start_date DATE NOT NULL,
          end_date DATE,
          is_active BOOLEAN DEFAULT 1,
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Cost allocations table (for tracking costs per period)
      db.run(`
        CREATE TABLE IF NOT EXISTS cost_allocations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          period_start DATE NOT NULL,
          period_end DATE NOT NULL,
          fixed_cost_id INTEGER NOT NULL,
          allocated_amount DECIMAL(10,2) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (fixed_cost_id) REFERENCES fixed_costs (id)
        )
      `);

      // Profit analysis table
      db.run(`
        CREATE TABLE IF NOT EXISTS profit_analysis (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          period_start DATE NOT NULL,
          period_end DATE NOT NULL,
          total_revenue DECIMAL(10,2) DEFAULT 0.00,
          total_cogs DECIMAL(10,2) DEFAULT 0.00,
          total_fixed_costs DECIMAL(10,2) DEFAULT 0.00,
          total_ad_spend DECIMAL(10,2) DEFAULT 0.00,
          gross_profit DECIMAL(10,2) DEFAULT 0.00,
          net_profit DECIMAL(10,2) DEFAULT 0.00,
          profit_margin DECIMAL(5,2) DEFAULT 0.00,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Shipping tracking table
      db.run(`
        CREATE TABLE IF NOT EXISTS shipping_tracking (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          tracking_number VARCHAR(255) NOT NULL,
          carrier VARCHAR(50) DEFAULT 'DHL',
          shipment_id VARCHAR(255),
          label_url TEXT,
          estimated_delivery DATE,
          actual_delivery DATE,
          shipping_cost DECIMAL(10,2),
          status VARCHAR(50) DEFAULT 'created',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders (id)
        )
      `);

      // Packing slips table
      db.run(`
        CREATE TABLE IF NOT EXISTS packing_slips (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          slip_number VARCHAR(100) NOT NULL,
          generated_by INTEGER NOT NULL,
          pdf_url TEXT,
          items_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders (id),
          FOREIGN KEY (generated_by) REFERENCES users (id)
        )
      `);

      // Insert admin user only (password: admin123)
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      
      db.run(`
        INSERT OR IGNORE INTO users (
          email, password, first_name, last_name, role
        ) VALUES 
        ('admin@webshop.nl', '${hashedPassword}', 'Admin', 'User', 'admin')
      `);

      console.log('✅ Database tabellen aangemaakt - klaar voor live data');
      resolve();
    });
  });
};

module.exports = { db, initDatabase };
