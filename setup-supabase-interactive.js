#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const { testSupabaseConnection } = require('./test-supabase-connection');

// Kleuren voor console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function interactiveSupabaseSetup() {
  console.clear();
  log('🚀 INTERACTIEVE SUPABASE SETUP', colors.bold + colors.blue);
  log('================================\n', colors.blue);

  // Check if already configured
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    if (envContent.includes('DATABASE_URL=postgresql://')) {
      log('✅ .env bestand gevonden met PostgreSQL URL', colors.green);
      
      const testNow = await question('🧪 Wil je de bestaande configuratie testen? (y/n): ');
      if (testNow.toLowerCase() === 'y' || testNow.toLowerCase() === 'yes') {
        log('\n🔬 Testen van bestaande configuratie...', colors.blue);
        await testSupabaseConnection();
        rl.close();
        return;
      }
    }
  }

  log('📋 STAP 1: SUPABASE PROJECT INFO', colors.yellow);
  log('Ga naar https://supabase.com en maak een project aan\n');

  log('Na het aanmaken van je project:');
  log('1. Ga naar Settings (tandwiel icoon)');
  log('2. Klik op Database in de sidebar');
  log('3. Scroll naar "Connection String"');
  log('4. Kopieer de URI (begint met postgresql://)\n');

  // Get project details
  const projectRef = await question('🔗 Wat is je project reference? (bijv: abcdefghijklmnop): ');
  const password = await question('🔐 Wat is je database password?: ');

  if (!projectRef || !password) {
    log('❌ Project reference en password zijn verplicht!', colors.red);
    rl.close();
    return;
  }

  // Construct DATABASE_URL
  const databaseUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

  log('\n📝 STAP 2: .ENV BESTAND AANMAKEN', colors.yellow);

  // Create .env file
  const envContent = `# SUPABASE CONFIGURATIE
DATABASE_URL=${databaseUrl}

# Andere instellingen
NODE_ENV=development
JWT_SECRET=supabase_jwt_secret_${Date.now()}
FROM_EMAIL=noreply@jouwwebshop.nl

# Optional: andere services (laat leeg voor nu)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
`;

  fs.writeFileSync('.env', envContent);
  log('✅ .env bestand aangemaakt!', colors.green);

  log('\n🧪 STAP 3: CONNECTIE TESTEN', colors.yellow);
  const testNow = await question('Wil je nu de connectie testen? (y/n): ');
  
  if (testNow.toLowerCase() === 'y' || testNow.toLowerCase() === 'yes') {
    log('\n🔬 Testen van Supabase connectie...', colors.blue);
    
    try {
      // Load the new .env file
      require('dotenv').config();
      await testSupabaseConnection();
      
      log('\n🎉 SETUP VOLTOOID!', colors.bold + colors.green);
      log('✅ Je kunt nu je CRM systeem gebruiken met Supabase', colors.green);
      log('\n📋 VOLGENDE STAPPEN:', colors.cyan);
      log('1. Start je CRM: npm run dev');
      log('2. Ga naar http://localhost:3000');
      log('3. Voeg klanten en producten toe');
      log('4. Check je Supabase dashboard om data te zien');
      
    } catch (error) {
      log('\n❌ CONNECTIE FOUT!', colors.red);
      log(`Error: ${error.message}`, colors.red);
      log('\n🔧 CONTROLEER:', colors.yellow);
      log('1. Is je project reference correct?');
      log('2. Is je database password correct?');
      log('3. Is je Supabase project actief?');
      log('4. Heb je internetverbinding?');
    }
  } else {
    log('\n✅ Setup voltooid!', colors.green);
    log('Run later: npm run test:supabase', colors.cyan);
  }

  rl.close();
}

// Run interactive setup
if (require.main === module) {
  interactiveSupabaseSetup().catch(console.error);
}

module.exports = { interactiveSupabaseSetup };
