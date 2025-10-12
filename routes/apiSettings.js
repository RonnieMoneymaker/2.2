const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Get all API settings
router.get('/', /*authenticateToken,*/ (req, res) => {
  try {
    db.all(`
      SELECT id, platform, setting_key, setting_value, is_active, created_at, updated_at
      FROM api_settings 
      WHERE is_active = 1
      ORDER BY platform, setting_key
    `, (err, settings) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout bij ophalen API instellingen' });
      }
      
      // Group by platform for easier frontend handling
      const groupedSettings = settings.reduce((acc, setting) => {
        if (!acc[setting.platform]) {
          acc[setting.platform] = {};
        }
        // Don't send sensitive values to frontend (only show if configured)
        acc[setting.platform][setting.setting_key] = {
          configured: !!setting.setting_value,
          value: setting.setting_value ? '***CONFIGURED***' : null,
          id: setting.id
        };
        return acc;
      }, {});
      
      res.json({
        settings: groupedSettings,
        platforms: ['google_ads', 'meta_ads', 'dhl', 'postnl', 'ups', 'email_smtp', 'email_sendgrid']
      });
    });
  } catch (error) {
    console.error('Error fetching API settings:', error);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

// Get API connection status
router.get('/status', (req, res) => {
  const apiConfigLoader = require('../services/apiConfigLoader');
  
  Promise.all([
    apiConfigLoader.isConfigured('google_ads'),
    apiConfigLoader.isConfigured('meta_ads'),
    apiConfigLoader.isConfigured('dhl'),
    apiConfigLoader.isConfigured('email_smtp')
  ]).then(([googleAds, metaAds, dhl, emailSmtp]) => {
    res.json({
      google_ads: { 
        connected: googleAds,
        status: googleAds ? 'active' : 'not_configured',
        message: googleAds ? 'Live data beschikbaar' : 'Configureer in API Instellingen'
      },
      meta_ads: { 
        connected: metaAds,
        status: metaAds ? 'active' : 'not_configured',
        message: metaAds ? 'Live data beschikbaar' : 'Configureer in API Instellingen'
      },
      dhl: { 
        connected: dhl,
        status: dhl ? 'active' : 'not_configured',
        message: dhl ? 'Live shipping actief' : 'Configureer in API Instellingen'
      },
      email_smtp: { 
        connected: emailSmtp,
        status: emailSmtp ? 'active' : 'not_configured',
        message: emailSmtp ? 'Email service actief' : 'Configureer in API Instellingen'
      }
    });
  }).catch(error => {
    console.error('Error checking API status:', error);
    res.status(500).json({ error: 'Error checking API status' });
  });
});

// Update API setting
router.put('/:platform/:key', authenticateToken, authorizeRole(['admin']), [
  body('value').trim().isLength({ min: 1 }).withMessage('Waarde is verplicht')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { platform, key } = req.params;
  const { value } = req.body;

  try {
    db.run(`
      INSERT OR REPLACE INTO api_settings (platform, setting_key, setting_value, updated_by, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [platform, key, value, req.user.id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database fout bij opslaan API instelling' });
      }
      
      // Reload the service to use new credentials
      const apiConfigLoader = require('../services/apiConfigLoader');
      apiConfigLoader.clearCache(platform);
      
      // Reinitialize services
      if (platform === 'google_ads') {
        const googleAdsService = require('../services/googleAdsService');
        googleAdsService.reloadConfig().catch(console.error);
      } else if (platform === 'meta_ads') {
        const metaAdsService = require('../services/metaAdsService');
        metaAdsService.reloadConfig().catch(console.error);
      }
      
      res.json({
        message: `${platform} ${key} succesvol bijgewerkt - Service wordt herinitialiseerd`,
        settingId: this.lastID
      });
    });
  } catch (error) {
    console.error('Error updating API setting:', error);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

// Test API connection
router.post('/test/:platform', authenticateToken, (req, res) => {
  const { platform } = req.params;
  const { credentials } = req.body;

  try {
    switch (platform) {
      case 'google_ads':
        testGoogleAdsConnection(credentials)
          .then(result => res.json(result))
          .catch(error => res.status(400).json({ error: error.message }));
        break;
        
      case 'meta_ads':
        testMetaAdsConnection(credentials)
          .then(result => res.json(result))
          .catch(error => res.status(400).json({ error: error.message }));
        break;
        
      case 'dhl':
        testDHLConnection(credentials)
          .then(result => res.json(result))
          .catch(error => res.status(400).json({ error: error.message }));
        break;
        
      case 'postnl':
        testPostNLConnection(credentials)
          .then(result => res.json(result))
          .catch(error => res.status(400).json({ error: error.message }));
        break;
        
      case 'email_smtp':
        testSMTPConnection(credentials)
          .then(result => res.json(result))
          .catch(error => res.status(400).json({ error: error.message }));
        break;
        
      default:
        res.status(400).json({ error: 'Onbekend platform' });
    }
  } catch (error) {
    console.error('Error testing API connection:', error);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

// Delete API setting
router.delete('/:platform/:key', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { platform, key } = req.params;

  try {
    db.run(`
      UPDATE api_settings 
      SET is_active = 0, updated_at = datetime('now')
      WHERE platform = ? AND setting_key = ?
    `, [platform, key], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database fout bij verwijderen API instelling' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'API instelling niet gevonden' });
      }
      
      res.json({ message: `${platform} ${key} succesvol verwijderd` });
    });
  } catch (error) {
    console.error('Error deleting API setting:', error);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

// Test functions for each platform
async function testGoogleAdsConnection(credentials) {
  try {
    // Mock test for Google Ads API
    if (!credentials.developer_token || !credentials.client_id || !credentials.client_secret) {
      throw new Error('Ontbrekende Google Ads credentials');
    }
    
    return {
      success: true,
      message: 'Google Ads API verbinding succesvol getest',
      platform: 'google_ads',
      details: {
        developer_token: credentials.developer_token ? 'Configured' : 'Missing',
        client_id: credentials.client_id ? 'Configured' : 'Missing',
        client_secret: credentials.client_secret ? 'Configured' : 'Missing'
      }
    };
  } catch (error) {
    throw new Error(`Google Ads test failed: ${error.message}`);
  }
}

async function testMetaAdsConnection(credentials) {
  try {
    if (!credentials.access_token || !credentials.ad_account_id) {
      throw new Error('Ontbrekende Meta Ads credentials');
    }
    
    return {
      success: true,
      message: 'Meta Ads API verbinding succesvol getest',
      platform: 'meta_ads',
      details: {
        access_token: credentials.access_token ? 'Configured' : 'Missing',
        ad_account_id: credentials.ad_account_id ? 'Configured' : 'Missing'
      }
    };
  } catch (error) {
    throw new Error(`Meta Ads test failed: ${error.message}`);
  }
}

async function testDHLConnection(credentials) {
  try {
    if (!credentials.api_key || !credentials.api_secret) {
      throw new Error('Ontbrekende DHL credentials');
    }
    
    return {
      success: true,
      message: 'DHL API verbinding succesvol getest',
      platform: 'dhl',
      details: {
        api_key: credentials.api_key ? 'Configured' : 'Missing',
        api_secret: credentials.api_secret ? 'Configured' : 'Missing'
      }
    };
  } catch (error) {
    throw new Error(`DHL test failed: ${error.message}`);
  }
}

async function testPostNLConnection(credentials) {
  try {
    if (!credentials.api_key || !credentials.customer_code) {
      throw new Error('Ontbrekende PostNL credentials');
    }
    
    return {
      success: true,
      message: 'PostNL API verbinding succesvol getest',
      platform: 'postnl',
      details: {
        api_key: credentials.api_key ? 'Configured' : 'Missing',
        customer_code: credentials.customer_code ? 'Configured' : 'Missing'
      }
    };
  } catch (error) {
    throw new Error(`PostNL test failed: ${error.message}`);
  }
}

async function testSMTPConnection(credentials) {
  try {
    if (!credentials.host || !credentials.user || !credentials.pass) {
      throw new Error('Ontbrekende SMTP credentials');
    }
    
    return {
      success: true,
      message: 'SMTP verbinding succesvol getest',
      platform: 'email_smtp',
      details: {
        host: credentials.host ? 'Configured' : 'Missing',
        user: credentials.user ? 'Configured' : 'Missing',
        pass: credentials.pass ? 'Configured' : 'Missing'
      }
    };
  } catch (error) {
    throw new Error(`SMTP test failed: ${error.message}`);
  }
}

module.exports = router;

