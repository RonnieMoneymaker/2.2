const { GoogleAdsApi, enums } = require('google-ads-api');
const apiConfigLoader = require('./apiConfigLoader');

class GoogleAdsService {
  constructor() {
    this.client = null;
    this.config = null;
    this.initializeClient();
  }

  async initializeClient() {
    try {
      // Load config from database OR .env
      this.config = await apiConfigLoader.getConfig('google_ads');
      
      if (!this.config.developer_token || !this.config.client_id || !this.config.client_secret || !this.config.refresh_token) {
        console.log('⚠️ Google Ads credentials niet gevonden - API niet actief');
        console.log('💡 Configureer via API Instellingen of voeg toe aan .env');
        return;
      }

      this.client = new GoogleAdsApi({
        client_id: this.config.client_id,
        client_secret: this.config.client_secret,
        developer_token: this.config.developer_token,
      });

      console.log('✅ Google Ads API client geïnitialiseerd - LIVE DATA ACTIEF!');
    } catch (error) {
      console.error('❌ Error initializing Google Ads client:', error);
    }
  }

  async reloadConfig() {
    apiConfigLoader.clearCache('google_ads');
    await this.initializeClient();
  }

  async getCampaigns() {
    try {
      if (!this.client || !this.config || !this.config.customer_id) {
        return this.getMockCampaigns();
      }

      const customer = this.client.Customer({
        customer_id: this.config.customer_id,
        refresh_token: this.config.refresh_token,
      });

      const campaigns = await customer.query(`
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.start_date,
          campaign.end_date,
          metrics.cost_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign
        WHERE campaign.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
      `);

      return campaigns.map(campaign => ({
        id: campaign.campaign.id,
        name: campaign.campaign.name,
        status: campaign.campaign.status,
        startDate: campaign.campaign.start_date,
        endDate: campaign.campaign.end_date,
        cost: campaign.metrics.cost_micros / 1000000, // Convert from micros to euros
        impressions: campaign.metrics.impressions,
        clicks: campaign.metrics.clicks,
        conversions: campaign.metrics.conversions,
        conversionsValue: campaign.metrics.conversions_value / 1000000,
        ctr: campaign.metrics.clicks / campaign.metrics.impressions * 100,
        cpc: campaign.metrics.cost_micros / campaign.metrics.clicks / 1000000,
        roas: campaign.metrics.conversions_value / campaign.metrics.cost_micros
      }));

    } catch (error) {
      console.error('Error fetching Google Ads campaigns:', error);
      return this.getMockCampaigns();
    }
  }

  async getPerformanceMetrics(dateRange = 'LAST_30_DAYS') {
    try {
      if (!this.client || !this.config || !this.config.customer_id) {
        return this.getMockMetrics();
      }

      const customer = this.client.Customer({
        customer_id: this.config.customer_id,
        refresh_token: this.config.refresh_token,
      });

      const metrics = await customer.query(`
        SELECT 
          metrics.cost_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.conversions_value,
          segments.date
        FROM customer
        WHERE segments.date DURING ${dateRange}
      `);

      const totalMetrics = metrics.reduce((acc, metric) => ({
        cost: acc.cost + (metric.metrics.cost_micros / 1000000),
        impressions: acc.impressions + metric.metrics.impressions,
        clicks: acc.clicks + metric.metrics.clicks,
        conversions: acc.conversions + metric.metrics.conversions,
        conversionsValue: acc.conversionsValue + (metric.metrics.conversions_value / 1000000)
      }), { cost: 0, impressions: 0, clicks: 0, conversions: 0, conversionsValue: 0 });

      return {
        ...totalMetrics,
        ctr: (totalMetrics.clicks / totalMetrics.impressions * 100).toFixed(2),
        cpc: (totalMetrics.cost / totalMetrics.clicks).toFixed(2),
        roas: (totalMetrics.conversionsValue / totalMetrics.cost).toFixed(2)
      };

    } catch (error) {
      console.error('Error fetching Google Ads metrics:', error);
      return this.getMockMetrics();
    }
  }

  async createCampaign(campaignData) {
    try {
      if (!this.client || !this.config || !this.config.customer_id) {
        console.log('🔄 Google Ads niet geconfigureerd - kan geen campaign aanmaken');
        return { success: false, error: 'Google Ads API niet geconfigureerd' };
      }

      const customer = this.client.Customer({
        customer_id: this.config.customer_id,
        refresh_token: this.config.refresh_token,
      });

      const campaign = {
        name: campaignData.name,
        status: enums.CampaignStatus.PAUSED,
        advertising_channel_type: enums.AdvertisingChannelType[campaignData.type || 'SEARCH'],
        manual_cpc: {
          enhanced_cpc_enabled: true
        },
        campaign_budget: campaignData.budgetId,
        start_date: campaignData.startDate,
        end_date: campaignData.endDate
      };

      const result = await customer.campaigns.create([campaign]);
      
      return {
        success: true,
        id: result[0].resource_name,
        message: 'Campaign successfully created'
      };

    } catch (error) {
      console.error('Error creating Google Ads campaign:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getMockCampaigns() {
    // No mock data - return empty array when API not connected
    return [];
  }

  getMockMetrics() {
    // No mock data - return zeros when API not connected
    return {
      cost: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      conversionsValue: 0,
      ctr: '0.00',
      cpc: '0.00',
      roas: '0.00'
    };
  }
}

module.exports = new GoogleAdsService();
