#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CRM DEPLOYMENT SCRIPT');
console.log('=' .repeat(50));

const deploymentOptions = {
  vercel: 'Vercel (Frontend only)',
  railway: 'Railway (Full-stack)',
  heroku: 'Heroku (Full-stack)',
  docker: 'Docker (Self-hosted)',
  build: 'Build only (manual deploy)'
};

function showOptions() {
  console.log('\n📋 Deployment Opties:');
  Object.entries(deploymentOptions).forEach(([key, value], index) => {
    console.log(`${index + 1}. ${key}: ${value}`);
  });
  console.log('\nGebruik: node deploy.js [optie]');
  console.log('Voorbeeld: node deploy.js railway');
}

function checkPrerequisites() {
  console.log('\n🔍 Checking prerequisites...');
  
  // Check if client build exists
  if (!fs.existsSync('./client/build')) {
    console.log('⚠️ Client build not found. Building...');
    execSync('cd client && npm run build', { stdio: 'inherit' });
  }
  
  // Check environment files
  if (!fs.existsSync('.env') && !fs.existsSync('.env.production')) {
    console.log('⚠️ No environment file found. Creating .env.production template...');
    createEnvTemplate();
  }
  
  console.log('✅ Prerequisites checked');
}

function createEnvTemplate() {
  const envTemplate = `# Production Environment Variables
NODE_ENV=production
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret_here_min_64_chars

# Database (use PostgreSQL for production)
DATABASE_URL=postgresql://user:password@host:5432/crm_production

# CORS Origins (your domain)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Email Configuration
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@yourdomain.com

# Google Ads API (optional - works with mock data)
GOOGLE_ADS_DEVELOPER_TOKEN=your_token
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=123-456-7890

# Meta Ads API (optional - works with mock data)
META_ACCESS_TOKEN=your_access_token
META_AD_ACCOUNT_ID=act_1234567890

# DHL API (optional - works with mock data)
DHL_API_KEY=your_api_key
DHL_API_SECRET=your_api_secret
DHL_ACCOUNT_NUMBER=your_account_number
DHL_ENVIRONMENT=production

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

  fs.writeFileSync('.env.production', envTemplate);
  console.log('✅ .env.production template created');
  console.log('📝 Please edit .env.production with your actual values');
}

function deployToVercel() {
  console.log('\n🔄 Deploying to Vercel...');
  
  try {
    execSync('cd client && npx vercel --prod', { stdio: 'inherit' });
    console.log('✅ Vercel deployment successful!');
    console.log('📝 Note: Configure backend URL in Vercel environment variables');
  } catch (error) {
    console.error('❌ Vercel deployment failed:', error.message);
  }
}

function deployToRailway() {
  console.log('\n🚄 Deploying to Railway...');
  
  try {
    // Check if railway CLI is installed
    execSync('railway --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('📦 Installing Railway CLI...');
    execSync('npm install -g @railway/cli', { stdio: 'inherit' });
  }
  
  try {
    execSync('railway deploy', { stdio: 'inherit' });
    console.log('✅ Railway deployment successful!');
  } catch (error) {
    console.error('❌ Railway deployment failed:', error.message);
    console.log('💡 Run: railway login && railway link');
  }
}

function deployToHeroku() {
  console.log('\n🟣 Deploying to Heroku...');
  
  try {
    execSync('git add . && git commit -m "Production deployment"', { stdio: 'inherit' });
    execSync('git push heroku main', { stdio: 'inherit' });
    console.log('✅ Heroku deployment successful!');
  } catch (error) {
    console.error('❌ Heroku deployment failed:', error.message);
    console.log('💡 Run: heroku create your-crm-app && heroku addons:create heroku-postgresql:hobby-dev');
  }
}

function buildDocker() {
  console.log('\n🐳 Building Docker image...');
  
  try {
    execSync('docker build -t crm-system .', { stdio: 'inherit' });
    console.log('✅ Docker image built successfully!');
    console.log('🚀 Run with: docker-compose -f docker-compose.production.yml up -d');
  } catch (error) {
    console.error('❌ Docker build failed:', error.message);
  }
}

function buildOnly() {
  console.log('\n🔨 Building for manual deployment...');
  
  try {
    execSync('npm run build:production', { stdio: 'inherit' });
    console.log('✅ Build successful!');
    console.log('📁 Files ready in: ./client/build/');
    console.log('🚀 Upload to your hosting provider');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
  }
}

function generateDeploymentGuide() {
  const guide = `
# 🚀 DEPLOYMENT SUCCESS!

## 📋 Next Steps:

### 1. Domain Setup
- Buy domain (bijvoorbeeld: jouwcrm.nl)
- Point DNS to hosting provider
- SSL wordt automatisch geconfigureerd

### 2. Environment Variables
- Update .env.production met echte waarden
- Add API credentials voor Google Ads, Meta Ads, DHL
- Configure email SMTP settings

### 3. Database Setup
- PostgreSQL wordt aanbevolen voor production
- Backup strategy implementeren
- Monitor database performance

### 4. Monitoring
- Setup uptime monitoring
- Configure error tracking
- Add analytics

## 🔗 Useful Links:
- Vercel Dashboard: https://vercel.com/dashboard
- Railway Dashboard: https://railway.app/dashboard
- Domain registrars: transip.nl, hostnet.nl

## 💰 Estimated Monthly Costs:
- Vercel (Frontend): €0 (gratis tier)
- Railway (Backend + DB): €10-15
- Domain: €1/maand
- TOTAL: €11-16/maand

## 🎉 Your CRM is now LIVE!
`;

  fs.writeFileSync('DEPLOYMENT_SUCCESS.md', guide);
  console.log('📄 Deployment guide created: DEPLOYMENT_SUCCESS.md');
}

// Main execution
const option = process.argv[2];

if (!option) {
  showOptions();
  process.exit(1);
}

checkPrerequisites();

switch (option.toLowerCase()) {
  case 'vercel':
    deployToVercel();
    break;
  case 'railway':
    deployToRailway();
    break;
  case 'heroku':
    deployToHeroku();
    break;
  case 'docker':
    buildDocker();
    break;
  case 'build':
    buildOnly();
    break;
  default:
    console.log('❌ Unknown option:', option);
    showOptions();
    process.exit(1);
}

generateDeploymentGuide();
console.log('\n🎉 Deployment process completed!');



