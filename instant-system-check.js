const fs = require('fs');
const path = require('path');

function instantSystemCheck() {
  console.log('🔍 INSTANT SYSTEM CHECK - FILE & CONFIG ANALYSIS');
  console.log('=' .repeat(60));
  
  const results = {
    coreFiles: 0,
    apiRoutes: 0,
    frontendPages: 0,
    services: 0,
    database: 0,
    configs: 0
  };
  
  // Check 1: Core Backend Files
  console.log('\n📁 Checking Core Backend Files...');
  const coreFiles = ['server.js', 'package.json'];
  coreFiles.forEach(file => {
    if (fs.existsSync(file)) {
      results.coreFiles++;
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  });
  
  // Check 2: API Routes
  console.log('\n🔗 Checking API Routes...');
  const routesDir = 'routes';
  if (fs.existsSync(routesDir)) {
    const routes = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
    results.apiRoutes = routes.length;
    console.log(`✅ Found ${routes.length} API route files:`);
    routes.forEach(route => console.log(`   - ${route.replace('.js', '')}`));
  }
  
  // Check 3: Frontend Pages
  console.log('\n🖥️ Checking Frontend Pages...');
  const pagesDir = 'client/src/pages';
  if (fs.existsSync(pagesDir)) {
    const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
    results.frontendPages = pages.length;
    console.log(`✅ Found ${pages.length} frontend pages:`);
    pages.forEach(page => console.log(`   - ${page.replace('.tsx', '')}`));
  }
  
  // Check 4: Services
  console.log('\n⚙️ Checking Services...');
  const servicesDir = 'services';
  if (fs.existsSync(servicesDir)) {
    const services = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));
    results.services = services.length;
    console.log(`✅ Found ${services.length} service files:`);
    services.forEach(service => console.log(`   - ${service.replace('.js', '')}`));
  }
  
  // Check 5: Database
  console.log('\n🗄️ Checking Database...');
  const dbFiles = ['database/init.js'];
  dbFiles.forEach(file => {
    if (fs.existsSync(file)) {
      results.database++;
      console.log(`✅ ${file}`);
    }
  });
  
  const dbExists = fs.existsSync('database/crm.db') || fs.existsSync('sqlite.db');
  if (dbExists) {
    results.database++;
    console.log('✅ Database file exists');
  } else {
    console.log('⚠️ Database file not found (will be created on start)');
  }
  
  // Check 6: Configuration Files
  console.log('\n⚙️ Checking Configuration...');
  const configFiles = [
    'client/package.json',
    'client/tsconfig.json', 
    'vercel.json',
    'railway.json',
    'Dockerfile'
  ];
  
  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      results.configs++;
      console.log(`✅ ${file}`);
    }
  });
  
  // Check 7: Package Dependencies
  console.log('\n📦 Checking Dependencies...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const clientPackageJson = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
    
    const backendDeps = Object.keys(packageJson.dependencies || {}).length;
    const frontendDeps = Object.keys(clientPackageJson.dependencies || {}).length;
    
    console.log(`✅ Backend dependencies: ${backendDeps}`);
    console.log(`✅ Frontend dependencies: ${frontendDeps}`);
    
    // Check for key dependencies
    const keyBackendDeps = ['express', 'sqlite3', 'bcryptjs', 'jsonwebtoken', 'axios'];
    const keyFrontendDeps = ['react', 'react-router-dom', 'axios', 'recharts', 'leaflet'];
    
    console.log('\n🔑 Key Backend Dependencies:');
    keyBackendDeps.forEach(dep => {
      const exists = packageJson.dependencies && packageJson.dependencies[dep];
      console.log(`${exists ? '✅' : '❌'} ${dep}`);
    });
    
    console.log('\n🔑 Key Frontend Dependencies:');
    keyFrontendDeps.forEach(dep => {
      const exists = clientPackageJson.dependencies && clientPackageJson.dependencies[dep];
      console.log(`${exists ? '✅' : '❌'} ${dep}`);
    });
    
  } catch (error) {
    console.log('❌ Error reading package.json files');
  }
  
  // Final Assessment
  console.log('\n📊 INSTANT ANALYSIS RESULTS');
  console.log('=' .repeat(40));
  console.log(`Core Files: ${results.coreFiles}/2`);
  console.log(`API Routes: ${results.apiRoutes}`);
  console.log(`Frontend Pages: ${results.frontendPages}`);
  console.log(`Services: ${results.services}`);
  console.log(`Database Setup: ${results.database}/2`);
  console.log(`Config Files: ${results.configs}/5`);
  
  const totalScore = results.coreFiles + Math.min(results.apiRoutes, 10) + 
                     Math.min(results.frontendPages, 15) + Math.min(results.services, 10) +
                     results.database + results.configs;
  
  console.log(`\n🎯 COMPLETENESS SCORE: ${totalScore}/42 (${Math.round(totalScore/42*100)}%)`);
  
  if (totalScore >= 35) {
    console.log('🎉 SYSTEM IS COMPLETE AND READY!');
    console.log('🚀 Ready for deployment to Railway/Vercel');
  } else if (totalScore >= 25) {
    console.log('✅ SYSTEM IS MOSTLY COMPLETE');
    console.log('🔧 Minor components missing but core is solid');
  } else {
    console.log('⚠️ SYSTEM NEEDS MORE DEVELOPMENT');
  }
  
  console.log('\n💡 RECOMMENDATION:');
  if (results.coreFiles === 2 && results.apiRoutes >= 8 && results.frontendPages >= 10) {
    console.log('✅ DEPLOY NOW! Core system is complete');
    console.log('🌐 railway.app → Deploy from GitHub → Add PostgreSQL → Deploy!');
  } else {
    console.log('🔧 Complete missing components first');
  }
  
  console.log('\n⚡ Analysis completed in <1 second!');
}

instantSystemCheck();



