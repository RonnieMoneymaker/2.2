#!/usr/bin/env node

const { Pool } = require('pg');
const { initPostgresDatabase } = require('./database/postgres-init');

// Kleuren voor console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testSupabaseConnection() {
  log('\n🚀 SUPABASE CONNECTIE TEST', colors.bold + colors.blue);
  log('================================\n');

  // Check environment variables
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    log('❌ DATABASE_URL niet gevonden!', colors.red);
    log('\n📋 SETUP INSTRUCTIES:', colors.yellow);
    log('1. Ga naar https://supabase.com');
    log('2. Maak een nieuw project aan');
    log('3. Ga naar Settings > Database');
    log('4. Kopieer de Connection String');
    log('5. Voeg toe aan je .env bestand:');
    log('   DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres\n');
    process.exit(1);
  }

  log(`🔗 Connectie URL gevonden: ${databaseUrl.substring(0, 30)}...`, colors.green);

  let pool;
  let client;

  try {
    // Create connection pool
    log('\n📡 Maken van connectie pool...', colors.blue);
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      },
      max: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Test basic connection
    log('🔌 Testen van database connectie...', colors.blue);
    client = await pool.connect();
    log('✅ Connectie succesvol!', colors.green);

    // Test database info
    log('\n📊 Database informatie ophalen...', colors.blue);
    const versionResult = await client.query('SELECT version()');
    log(`✅ PostgreSQL versie: ${versionResult.rows[0].version.split(' ')[1]}`, colors.green);

    const dbResult = await client.query('SELECT current_database()');
    log(`✅ Database naam: ${dbResult.rows[0].current_database}`, colors.green);

    const userResult = await client.query('SELECT current_user');
    log(`✅ Gebruiker: ${userResult.rows[0].current_user}`, colors.green);

    // Test permissions
    log('\n🔐 Testen van permissies...', colors.blue);
    
    // Test CREATE TABLE permission
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS connection_test (
          id SERIAL PRIMARY KEY,
          test_data VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      log('✅ CREATE TABLE permissie: OK', colors.green);

      // Test INSERT permission
      await client.query(`
        INSERT INTO connection_test (test_data) VALUES ('test-${Date.now()}')
      `);
      log('✅ INSERT permissie: OK', colors.green);

      // Test SELECT permission
      const selectResult = await client.query('SELECT COUNT(*) FROM connection_test');
      log(`✅ SELECT permissie: OK (${selectResult.rows[0].count} records)`, colors.green);

      // Cleanup test table
      await client.query('DROP TABLE IF EXISTS connection_test');
      log('✅ DROP TABLE permissie: OK', colors.green);

    } catch (permError) {
      log(`❌ Permissie fout: ${permError.message}`, colors.red);
    }

    // Test schema initialization
    log('\n🏗️  Testen van schema initialisatie...', colors.blue);
    try {
      await initPostgresDatabase(pool);
      log('✅ Schema initialisatie succesvol!', colors.green);
    } catch (schemaError) {
      log(`❌ Schema fout: ${schemaError.message}`, colors.red);
    }

    // Test sample data insertion
    log('\n📝 Testen van sample data...', colors.blue);
    try {
      // Insert test customer
      const customerResult = await client.query(`
        INSERT INTO customers (email, first_name, last_name, city)
        VALUES ('test@supabase.com', 'Test', 'User', 'Amsterdam')
        ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
        RETURNING id
      `);
      log(`✅ Test klant aangemaakt (ID: ${customerResult.rows[0].id})`, colors.green);

      // Insert test product
      await client.query(`
        INSERT INTO products (name, sku, purchase_price, selling_price, category)
        VALUES ('Test Product', 'TEST-001', 10.00, 19.99, 'Test')
        ON CONFLICT (sku) DO UPDATE SET
        name = EXCLUDED.name,
        purchase_price = EXCLUDED.purchase_price,
        selling_price = EXCLUDED.selling_price
      `);
      log('✅ Test product aangemaakt', colors.green);

      // Count total records
      const customerCount = await client.query('SELECT COUNT(*) FROM customers');
      const productCount = await client.query('SELECT COUNT(*) FROM products');
      
      log(`✅ Database bevat: ${customerCount.rows[0].count} klanten, ${productCount.rows[0].count} producten`, colors.green);

    } catch (dataError) {
      log(`❌ Data test fout: ${dataError.message}`, colors.red);
    }

    log('\n🎉 SUPABASE CONNECTIE TEST VOLTOOID!', colors.bold + colors.green);
    log('✅ Database is klaar voor productie gebruik', colors.green);

  } catch (error) {
    log(`\n❌ CONNECTIE FOUT: ${error.message}`, colors.red);
    log('\n🔧 MOGELIJKE OPLOSSINGEN:', colors.yellow);
    log('1. Controleer of DATABASE_URL correct is');
    log('2. Controleer of Supabase project actief is');
    log('3. Controleer internetverbinding');
    log('4. Controleer of SSL certificaat geldig is');
    
    if (error.code) {
      log(`\n🔍 Error code: ${error.code}`, colors.yellow);
    }
  } finally {
    if (client) {
      client.release();
    }
    if (pool) {
      await pool.end();
    }
  }
}

// Run the test
if (require.main === module) {
  testSupabaseConnection().catch(console.error);
}

module.exports = { testSupabaseConnection };
