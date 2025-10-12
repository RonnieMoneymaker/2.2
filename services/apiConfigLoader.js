const { db } = require('../database/init');

/**
 * API Configuration Loader
 * Loads API credentials from database OR environment variables
 * Database settings have priority over .env
 */
class ApiConfigLoader {
  constructor() {
    this.cache = {};
    this.cacheExpiry = {};
    this.cacheDuration = 60000; // 1 minute cache
  }

  /**
   * Get API configuration for a platform
   * @param {string} platform - Platform name (google_ads, meta_ads, etc.)
   * @returns {Promise<Object>} - Configuration object
   */
  async getConfig(platform) {
    // Check cache first
    const now = Date.now();
    if (this.cache[platform] && this.cacheExpiry[platform] > now) {
      return this.cache[platform];
    }

    return new Promise((resolve, reject) => {
      db.all(`
        SELECT setting_key, setting_value 
        FROM api_settings 
        WHERE platform = ? AND is_active = 1
      `, [platform], (err, rows) => {
        if (err) {
          console.error(`Error loading ${platform} config from database:`, err);
          // Fallback to environment variables
          resolve(this.getEnvConfig(platform));
          return;
        }

        // Convert rows to object
        const dbConfig = {};
        rows.forEach(row => {
          dbConfig[row.setting_key] = row.setting_value;
        });

        // If no database config, use environment variables
        if (Object.keys(dbConfig).length === 0) {
          const envConfig = this.getEnvConfig(platform);
          this.cache[platform] = envConfig;
          this.cacheExpiry[platform] = now + this.cacheDuration;
          resolve(envConfig);
          return;
        }

        // Database config found - use it
        this.cache[platform] = dbConfig;
        this.cacheExpiry[platform] = now + this.cacheDuration;
        resolve(dbConfig);
      });
    });
  }

  /**
   * Get configuration from environment variables
   * @param {string} platform 
   * @returns {Object}
   */
  getEnvConfig(platform) {
    const configs = {
      google_ads: {
        developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        client_id: process.env.GOOGLE_ADS_CLIENT_ID,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
        customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID
      },
      meta_ads: {
        access_token: process.env.META_ACCESS_TOKEN,
        ad_account_id: process.env.META_AD_ACCOUNT_ID,
        app_id: process.env.META_APP_ID,
        app_secret: process.env.META_APP_SECRET
      },
      dhl: {
        api_key: process.env.DHL_API_KEY,
        api_secret: process.env.DHL_API_SECRET,
        account_number: process.env.DHL_ACCOUNT_NUMBER,
        environment: process.env.DHL_ENVIRONMENT || 'sandbox'
      },
      email_smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    return configs[platform] || {};
  }

  /**
   * Check if a platform is configured
   * @param {string} platform 
   * @returns {Promise<boolean>}
   */
  async isConfigured(platform) {
    const config = await this.getConfig(platform);
    const requiredFields = this.getRequiredFields(platform);
    
    return requiredFields.every(field => config[field]);
  }

  /**
   * Get required fields for a platform
   * @param {string} platform 
   * @returns {Array<string>}
   */
  getRequiredFields(platform) {
    const required = {
      google_ads: ['developer_token', 'client_id', 'client_secret', 'refresh_token', 'customer_id'],
      meta_ads: ['access_token', 'ad_account_id'],
      dhl: ['api_key', 'api_secret', 'account_number'],
      email_smtp: ['host', 'port', 'user', 'pass']
    };

    return required[platform] || [];
  }

  /**
   * Clear cache for a platform (call after updating credentials)
   * @param {string} platform 
   */
  clearCache(platform) {
    delete this.cache[platform];
    delete this.cacheExpiry[platform];
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache = {};
    this.cacheExpiry = {};
  }
}

module.exports = new ApiConfigLoader();

