const { GoogleAdsApi, enums } = require('google-ads-api');

class GoogleAdsService {
  constructor() {
    this.client = null;
    this.customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    this.developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    this.clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    this.refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
    
    this.initializeClient();
  }

  initializeClient() {
    try {
      if (!this.developerToken || !this.clientId || !this.clientSecret || !this.refreshToken) {
        console.log('⚠️ Google Ads credentials niet gevonden in .env - gebruik mock data');
        return;
      }

      this.client = new GoogleAdsApi({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        developer_token: this.developerToken,
      });

      console.log('✅ Google Ads API client geïnitialiseerd');
    } catch (error) {
      console.error('❌ Error initializing Google Ads client:', error);
    }
  }

  async getCampaigns() {
    try {
      if (!this.client || !this.customerId) {
        return this.getMockCampaigns();
      }

      const customer = this.client.Customer({
        customer_id: this.customerId,
        refresh_token: this.refreshToken,
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
      if (!this.client || !this.customerId) {
        return this.getMockMetrics();
      }

      const customer = this.client.Customer({
        customer_id: this.customerId,
        refresh_token: this.refreshToken,
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
      if (!this.client || !this.customerId) {
        console.log('🔄 Mock: Campaign zou worden aangemaakt:', campaignData.name);
        return { success: true, id: `mock_${Date.now()}`, message: 'Mock campaign created' };
      }

      const customer = this.client.Customer({
        customer_id: this.customerId,
        refresh_token: this.refreshToken,
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
    return [
      {
        id: '1',
        name: 'Webshop - Search Campaign',
        status: 'ENABLED',
        startDate: '2024-01-01',
        endDate: null,
        cost: 450.75,
        impressions: 15420,
        clicks: 892,
        conversions: 23,
        conversionsValue: 2150.30,
        ctr: 5.78,
        cpc: 0.51,
        roas: 4.77
      },
      {
        id: '2',
        name: 'Webshop - Shopping Campaign',
        status: 'ENABLED',
        startDate: '2024-02-01',
        endDate: null,
        cost: 320.50,
        impressions: 8950,
        clicks: 456,
        conversions: 18,
        conversionsValue: 1680.90,
        ctr: 5.09,
        cpc: 0.70,
        roas: 5.24
      }
    ];
  }

  getMockMetrics() {
    return {
      cost: 771.25,
      impressions: 24370,
      clicks: 1348,
      conversions: 41,
      conversionsValue: 3831.20,
      ctr: '5.53',
      cpc: '0.57',
      roas: '4.97'
    };
  }
}

module.exports = new GoogleAdsService();
