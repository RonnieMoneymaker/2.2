import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Users, AlertTriangle, Target, Zap, DollarSign, Radio, Flame, Award, AlertCircle, ArrowUp, ArrowDown, Pause } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import Layout from '../components/Layout/Layout';

interface ROASRecommendation {
  type: string;
  title: string;
  description: string;
  action: string;
  profitImpact: number;
  confidence: number;
  priority: number;
  timeframe: string;
  roasScore: number;
  investment?: number;
  steps?: string[];
}

const EnhancedAIInsights: React.FC = () => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    generateEnhancedInsights();
    
    if (autoRefresh) {
      const interval = setInterval(generateEnhancedInsights, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedTimeframe, autoRefresh]);

  const generateEnhancedInsights = () => {
    // Enhanced mock data with ROAS-based recommendations
    const mockInsights = {
      roasAnalysis: {
        overall: { roas: 5.87, profitability: 'excellent', trend: 'up' },
        googleAds: { 
          roas: 6.32, 
          spend: 450.75, 
          revenue: 2847.50,
          status: 'excellent',
          campaigns: [
            { name: 'Search - Premium', roas: 8.4, spend: 180, revenue: 1512, status: 'excellent' },
            { name: 'Shopping - All', roas: 5.8, spend: 150, revenue: 870, status: 'excellent' },
            { name: 'Display - Retargeting', roas: 2.1, spend: 120.75, revenue: 253.58, status: 'poor' }
          ]
        },
        metaAds: { 
          roas: 5.24, 
          spend: 320.50, 
          revenue: 1680.90,
          status: 'excellent',
          campaigns: [
            { name: 'Facebook - Lookalike', roas: 6.7, spend: 180, revenue: 1206, status: 'excellent' },
            { name: 'Instagram - Stories', roas: 3.8, spend: 140.50, revenue: 534.90, status: 'good' }
          ]
        }
      },
      recommendations: [
        {
          type: '🚀 SCALE UP HIGH PERFORMERS',
          title: 'Google Search Campaign - ROAS Monster (8.4x)',
          description: 'Deze campaign is een absolute goudmijn! Elke €1 wordt €8.40 - dit is uitzonderlijk goed.',
          action: '💰 Verhoog budget van €180 naar €500/maand (+€320 investment)',
          profitImpact: 2368,
          confidence: 96,
          priority: 95,
          timeframe: '4-6 weken',
          roasScore: 8.4,
          investment: 320,
          steps: [
            '1. Verhoog dagelijks budget van €6 naar €16.50',
            '2. Voeg 5-10 nieuwe high-performing keywords toe',
            '3. Test 2-3 nieuwe ad variations',
            '4. Monitor performance weekly en optimaliseer'
          ]
        },
        {
          type: '🚨 URGENT FIX',
          title: 'Google Display - GELD VERLIES (2.1x ROAS)',
          description: 'KRITIEK! Deze campaign verliest geld. 2.1x ROAS is ver onder break-even van 3.0x',
          action: '⛔ STOP deze campaign VANDAAG en herstructureer targeting',
          profitImpact: 120.75,
          confidence: 95,
          priority: 98,
          timeframe: 'Onmiddellijk',
          roasScore: 2.1,
          investment: -120.75,
          steps: [
            '1. Pauzeer Display campaign NU',
            '2. Analyseer welke audiences slecht presteren', 
            '3. Hermaak met alleen high-value customers',
            '4. Test met 50% lager budget'
          ]
        },
        {
          type: '💎 FACEBOOK SCALING',
          title: 'Facebook Lookalike - Scale Opportunity (6.7x)',
          description: 'Lookalike audiences presteren excellent. Perfect voor scaling.',
          action: '📈 Maak 3 nieuwe lookalike audiences + verhoog budget €200',
          profitImpact: 1140,
          confidence: 89,
          priority: 88,
          timeframe: '3-4 weken',
          roasScore: 6.7,
          investment: 200
        },
        {
          type: '📦 PRODUCT + ROAS COMBO',
          title: 'Premium T-Shirt - Perfect Storm Alert',
          description: 'TRIPLE THREAT: Hoge ROAS (7.2x) + Lage voorraad (12 stuks) + Q4 seizoen komt',
          action: '🔥 URGENT: Bestel 500 stuks + boost ads budget €300',
          profitImpact: 12950,
          confidence: 91,
          priority: 94,
          timeframe: '3-4 weken',
          roasScore: 7.2,
          investment: 8800
        }
      ],
      totalProfitPotential: 16578.75,
      businessHealth: {
        overall: 87,
        roas: { score: 92, status: 'excellent' },
        profit: { score: 85, status: 'good' },
        growth: { score: 88, status: 'good' },
        customer: { score: 83, status: 'good' }
      },
      liveAlerts: [
        {
          type: 'roas_spike',
          severity: 'high',
          title: '🔥 LIVE ROAS SPIKE!',
          message: 'Google Search ROAS steeg naar 9.1x in laatste 2 uur - verhoog budget NU!',
          action: 'Verhoog budget onmiddellijk',
          timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        },
        {
          type: 'inventory_critical',
          severity: 'urgent', 
          title: '📦 KRITIEKE VOORRAAD',
          message: 'Premium T-Shirt: 12 stuks over + 7.2x ROAS + 15 orders vandaag',
          action: 'Bestel bij VANDAAG',
          timestamp: new Date(Date.now() - 12 * 60 * 1000) // 12 minutes ago
        }
      ]
    };

    setInsights(mockInsights);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getROASColor = (roas: number) => {
    if (roas >= 5.0) return 'text-green-600 bg-green-100';
    if (roas >= 3.0) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriorityIcon = (priority: number) => {
    if (priority >= 95) return <Flame className="h-5 w-5 text-red-500" />;
    if (priority >= 90) return <AlertCircle className="h-5 w-5 text-orange-500" />;
    if (priority >= 80) return <Target className="h-5 w-5 text-blue-500" />;
    return <Brain className="h-5 w-5 text-gray-500" />;
  };

  const getActionIcon = (type: string) => {
    if (type.includes('SCALE UP')) return <ArrowUp className="h-5 w-5 text-green-500" />;
    if (type.includes('URGENT FIX') || type.includes('STOP')) return <Pause className="h-5 w-5 text-red-500" />;
    return <Target className="h-5 w-5 text-blue-500" />;
  };

  if (loading) {
    return (
      <Layout title="AI Insights">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="🧠 AI Business Intelligence">
      <div className="space-y-6">
        {/* Header with Live Status */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Brain className="h-8 w-8 text-indigo-600 mr-3" />
              🧠 AI Business Intelligence
            </h1>
            <p className="text-gray-600 mt-1">Smart aanbevelingen op basis van ROAS en real-time prestatie data</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Radio className={`h-5 w-5 ${autoRefresh ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">
                {autoRefresh ? 'LIVE UPDATES' : 'PAUSED'}
              </span>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-xs rounded-full ${autoRefresh ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
            >
              {autoRefresh ? 'Live Aan' : 'Live Uit'}
            </button>
          </div>
        </div>

        {/* Live Alerts */}
        {insights.liveAlerts && insights.liveAlerts.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border-l-4 border-red-400">
            <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
              <Zap className="h-5 w-5 mr-2 animate-pulse" />
              🚨 LIVE ALERTS - Onmiddellijke Actie Vereist
            </h3>
            <div className="space-y-2">
              {insights.liveAlerts.map((alert: any, index: number) => (
                <div key={index} className="bg-white p-3 rounded border-l-4 border-red-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-700">{alert.message}</p>
                      <p className="text-sm font-medium text-red-600 mt-1">👉 {alert.action}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round((new Date().getTime() - alert.timestamp.getTime()) / (1000 * 60))}m geleden
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROAS Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 text-green-500 mr-2" />
              🎯 ROAS Performance
            </h3>
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{insights.roasAnalysis.overall.roas}x</p>
                <p className="text-sm text-gray-600">Overall ROAS</p>
                <p className="text-xs text-green-600">Excellent Performance!</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm">Google Ads</span>
                  <span className={`text-sm font-bold px-2 py-1 rounded ${getROASColor(insights.roasAnalysis.googleAds.roas)}`}>
                    {insights.roasAnalysis.googleAds.roas}x
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="text-sm">Meta Ads</span>
                  <span className={`text-sm font-bold px-2 py-1 rounded ${getROASColor(insights.roasAnalysis.metaAds.roas)}`}>
                    {insights.roasAnalysis.metaAds.roas}x
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 text-yellow-500 mr-2" />
              💡 Business Health Score
            </h3>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - insights.businessHealth.overall / 100)}`}
                    className="text-green-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{insights.businessHealth.overall}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Excellent Health</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 text-green-500 mr-2" />
              💰 Profit Potential
            </h3>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{formatCurrency(insights.totalProfitPotential)}</p>
              <p className="text-sm text-gray-600 mb-4">Totaal Winst Potentieel</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Onmiddellijk:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(2488.75)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kort termijn:</span>
                  <span className="font-semibold text-yellow-600">{formatCurrency(12950)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Strategisch:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(1140)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Recommendations */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Zap className="h-6 w-6 text-yellow-500 mr-3" />
            🎯 ROAS-Based Smart Aanbevelingen
          </h3>
          
          <div className="space-y-4">
            {insights.recommendations.map((rec: ROASRecommendation, index: number) => (
              <div key={index} className={`p-6 rounded-lg border-l-4 ${
                rec.priority >= 95 ? 'bg-red-50 border-red-500' :
                rec.priority >= 90 ? 'bg-orange-50 border-orange-500' :
                rec.priority >= 80 ? 'bg-blue-50 border-blue-500' :
                'bg-gray-50 border-gray-500'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    {getPriorityIcon(rec.priority)}
                    <div className="ml-3">
                      <h4 className="text-lg font-bold text-gray-900">{rec.title}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${getROASColor(rec.roasScore)}`}>
                          {rec.roasScore}x ROAS
                        </span>
                        <span className="text-xs text-gray-500">Confidence: {rec.confidence}%</span>
                        <span className="text-xs text-gray-500">{rec.timeframe}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">+{formatCurrency(rec.profitImpact)}</p>
                    <p className="text-xs text-gray-500">winst impact</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3">{rec.description}</p>
                
                <div className="bg-white p-3 rounded border">
                  <p className="font-semibold text-gray-900 flex items-center mb-2">
                    {getActionIcon(rec.type)}
                    <span className="ml-2">ACTIE PLAN:</span>
                  </p>
                  <p className="text-sm text-gray-700 mb-3">{rec.action}</p>
                  
                  {rec.steps && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Stappen:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {rec.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start">
                            <span className="text-indigo-500 mr-2">•</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Performance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Google Ads Campaign ROAS</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insights.roasAnalysis.googleAds.campaigns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'roas' ? `${value}x ROAS` : formatCurrency(value),
                    name === 'roas' ? 'ROAS' : name === 'spend' ? 'Spend' : 'Revenue'
                  ]}
                />
                <Bar dataKey="roas" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Meta Ads Campaign ROAS</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insights.roasAnalysis.metaAds.campaigns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'roas' ? `${value}x ROAS` : formatCurrency(value),
                    name === 'roas' ? 'ROAS' : name === 'spend' ? 'Spend' : 'Revenue'
                  ]}
                />
                <Bar dataKey="roas" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Summary */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg text-white">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Zap className="h-6 w-6 mr-3" />
            🎯 ACTIE SAMENVATTING - IMPLEMENTEER NU
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">€2.489</p>
              <p className="text-sm opacity-90">Onmiddellijke Winst</p>
              <p className="text-xs opacity-75">(Stop Display campaign)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">€12.950</p>
              <p className="text-sm opacity-90">Kort Termijn Winst</p>
              <p className="text-xs opacity-75">(Product scaling)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">€16.579</p>
              <p className="text-sm opacity-90">Totaal Potentieel</p>
              <p className="text-xs opacity-75">(Alle aanbevelingen)</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EnhancedAIInsights;
