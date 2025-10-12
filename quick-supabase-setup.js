#!/usr/bin/env node

const fs = require('fs');
const { testSupabaseConnection } = require('./test-supabase-connection');

// Kleuren voor console
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

async function quickSetup() {
  log('\n🚀 QUICK SUPABASE SETUP', colors.bold + colors.blue);
  log('========================\n');

  // Get DATABASE_URL from command line arguments
  const databaseUrl = process.argv[2];

  if (!databaseUrl) {
    log('❌ Gebruik: node quick-supabase-setup.js "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"', colors.red);
    log('\n📋 STAPPEN:', colors.yellow);
    log('1. Ga naar https://supabase.com');
    log('2. Maak project aan: webshop-crm');
    log('3. Ga naar Settings > Database');
    log('4. Kopieer Connection String');
    log('5. Run: node quick-supabase-setup.js "jouw-database-url"');
    process.exit(1);
  }

  if (!databaseUrl.startsWith('postgresql://')) {
    log('❌ DATABASE_URL moet beginnen met postgresql://', colors.red);
    process.exit(1);
  }

  log('🔗 Database URL ontvangen!', colors.green);
  log(`📝 URL: ${databaseUrl.substring(0, 50)}...`, colors.blue);

  // Create .env file
  const envContent = `# SUPABASE CONFIGURATIE - GEGENEREERD OP ${new Date().toISOString()}
DATABASE_URL=${databaseUrl}

# JWT Secret
JWT_SECRET=supabase_jwt_secret_${Date.now()}

# Email configuratie (optioneel)
FROM_EMAIL=noreply@jouwwebshop.nl

# Development settings
NODE_ENV=development

# Andere services (laat leeg voor nu)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
GOOGLE_ADS_DEVELOPER_TOKEN=
META_ACCESS_TOKEN=
DHL_API_KEY=
`;

  fs.writeFileSync('.env', envContent);
  log('✅ .env bestand aangemaakt!', colors.green);

  // Test connection
  log('\n🧪 Testen van connectie...', colors.blue);
  
  try {
    // Load the new environment
    require('dotenv').config();
    
    // Test the connection
    await testSupabaseConnection();
    
    log('\n🎉 SUPABASE SETUP SUCCESVOL!', colors.bold + colors.green);
    log('================================', colors.green);
    log('✅ Database connectie werkt');
    log('✅ Schema aangemaakt');
    log('✅ Test data toegevoegd');
    log('✅ .env bestand geconfigureerd');
    
    log('\n📋 VOLGENDE STAPPEN:', colors.yellow);
    log('1. Start CRM systeem: npm run dev');
    log('2. Ga naar: http://localhost:3000');
    log('3. Test alle functionaliteiten');
    log('4. Check Supabase dashboard voor data');
    
    log('\n🔗 SUPABASE DASHBOARD:', colors.cyan);
    log('- Ga naar je Supabase project');
    log('- Klik "Table Editor"');
    log('- Zie tabellen: customers, products, orders');
    
  } catch (error) {
    log('\n❌ CONNECTIE FOUT!', colors.red);
    log(`Error: ${error.message}`, colors.red);
    log('\n🔧 MOGELIJKE OORZAKEN:', colors.yellow);
    log('1. Verkeerde DATABASE_URL');
    log('2. Project nog niet klaar (wacht 5 minuten)');
    log('3. Verkeerd wachtwoord in URL');
    log('4. Geen internetverbinding');
    
    // Show the URL format
    log('\n📋 CONTROLEER URL FORMAT:', colors.cyan);
    log('postgresql://postgres:JOUW_PASSWORD@db.JOUW_PROJECT.supabase.co:5432/postgres');
    log('                    ↑                    ↑');
    log('              Jouw password      Jouw project ID');
  }
}

if (require.main === module) {
  quickSetup().catch(console.error);
}
