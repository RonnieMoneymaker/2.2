const axios = require('axios');

class MetaAdsService {
  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN;
    this.adAccountId = process.env.META_AD_ACCOUNT_ID;
    this.apiVersion = 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  async getCampaigns() {
    try {
      if (!this.accessToken || !this.adAccountId) {
        console.log('⚠️ Meta Ads credentials niet gevonden - gebruik mock data');
        return this.getMockCampaigns();
      }

      const response = await axios.get(`${this.baseUrl}/act_${this.adAccountId}/campaigns`, {
        params: {
          access_token: this.accessToken,
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
      if (!this.accessToken || !this.adAccountId) {
        return this.getMockMetrics();
      }

      const response = await axios.get(`${this.baseUrl}/act_${this.adAccountId}/insights`, {
        params: {
          access_token: this.accessToken,
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
      if (!this.accessToken || !this.adAccountId) {
        console.log('🔄 Mock: Meta campaign zou worden aangemaakt:', campaignData.name);
        return { success: true, id: `mock_meta_${Date.now()}`, message: 'Mock Meta campaign created' };
      }

      const response = await axios.post(`${this.baseUrl}/act_${this.adAccountId}/campaigns`, {
        name: campaignData.name,
        status: 'PAUSED',
        objective: campaignData.objective || 'OUTCOME_SALES',
        special_ad_categories: [],
        access_token: this.accessToken
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
    return [
      {
        id: 'meta_1',
        name: 'Webshop - Facebook Traffic',
        status: 'ACTIVE',
        startTime: '2024-01-15T00:00:00+0000',
        stopTime: null,
        cost: 350.25,
        impressions: 12500,
        clicks: 675,
        conversions: 19,
        conversionsValue: 1895.50,
        ctr: 5.40,
        cpc: 0.52,
        roas: 5.41
      },
      {
        id: 'meta_2',
        name: 'Webshop - Instagram Shopping',
        status: 'ACTIVE',
        startTime: '2024-02-01T00:00:00+0000',
        stopTime: null,
        cost: 280.75,
        impressions: 9800,
        clicks: 445,
        conversions: 14,
        conversionsValue: 1320.80,
        ctr: 4.54,
        cpc: 0.63,
        roas: 4.70
      }
    ];
  }

  getMockMetrics() {
    return {
      cost: 631.00,
      impressions: 22300,
      clicks: 1120,
      conversions: 33,
      conversionsValue: 3216.30,
      ctr: '5.02',
      cpc: '0.56',
      roas: '5.10'
    };
  }
}

module.exports = new MetaAdsService();
