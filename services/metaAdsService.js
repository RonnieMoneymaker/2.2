const axios = require('axios');
const apiConfigLoader = require('./apiConfigLoader');

class MetaAdsService {
  constructor() {
    this.config = null;
    this.apiVersion = 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    this.initializeClient();
  }

  async initializeClient() {
    try {
      // Load config from database OR .env
      this.config = await apiConfigLoader.getConfig('meta_ads');
      
      if (!this.config.access_token || !this.config.ad_account_id) {
        console.log('⚠️ Meta Ads credentials niet gevonden - API niet actief');
        console.log('💡 Configureer via API Instellingen of voeg toe aan .env');
        return;
      }

      console.log('✅ Meta Ads API client geïnitialiseerd - LIVE DATA ACTIEF!');
    } catch (error) {
      console.error('❌ Error initializing Meta Ads client:', error);
    }
  }

  async reloadConfig() {
    apiConfigLoader.clearCache('meta_ads');
    await this.initializeClient();
  }

  async getCampaigns() {
    try {
      if (!this.config || !this.config.access_token || !this.config.ad_account_id) {
        return this.getMockCampaigns();
      }

      const response = await axios.get(`${this.baseUrl}/act_${this.config.ad_account_id}/campaigns`, {
        params: {
          access_token: this.config.access_token,
          fields: 'id,name,status,start_time,stop_time,insights{spend,impressions,clicks,actions,action_values}',
          limit: 100
        }
      });

      return response.data.data.map(campaign => {
        const insights = campaign.insights?.data?.[0] || {};
        const purchases = insights.actions?.find(action => action.action_type === 'purchase')?.value || 0;
        const purchaseValue = insights.action_values?.find(action => action.action_type === 'purchase')?.value || 0;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          startTime: campaign.start_time,
          stopTime: campaign.stop_time,
          cost: parseFloat(insights.spend || 0),
          impressions: parseInt(insights.impressions || 0),
          clicks: parseInt(insights.clicks || 0),
          conversions: parseInt(purchases),
          conversionsValue: parseFloat(purchaseValue),
          ctr: insights.impressions ? (insights.clicks / insights.impressions * 100).toFixed(2) : 0,
          cpc: insights.clicks ? (insights.spend / insights.clicks).toFixed(2) : 0,
          roas: insights.spend ? (purchaseValue / insights.spend).toFixed(2) : 0
        };
      });

    } catch (error) {
      console.error('Error fetching Meta Ads campaigns:', error.response?.data || error.message);
      return this.getMockCampaigns();
    }
  }

  async getPerformanceMetrics(dateRange = 'last_30d') {
    try {
      if (!this.config || !this.config.access_token || !this.config.ad_account_id) {
        return this.getMockMetrics();
      }

      const response = await axios.get(`${this.baseUrl}/act_${this.config.ad_account_id}/insights`, {
        params: {
          access_token: this.config.access_token,
          fields: 'spend,impressions,clicks,actions,action_values,ctr,cpc,roas',
          time_range: JSON.stringify({ since: this.getDateRange(dateRange).since, until: this.getDateRange(dateRange).until }),
          level: 'account'
        }
      });

      const insights = response.data.data[0] || {};
      const purchases = insights.actions?.find(action => action.action_type === 'purchase')?.value || 0;
      const purchaseValue = insights.action_values?.find(action => action.action_type === 'purchase')?.value || 0;

      return {
        cost: parseFloat(insights.spend || 0),
        impressions: parseInt(insights.impressions || 0),
        clicks: parseInt(insights.clicks || 0),
        conversions: parseInt(purchases),
        conversionsValue: parseFloat(purchaseValue),
        ctr: insights.ctr || '0',
        cpc: insights.cpc || '0',
        roas: insights.roas || '0'
      };

    } catch (error) {
      console.error('Error fetching Meta Ads metrics:', error.response?.data || error.message);
      return this.getMockMetrics();
    }
  }

  async createCampaign(campaignData) {
    try {
      if (!this.config || !this.config.access_token || !this.config.ad_account_id) {
        console.log('🔄 Meta Ads niet geconfigureerd - kan geen campaign aanmaken');
        return { success: false, error: 'Meta Ads API niet geconfigureerd' };
      }

      const response = await axios.post(`${this.baseUrl}/act_${this.config.ad_account_id}/campaigns`, {
        name: campaignData.name,
        status: 'PAUSED',
        objective: campaignData.objective || 'OUTCOME_SALES',
        special_ad_categories: [],
        access_token: this.config.access_token
      });

      return {
        success: true,
        id: response.data.id,
        message: 'Meta campaign successfully created'
      };

    } catch (error) {
      console.error('Error creating Meta Ads campaign:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  async createAdSet(adSetData) {
    try {
      if (!this.accessToken || !this.adAccountId) {
        console.log('🔄 Mock: Meta ad set zou worden aangemaakt:', adSetData.name);
        return { success: true, id: `mock_adset_${Date.now()}`, message: 'Mock ad set created' };
      }

      const response = await axios.post(`${this.baseUrl}/act_${this.adAccountId}/adsets`, {
        name: adSetData.name,
        campaign_id: adSetData.campaignId,
        status: 'PAUSED',
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'OFFSITE_CONVERSIONS',
        bid_amount: Math.round(adSetData.bidAmount * 100), // Convert to cents
        daily_budget: Math.round(adSetData.dailyBudget * 100),
        targeting: adSetData.targeting || {
          geo_locations: { countries: ['NL'] },
          age_min: 18,
          age_max: 65
        },
        access_token: this.accessToken
      });

      return {
        success: true,
        id: response.data.id,
        message: 'Meta ad set successfully created'
      };

    } catch (error) {
      console.error('Error creating Meta Ads ad set:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  getDateRange(range) {
    const today = new Date();
    const since = new Date();

    switch (range) {
      case 'last_7d':
        since.setDate(today.getDate() - 7);
        break;
      case 'last_30d':
        since.setDate(today.getDate() - 30);
        break;
      case 'last_90d':
        since.setDate(today.getDate() - 90);
        break;
      default:
        since.setDate(today.getDate() - 30);
    }

    return {
      since: since.toISOString().split('T')[0],
      until: today.toISOString().split('T')[0]
    };
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

module.exports = new MetaAdsService();
