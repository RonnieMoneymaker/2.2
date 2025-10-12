const express = require('express');
const axios = require('axios');
const { db } = require('../database/init');
const router = express.Router();

/**
 * OAuth Routes for Easy API Integration
 * Allows users to login with Google/Meta to get API credentials automatically
 */

// Google OAuth - Start
router.get('/google/start', (req, res) => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  
  if (!clientId) {
    return res.status(400).json({ 
      error: 'Google OAuth niet geconfigureerd',
      message: 'Voeg GOOGLE_OAUTH_CLIENT_ID toe aan .env'
    });
  }

  const redirectUri = `${req.protocol}://${req.get('host')}/api/oauth/google/callback`;
  const scope = 'https://www.googleapis.com/auth/adwords';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.redirect(authUrl);
});

// Google OAuth - Callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Autorisatie mislukt - geen code ontvangen');
  }

  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/oauth/google/callback`;

    // Exchange code for tokens
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token } = response.data;

    // Store refresh token in database
    db.run(`
      INSERT OR REPLACE INTO api_settings (platform, setting_key, setting_value, updated_at)
      VALUES 
        ('google_ads', 'client_id', ?, datetime('now')),
        ('google_ads', 'client_secret', ?, datetime('now')),
        ('google_ads', 'refresh_token', ?, datetime('now'))
    `, [clientId, clientSecret, refresh_token], (err) => {
      if (err) {
        console.error('Error saving Google OAuth tokens:', err);
        return res.status(500).send('Error bij opslaan credentials');
      }

      // Reload Google Ads service
      const apiConfigLoader = require('../services/apiConfigLoader');
      apiConfigLoader.clearCache('google_ads');
      
      const googleAdsService = require('../services/googleAdsService');
      googleAdsService.reloadConfig().catch(console.error);

      // Success page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Ads Gekoppeld!</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; background: #f5f5f5; }
            .success { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #10B981; }
            button { background: #3B82F6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px; }
            button:hover { background: #2563EB; }
          </style>
        </head>
        <body>
          <div class="success">
            <div class="icon">✅</div>
            <h1>Google Ads Succesvol Gekoppeld!</h1>
            <p>Je Google Ads account is nu verbonden met het CMS.</p>
            <p><strong>Live data wordt nu automatisch gesynchroniseerd!</strong></p>
            <button onclick="window.close(); window.opener.location.reload();">Sluit venster en ververs CMS</button>
          </div>
        </body>
        </html>
      `);
    });

  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    res.status(500).send('OAuth error: ' + error.message);
  }
});

// Meta OAuth - Start
router.get('/meta/start', (req, res) => {
  const appId = process.env.META_APP_ID;
  
  if (!appId) {
    return res.status(400).json({ 
      error: 'Meta OAuth niet geconfigureerd',
      message: 'Voeg META_APP_ID toe aan .env'
    });
  }

  const redirectUri = `${req.protocol}://${req.get('host')}/api/oauth/meta/callback`;
  const scope = 'ads_management,ads_read';
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${appId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${scope}&` +
    `response_type=code`;

  res.redirect(authUrl);
});

// Meta OAuth - Callback
router.get('/meta/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Autorisatie mislukt - geen code ontvangen');
  }

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/oauth/meta/callback`;

    // Exchange code for access token
    const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code
      }
    });

    const { access_token } = response.data;

    // Get long-lived token
    const longLivedResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: access_token
      }
    });

    const longLivedToken = longLivedResponse.data.access_token;

    // Store in database
    db.run(`
      INSERT OR REPLACE INTO api_settings (platform, setting_key, setting_value, updated_at)
      VALUES 
        ('meta_ads', 'access_token', ?, datetime('now')),
        ('meta_ads', 'app_id', ?, datetime('now')),
        ('meta_ads', 'app_secret', ?, datetime('now'))
    `, [longLivedToken, appId, appSecret], (err) => {
      if (err) {
        console.error('Error saving Meta OAuth tokens:', err);
        return res.status(500).send('Error bij opslaan credentials');
      }

      // Reload Meta Ads service
      const apiConfigLoader = require('../services/apiConfigLoader');
      apiConfigLoader.clearCache('meta_ads');
      
      const metaAdsService = require('../services/metaAdsService');
      metaAdsService.reloadConfig().catch(console.error);

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Meta Ads Gekoppeld!</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; background: #f5f5f5; }
            .success { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #10B981; }
            button { background: #3B82F6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px; }
            button:hover { background: #2563EB; }
          </style>
        </head>
        <body>
          <div class="success">
            <div class="icon">✅</div>
            <h1>Meta Ads Succesvol Gekoppeld!</h1>
            <p>Je Facebook/Instagram Ads account is nu verbonden.</p>
            <p><strong>Live data wordt nu automatisch gesynchroniseerd!</strong></p>
            <button onclick="window.close(); window.opener.location.reload();">Sluit venster en ververs CMS</button>
          </div>
        </body>
        </html>
      `);
    });

  } catch (error) {
    console.error('Error in Meta OAuth callback:', error);
    res.status(500).send('OAuth error: ' + error.message);
  }
});

// OAuth Status Check
router.get('/status', (req, res) => {
  res.json({
    google_oauth_enabled: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
    meta_oauth_enabled: !!process.env.META_APP_ID,
    message: 'OAuth endpoints beschikbaar voor automatische koppeling'
  });
});

module.exports = router;

