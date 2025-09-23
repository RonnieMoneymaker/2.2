const { db } = require('./database/init');
const bcrypt = require('bcryptjs');

async function addCustomerLogins() {
  console.log('🔐 Adding customer login capabilities...');

  try {
    // Add password_hash column to customers if it doesn't exist
    await new Promise((resolve, reject) => {
      db.run(`ALTER TABLE customers ADD COLUMN password_hash TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Add is_verified column
    await new Promise((resolve, reject) => {
      db.run(`ALTER TABLE customers ADD COLUMN is_verified INTEGER DEFAULT 1`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Add verification_token column
    await new Promise((resolve, reject) => {
      db.run(`ALTER TABLE customers ADD COLUMN verification_token TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Add last_login_at column
    await new Promise((resolve, reject) => {
      db.run(`ALTER TABLE customers ADD COLUMN last_login_at DATETIME`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log('✅ Customer table columns added');

    // Hash password for demo customers
    const hashedPassword = await bcrypt.hash('customer123', 10);

    // Update existing customers with passwords
    const customers = [
      { email: 'piet.bakker@email.com', password: hashedPassword },
      { email: 'jan.de.vries@email.com', password: hashedPassword },
      { email: 'maria.jansen@email.com', password: hashedPassword },
      { email: 'anna.smit@email.com', password: hashedPassword }
    ];

    for (const customer of customers) {
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE customers 
          SET password_hash = ?, is_verified = 1 
          WHERE email = ?
        `, [customer.password, customer.email], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log(`✅ Password added for: ${customer.email}`);
    }

    console.log('\n🎉 Customer login system ready!');
    console.log('\n👥 Demo Customer Accounts:');
    console.log('   📧 piet.bakker@email.com / customer123');
    console.log('   📧 jan.de.vries@email.com / customer123');
    console.log('   📧 maria.jansen@email.com / customer123');
    console.log('   📧 anna.smit@email.com / customer123');
    console.log('\n🔗 Customer Login URL: http://localhost:3000/customer-login');

  } catch (error) {
    console.error('❌ Error adding customer logins:', error);
  }
}

addCustomerLogins();
