#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Webshop CRM...\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file...');
  fs.writeFileSync('.env', `NODE_ENV=development
PORT=5000
JWT_SECRET=your_secret_jwt_key_change_this_in_production
DB_PATH=./database/crm.db
API_BASE_URL=http://localhost:5000/api`);
  console.log('✅ .env file created!\n');
}

// Check if client .env file exists
const clientEnvPath = path.join('client', '.env');
if (!fs.existsSync(clientEnvPath)) {
  console.log('📝 Creating client .env file...');
  fs.writeFileSync(clientEnvPath, `REACT_APP_API_URL=http://localhost:5000/api
GENERATE_SOURCEMAP=false`);
  console.log('✅ Client .env file created!\n');
}

// Resolve npm command per platform, with Windows fallback
let npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
if (process.platform === 'win32') {
  const nodeDir = path.dirname(process.execPath);
  const fallbackNpm = path.join(nodeDir, 'npm.cmd');
  try {
    if (!process.env.PATH || !process.env.PATH.toLowerCase().includes(nodeDir.toLowerCase())) {
      process.env.PATH = `${nodeDir};${process.env.PATH || ''}`;
    }
  } catch (e) {}
  if (!fs.existsSync(npmCmd) && fs.existsSync(fallbackNpm)) {
    npmCmd = fallbackNpm;
  }
}

// Check if dependencies are installed
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing backend dependencies...');
  const installBackend = spawn(npmCmd, ['install'], { stdio: 'inherit' });
  
  installBackend.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Backend dependencies installed!\n');
      checkClientDependencies();
    } else {
      console.error('❌ Failed to install backend dependencies');
      process.exit(1);
    }
  });
} else {
  checkClientDependencies();
}

function checkClientDependencies() {
  const clientNodeModules = path.join('client', 'node_modules');
  if (!fs.existsSync(clientNodeModules)) {
    console.log('📦 Installing frontend dependencies...');
    const installClient = spawn(npmCmd, ['install'], { 
      cwd: 'client',
      stdio: 'inherit'
    });
    
    installClient.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Frontend dependencies installed!\n');
        startApplication();
      } else {
        console.error('❌ Failed to install frontend dependencies');
        process.exit(1);
      }
    });
  } else {
    startApplication();
  }
}

function startApplication() {
  console.log('🌟 Starting CRM application...\n');
  console.log('📊 Backend API will be available at: http://localhost:5000');
  console.log('🎨 Frontend dashboard will be available at: http://localhost:3000\n');
  console.log('Press Ctrl+C to stop the application\n');
  
  // Start both backend and frontend
  const dev = spawn(npmCmd, ['run', 'dev'], { stdio: 'inherit' });
  
  dev.on('close', (code) => {
    console.log(`\n👋 CRM application stopped with code ${code}`);
  });
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping CRM application...');
    dev.kill('SIGINT');
    process.exit(0);
  });
}
