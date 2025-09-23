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

      // Insert comprehensive test customer data with tracking
      db.run(`
        INSERT OR IGNORE INTO customers (
          email, first_name, last_name, phone, address, city, postal_code, 
          registration_ip, last_login_ip, user_agent, referrer_source, utm_source, utm_medium,
          total_orders, total_spent, lifetime_value, customer_status, tags
        ) VALUES 
        ('jan.de.vries@email.com', 'Jan', 'de Vries', '06-12345678', 'Hoofdstraat 123', 'Amsterdam', '1000 AB', '84.245.123.45', '84.245.123.45', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'google.com', 'google', 'organic', 3, 299.97, 104.99, 'active', 'repeat_buyer,high_value'),
        ('maria.jansen@email.com', 'Maria', 'Jansen', '06-87654321', 'Kerkstraat 45', 'Utrecht', '3500 CD', '213.75.89.12', '213.75.89.12', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6)', 'facebook.com', 'facebook', 'social', 1, 89.99, 25.54, 'active', 'mobile_user'),
        ('piet.bakker@email.com', 'Piet', 'Bakker', '06-11223344', 'Dorpsplein 7', 'Haarlem', '2000 EF', '195.144.67.89', '195.144.67.89', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'direct', 'direct', 'direct', 5, 599.95, 180.23, 'vip', 'vip,loyal,high_value'),
        ('anna.smit@email.com', 'Anna', 'Smit', '06-99887766', 'Nieuwstraat 89', 'Rotterdam', '3000 GH', '77.161.234.56', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'instagram.com', 'instagram', 'social', 0, 0.00, 0.00, 'new', 'new_user,social_media'),
        ('kees.van.dam@email.com', 'Kees', 'van Dam', '06-55443322', 'Marktplein 15', 'Den Haag', '2500 AA', '145.53.78.90', '145.53.78.90', 'Mozilla/5.0 (X11; Linux x86_64)', 'google.com', 'google_ads', 'cpc', 2, 189.98, 54.54, 'active', 'paid_acquisition'),
        ('lisa.de.jong@email.com', 'Lisa', 'de Jong', '06-77889900', 'Schoolstraat 67', 'Eindhoven', '5600 BC', '82.94.123.45', '82.94.123.45', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'newsletter', 'email', 'email', 4, 445.96, 132.19, 'vip', 'email_subscriber,vip'),
        ('tom.peters@email.com', 'Tom', 'Peters', '06-33221100', 'Stationsweg 234', 'Groningen', '9700 DE', '213.126.89.12', '213.126.89.12', 'Mozilla/5.0 (iPad; CPU OS 14_6)', 'bing.com', 'bing', 'organic', 1, 79.99, 22.05, 'active', 'tablet_user,north_netherlands'),
        ('sophie.willems@email.com', 'Sophie', 'Willems', '06-44556677', 'Lange Gracht 88', 'Breda', '4800 FG', '31.206.45.78', '31.206.45.78', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)', 'youtube.com', 'youtube', 'video', 2, 159.98, 44.09, 'active', 'video_referral,mobile'),
        ('marco.van.berg@email.com', 'Marco', 'van Berg', '06-66778899', 'Industrieweg 456', 'Tilburg', '5000 HI', '84.245.67.123', '84.245.67.123', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'affiliate', 'affiliate_partner', 'affiliate', 6, 789.94, 241.33, 'vip', 'affiliate,high_value,business'),
        ('emma.de.wit@email.com', 'Emma', 'de Wit', '06-22334455', 'Parkstraat 12', 'Maastricht', '6200 JK', '62.163.78.234', '62.163.78.234', 'Mozilla/5.0 (Android 11; Mobile)', 'tiktok.com', 'tiktok', 'social', 1, 49.99, 11.55, 'active', 'tiktok_user,young_demographic'),
        ('lars.hendriks@email.com', 'Lars', 'Hendriks', '06-88990011', 'Koningslaan 345', 'Arnhem', '6800 LM', '84.245.89.67', '84.245.89.67', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'google.com', 'google_shopping', 'cpc', 3, 239.97, 74.39, 'active', 'google_shopping,repeat_buyer'),
        ('nina.van.dijk@email.com', 'Nina', 'van Dijk', '06-11223344', 'Zeedijk 78', 'Zwolle', '8000 NO', '213.75.123.89', '213.75.123.89', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'pinterest.com', 'pinterest', 'social', 2, 119.98, 30.59, 'active', 'pinterest_user,visual_shopper'),
        ('rick.de.boer@email.com', 'Rick', 'de Boer', '06-55667788', 'Bosstraat 23', 'Apeldoorn', '7300 PQ', '145.53.234.67', '145.53.234.67', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6)', 'whatsapp', 'whatsapp', 'messaging', 1, 89.99, 25.45, 'active', 'whatsapp_referral,mobile'),
        ('sara.meijer@email.com', 'Sara', 'Meijer', '06-99001122', 'Waterstraat 156', 'Leeuwarden', '8900 RS', '84.245.156.78', '84.245.156.78', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'reddit.com', 'reddit', 'social', 4, 359.96, 96.89, 'active', 'reddit_user,tech_savvy'),
        ('daan.visser@email.com', 'Daan', 'Visser', '06-33445566', 'Molenweg 89', 'Enschede', '7500 TU', '213.126.67.234', '213.126.67.234', 'Mozilla/5.0 (X11; Linux x86_64)', 'linkedin.com', 'linkedin', 'professional', 2, 149.98, 39.49, 'active', 'linkedin_professional,b2b'),
        ('floor.van.leeuwen@email.com', 'Floor', 'van Leeuwen', '06-77889900', 'Kerkweg 234', 'Alkmaar', '1800 VW', '77.161.89.123', NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)', 'snapchat.com', 'snapchat', 'social', 1, 69.99, 18.90, 'new', 'snapchat_user,gen_z')
      `);

      db.run(`
        INSERT OR IGNORE INTO orders (
          customer_id, order_number, status, total_amount, payment_method, shipping_address
        ) VALUES 
        (1, 'ORD-2024-001', 'delivered', 99.99, 'iDEAL', 'Hoofdstraat 123, 1000 AB Amsterdam'),
        (1, 'ORD-2024-002', 'delivered', 149.98, 'Creditcard', 'Hoofdstraat 123, 1000 AB Amsterdam'),
        (1, 'ORD-2024-003', 'processing', 49.99, 'iDEAL', 'Hoofdstraat 123, 1000 AB Amsterdam'),
        (2, 'ORD-2024-004', 'delivered', 89.99, 'PayPal', 'Kerkstraat 45, 3500 CD Utrecht'),
        (3, 'ORD-2024-005', 'shipped', 199.99, 'iDEAL', 'Dorpsplein 7, 2000 EF Haarlem')
      `);

      db.run(`
        INSERT OR IGNORE INTO customer_interactions (
          customer_id, interaction_type, subject, description, created_by
        ) VALUES 
        (1, 'email', 'Vraag over bestelling', 'Klant vroeg naar verzendstatus van bestelling ORD-2024-003', 'Klantenservice'),
        (2, 'phone', 'Retour verzoek', 'Klant wil product retourneren - maat te klein', 'Klantenservice'),
        (3, 'email', 'Product advies', 'Klant vroeg om advies voor nieuwe aankoop', 'Sales Team')
      `);

      // Insert sample admin user (password: admin123)
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      
      db.run(`
        INSERT OR IGNORE INTO users (
          email, password, first_name, last_name, role
        ) VALUES 
        ('admin@webshop.nl', '${hashedPassword}', 'Admin', 'User', 'admin'),
        ('manager@webshop.nl', '${hashedPassword}', 'Manager', 'User', 'manager'),
        ('saas@crmplatform.nl', '${hashedPassword}', 'SaaS', 'Admin', 'super_admin')
      `);

      // Insert subscription plans
      db.run(`
        INSERT OR IGNORE INTO subscription_plans (
          name, description, price_monthly, price_yearly, max_customers, max_orders, max_products, max_webshops, features
        ) VALUES 
        ('Starter', 'Perfect voor beginnende webshops', 29.00, 290.00, 100, 50, 25, 1, '["basic_crm", "email_support", "basic_analytics"]'),
        ('Professional', 'Voor groeiende webshops met meer functies', 79.00, 790.00, 1000, 500, 100, 3, '["advanced_crm", "ai_insights", "email_automation", "advanced_analytics", "api_access"]'),
        ('Enterprise', 'Voor grote webshops met unlimited mogelijkheden', 199.00, 1990.00, -1, -1, -1, 10, '["unlimited_everything", "white_label", "priority_support", "custom_integrations", "advanced_ai"]'),
        ('Free Trial', 'Gratis 14-dagen proefperiode', 0.00, 0.00, 10, 10, 5, 1, '["basic_crm", "limited_support"]')
      `);

      // Insert sample webshops
      db.run(`
        INSERT OR IGNORE INTO webshops (
          name, domain, description, owner_id, subscription_plan, settings
        ) VALUES 
        ('Fashion Store Demo', 'fashion-demo.nl', 'Demo webshop voor kleding en accessoires', 1, 'professional', '{"currency": "EUR", "language": "nl", "timezone": "Europe/Amsterdam"}'),
        ('Tech Gadgets Shop', 'techgadgets.nl', 'Elektronica en gadgets webshop', 1, 'starter', '{"currency": "EUR", "language": "nl", "timezone": "Europe/Amsterdam"}'),
        ('Home & Garden', 'homeandgarden.be', 'Belgische tuin en interieur shop', 2, 'enterprise', '{"currency": "EUR", "language": "nl", "timezone": "Europe/Brussels"}')
      `);

      // Insert sample API integrations
      db.run(`
        INSERT OR IGNORE INTO api_integrations (
          webshop_id, integration_type, platform_name, status, created_by
        ) VALUES 
        (1, 'ecommerce', 'Shopify', 'active', 1),
        (1, 'payment', 'Stripe', 'active', 1),
        (1, 'payment', 'Mollie', 'inactive', 1),
        (1, 'email', 'Mailchimp', 'active', 1),
        (1, 'analytics', 'Google Analytics', 'active', 1),
        (2, 'ecommerce', 'WooCommerce', 'active', 2),
        (2, 'payment', 'PayPal', 'active', 2),
        (3, 'payment', 'Stripe', 'active', 2),
        (3, 'shipping', 'PostNL', 'active', 2)
      `);

      // Insert sample payment providers
      db.run(`
        INSERT OR IGNORE INTO payment_providers (
          webshop_id, provider_name, provider_type, is_active, test_mode, created_by
        ) VALUES 
        (1, 'Stripe', 'card_payments', 1, 1, 1),
        (1, 'Mollie', 'ideal_payments', 1, 1, 1),
        (1, 'PayPal', 'paypal_payments', 1, 1, 1),
        (2, 'Stripe', 'card_payments', 1, 1, 2),
        (3, 'Mollie', 'comprehensive', 1, 0, 2)
      `);

      // Insert sample ad campaigns
      db.run(`
        INSERT OR IGNORE INTO ad_campaigns (
          name, platform, campaign_id, budget, spent, impressions, clicks, conversions, created_by
        ) VALUES 
        ('Zomer Collectie 2024', 'google', 'google_campaign_001', 1000.00, 750.50, 25000, 1250, 85, 1),
        ('Facebook Retargeting', 'meta', 'fb_campaign_002', 500.00, 320.75, 15000, 800, 45, 1),
        ('Instagram Shopping', 'meta', 'ig_campaign_003', 750.00, 480.25, 20000, 950, 62, 1),
        ('Google Shopping', 'google', 'google_shopping_004', 1200.00, 890.30, 30000, 1800, 120, 1)
      `);

      // Insert sample ad metrics for last 7 days
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        db.run(`
          INSERT OR IGNORE INTO ad_metrics (
            campaign_id, date, impressions, clicks, spent, conversions, revenue
          ) VALUES 
          (1, '${dateStr}', ${3000 + Math.floor(Math.random() * 1000)}, ${150 + Math.floor(Math.random() * 50)}, ${100 + Math.floor(Math.random() * 30)}, ${10 + Math.floor(Math.random() * 5)}, ${500 + Math.floor(Math.random() * 200)}),
          (2, '${dateStr}', ${2000 + Math.floor(Math.random() * 800)}, ${100 + Math.floor(Math.random() * 40)}, ${50 + Math.floor(Math.random() * 20)}, ${6 + Math.floor(Math.random() * 4)}, ${300 + Math.floor(Math.random() * 150)}),
          (3, '${dateStr}', ${2500 + Math.floor(Math.random() * 900)}, ${120 + Math.floor(Math.random() * 45)}, ${70 + Math.floor(Math.random() * 25)}, ${8 + Math.floor(Math.random() * 4)}, ${400 + Math.floor(Math.random() * 180)}),
          (4, '${dateStr}', ${4000 + Math.floor(Math.random() * 1200)}, ${200 + Math.floor(Math.random() * 60)}, ${120 + Math.floor(Math.random() * 40)}, ${15 + Math.floor(Math.random() * 6)}, ${750 + Math.floor(Math.random() * 250)})
        `);
      }

      // Insert sample products with shipping data
      db.run(`
        INSERT OR IGNORE INTO products (
          name, sku, description, category, purchase_price, selling_price, stock_quantity, 
          weight_grams, length_cm, width_cm, height_cm, shipping_cost, supplier
        ) VALUES 
        ('Premium T-Shirt', 'TSH-001', 'Hoogwaardige katoenen t-shirt', 'Kleding', 12.50, 29.99, 150, 200, 30.0, 25.0, 2.0, 3.95, 'TextielGrossier BV'),
        ('Jeans Classic Fit', 'JNS-002', 'Klassieke jeans in verschillende maten', 'Kleding', 25.00, 79.99, 75, 400, 35.0, 28.0, 3.0, 4.95, 'DenimSupply Co'),
        ('Sneakers Sport', 'SNK-003', 'Comfortabele sport sneakers', 'Schoenen', 35.00, 89.99, 50, 800, 32.0, 20.0, 12.0, 6.95, 'FootwearDirect'),
        ('Hoodie Deluxe', 'HDI-004', 'Warme hoodie met capuchon', 'Kleding', 18.75, 49.99, 100, 500, 40.0, 30.0, 5.0, 5.95, 'TextielGrossier BV'),
        ('Backpack Travel', 'BAG-005', 'Duurzame reistas met laptop compartiment', 'Accessoires', 22.00, 69.99, 30, 1200, 45.0, 35.0, 20.0, 8.95, 'BagWorld Ltd'),
        ('Watch Digital', 'WTC-006', 'Moderne digitale horloge', 'Accessoires', 45.00, 129.99, 25, 150, 5.0, 5.0, 2.0, 2.95, 'TimeKeepers Inc'),
        ('Sunglasses UV400', 'SUN-007', 'Zonnebril met UV-bescherming', 'Accessoires', 8.50, 24.99, 200, 100, 15.0, 6.0, 4.0, 2.95, 'OpticsSupply'),
        ('Phone Case Premium', 'PHN-008', 'Beschermhoes voor smartphone', 'Accessoires', 3.25, 14.99, 300, 50, 12.0, 8.0, 1.0, 2.45, 'TechAccessories')
      `);

      // Insert shipping rules
      db.run(`
        INSERT OR IGNORE INTO shipping_rules (
          name, country, min_weight, max_weight, min_order_value, max_order_value, 
          shipping_cost, free_shipping_threshold
        ) VALUES 
        ('Nederland Standaard', 'Nederland', 0, 1000, 0.00, 49.99, 4.95, 50.00),
        ('Nederland Gratis', 'Nederland', 0, 1000, 50.00, 999999.99, 0.00, NULL),
        ('Nederland Zwaar', 'Nederland', 1001, 5000, 0.00, 999999.99, 8.95, 75.00),
        ('EU Standaard', 'EU', 0, 1000, 0.00, 99.99, 12.95, 100.00),
        ('EU Gratis', 'EU', 0, 1000, 100.00, 999999.99, 0.00, NULL),
        ('België Standaard', 'België', 0, 1000, 0.00, 74.99, 6.95, 75.00),
        ('Duitsland Standaard', 'Duitsland', 0, 1000, 0.00, 99.99, 9.95, 100.00)
      `);

      // Insert tax rules
      db.run(`
        INSERT OR IGNORE INTO tax_rules (
          name, country, tax_rate, applies_to, product_category
        ) VALUES 
        ('BTW Nederland Algemeen', 'Nederland', 21.00, 'all', NULL),
        ('BTW Nederland Laag', 'Nederland', 9.00, 'category', 'Boeken'),
        ('BTW België', 'België', 21.00, 'all', NULL),
        ('MwSt Duitsland', 'Duitsland', 19.00, 'all', NULL),
        ('VAT Frankrijk', 'Frankrijk', 20.00, 'all', NULL),
        ('BTW Nederland Voedsel', 'Nederland', 9.00, 'category', 'Voeding')
      `);

      // Insert sample fixed costs
      db.run(`
        INSERT OR IGNORE INTO fixed_costs (
          name, description, category, amount, billing_cycle, start_date, created_by
        ) VALUES 
        ('Kantoorhuur', 'Maandelijkse huur kantoorpand', 'Huisvesting', 2500.00, 'monthly', '2024-01-01', 1),
        ('Elektriciteit & Gas', 'Nutsvoorzieningen kantoor en magazijn', 'Utilities', 450.00, 'monthly', '2024-01-01', 1),
        ('Internet & Telefonie', 'Zakelijke internet en telefoonabonnement', 'IT & Communicatie', 125.00, 'monthly', '2024-01-01', 1),
        ('Verzekeringen', 'Bedrijfsverzekering en aansprakelijkheid', 'Verzekeringen', 350.00, 'monthly', '2024-01-01', 1),
        ('Salaris Eigenaar', 'Maandelijks salaris eigenaar', 'Personeel', 4500.00, 'monthly', '2024-01-01', 1),
        ('Salaris Medewerker', 'Parttime medewerker klantenservice', 'Personeel', 2200.00, 'monthly', '2024-01-01', 1),
        ('Accountant', 'Maandelijkse boekhouding en fiscale zaken', 'Professionele Diensten', 275.00, 'monthly', '2024-01-01', 1),
        ('Software Licenties', 'CRM, boekhouding en andere software', 'IT & Communicatie', 180.00, 'monthly', '2024-01-01', 1),
        ('Magazijn Huur', 'Opslag en fulfillment centrum', 'Huisvesting', 1200.00, 'monthly', '2024-01-01', 1),
        ('Bankkosten', 'Zakelijke rekening en transactiekosten', 'Financieel', 45.00, 'monthly', '2024-01-01', 1)
      `);

      // Update order_items to link with products
      db.run(`
        UPDATE order_items SET 
          product_sku = CASE 
            WHEN product_name LIKE '%T-shirt%' THEN 'TSH-001'
            WHEN product_name LIKE '%Jeans%' THEN 'JNS-002'
            WHEN product_name LIKE '%Sneakers%' THEN 'SNK-003'
            WHEN product_name LIKE '%Hoodie%' THEN 'HDI-004'
            ELSE NULL
          END
        WHERE product_sku IS NULL
      `);

      console.log('✅ Database tabellen aangemaakt en sample data toegevoegd');
      resolve();
    });
  });
};

module.exports = { db, initDatabase };
