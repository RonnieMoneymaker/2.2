import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Target,
  Lightbulb,
  Zap,
  ArrowUp,
  ArrowDown,
  Star
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import StatsCard from '../components/Dashboard/StatsCard';

interface AIRecommendation {
  product_id?: number;
  product_name?: string;
  type: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  confidence: number;
  title?: string;
  reason?: string;
  insight?: string;
  action?: string;
  recommendation?: string;
  expected_impact?: string;
  potential_impact?: string;
  metrics?: any;
}

interface BusinessHealth {
  score: number;
  grade: string;
  breakdown: {
    revenue_growth: number;
    customer_acquisition: number;
    order_volume: number;
    avg_order_value: number;
    repeat_rate: number;
  };
}

interface AIDashboard {
  overview: {
    business_health_score: BusinessHealth;
    total_recommendations: number;
    urgent_actions: number;
    high_priority: number;
  };
  top_recommendations: AIRecommendation[];
}

const AIInsights: React.FC = () => {
  const [aiData, setAiData] = useState<AIDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchAIInsights();
  }, []);

  const fetchAIInsights = async () => {
    try {
      setLoading(true);
      // Mock data for demo - in real app would fetch from /api/ai/dashboard
      const mockData: AIDashboard = {
        overview: {
          business_health_score: {
            score: 75,
            grade: 'B',
            breakdown: {
              revenue_growth: 12.5,
              customer_acquisition: 18,
              order_volume: 156,
              avg_order_value: 101.28,
              repeat_rate: 34.2
            }
          },
          total_recommendations: 12,
          urgent_actions: 2,
          high_priority: 5
        },
        top_recommendations: [
          {
            product_id: 3,
            product_name: 'Sneakers Sport',
            type: 'scale_up',
            priority: 'high',
            confidence: 0.85,
            title: '🚀 SCHAAL OP: Sneakers Sport',
            reason: '✅ Verkoopt 1.2 per dag met 53.4% echte winst (€48.04 per stuk na verzendkosten)',
            action: '📈 ACTIE: Verhoog voorraad van 50 naar 100 stuks en start €200 Google Ads campagne',
            expected_impact: '💰 RESULTAAT: +€1.440/maand extra winst (30 extra verkopen × €48.04)',
            metrics: {
              current_daily_sales: 1.2,
              real_profit_per_unit: 48.04,
              current_stock: 50,
              recommended_stock: 100,
              monthly_potential: 1440
            }
          },
          {
            product_id: 1,
            product_name: 'Premium T-Shirt',
            type: 'restock_urgent',
            priority: 'urgent',
            confidence: 0.95,
            title: '🚨 URGENT: Premium T-Shirt voorraad laag',
            reason: '⚠️ Slechts 150 stuks voorraad bij 1.5 verkoop/dag = 100 dagen voorraad over',
            action: '📦 ACTIE: Bestel NU 200 extra stuks bij TextielGrossier BV (€2.500 investering)',
            expected_impact: '💰 RESULTAAT: Voorkom €2.034/maand omzetverlies (€13.54 winst × 150 stuks)',
            metrics: {
              current_stock: 150,
              days_remaining: 100,
              daily_sales: 1.5,
              profit_per_unit: 13.54,
              risk_amount: 2034
            }
          },
          {
            type: 'customer_segment',
            priority: 'high',
            confidence: 0.90,
            title: '👑 VIP KLANT STRATEGIE: Piet Bakker',
            insight: '🎯 Piet Bakker = 25% van je totale winst! (€180.23 winst van €599.95 besteed)',
            recommendation: '🎁 ACTIE: Stuur persoonlijke email met 15% VIP korting + gratis express verzending',
            potential_impact: '💰 RESULTAAT: VIP klanten besteden 40% meer = +€240/jaar extra winst per VIP klant'
          },
          {
            type: 'conversion_opportunity',
            priority: 'medium',
            confidence: 0.75,
            title: '🎯 CONVERSIE KANS: Anna Smit',
            insight: '📧 Anna Smit registreerde zich maar kocht nog niets - gemiste kans!',
            recommendation: '💌 ACTIE: Stuur vandaag nog welkomstemail met 10% korting code (vervalt over 48u)',
            potential_impact: '💰 RESULTAAT: 30% conversie kans = €26.25 winst (€75 gem. eerste bestelling × 35%)'
          },
          {
            product_id: 2,
            product_name: 'Jeans Classic Fit',
            type: 'increase_marketing',
            priority: 'high',
            confidence: 0.80,
            title: '📢 MARKETING GOUDMIJN: Jeans Classic Fit',
            reason: '💎 Beste product! €50.04 winst per stuk maar verkoopt slechts 1.1/dag',
            action: '🎯 ACTIE: Start €300 Meta Ads campagne targeting "jeans heren 25-45 jaar"',
            expected_impact: '💰 RESULTAAT: +16 verkopen/maand = +€800.64 winst (ROI: 267%!)'
          },
          {
            type: 'seasonal',
            priority: 'high',
            confidence: 0.75,
            title: '🍂 SEIZOEN KANS: Black Friday Voorbereiding',
            insight: '🛍️ Black Friday = 300% verkoop boost! Je bent er nog niet klaar voor',
            recommendation: '⚡ ACTIE: Verhoog ALL voorraad met 200% en plan €1.000 advertising budget voor 25-29 nov',
            potential_impact: '💰 RESULTAAT: Black Friday kan €15.000 extra omzet opleveren (€5.250 winst)'
          }
        ]
      };
      
      setAiData(mockData);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high': return <ArrowUp className="h-5 w-5 text-orange-500" />;
      case 'medium': return <ArrowUp className="h-5 w-5 text-yellow-500" />;
      default: return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-200 bg-red-50';
      case 'high': return 'border-orange-200 bg-orange-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-green-200 bg-green-50';
    }
  };

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'scale_up': return '📈 Opschalen Aanbeveling';
      case 'restock_urgent': return '🚨 Voorraad Urgent';
      case 'increase_marketing': return '📢 Marketing Kans';
      case 'optimize_or_discontinue': return '⚠️ Optimaliseren';
      case 'price_optimization': return '💰 Prijs Optimalisatie';
      case 'customer_segment': return '👥 Klant Segment';
      case 'conversion_opportunity': return '🎯 Conversie Kans';
      case 'seasonal': return '🍂 Seizoen Advies';
      default: return '💡 AI Aanbeveling';
    }
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? aiData?.top_recommendations || []
    : aiData?.top_recommendations.filter(rec => {
        if (selectedCategory === 'products') return rec.product_id;
        if (selectedCategory === 'customers') return rec.type.includes('customer') || rec.type.includes('conversion');
        if (selectedCategory === 'business') return rec.type.includes('seasonal') || rec.type.includes('health');
        return true;
      }) || [];

  if (loading) {
    return (
      <Layout title="AI Inzichten">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="AI Inzichten">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Brain className="h-8 w-8 text-primary-600 mr-3" />
              🤖 AI Business Inzichten
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Concrete acties om meer winst te maken - gebaseerd op je data
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Alle aanbevelingen</option>
              <option value="products">Product aanbevelingen</option>
              <option value="customers">Klant inzichten</option>
              <option value="business">Business strategie</option>
            </select>
            <button
              onClick={fetchAIInsights}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Ververs Analyse
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        {aiData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Business Health Score"
              value={`${aiData.overview.business_health_score.score}/100`}
              change={`Grade: ${aiData.overview.business_health_score.grade}`}
              changeType={aiData.overview.business_health_score.score > 70 ? "positive" : "negative"}
              icon={Target}
              color="purple"
            />
            <StatsCard
              title="Totaal Aanbevelingen"
              value={aiData.overview.total_recommendations}
              change={`${aiData.overview.urgent_actions} urgent`}
              changeType={aiData.overview.urgent_actions > 0 ? "negative" : "positive"}
              icon={Lightbulb}
              color="blue"
            />
            <StatsCard
              title="Hoge Prioriteit"
              value={aiData.overview.high_priority}
              icon={ArrowUp}
              color="yellow"
            />
            <StatsCard
              title="AI Confidence"
              value="85%"
              change="Gebaseerd op data analyse"
              changeType="positive"
              icon={Brain}
              color="green"
            />
          </div>
        )}

        {/* AI Recommendations */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Star className="h-5 w-5 text-yellow-500 mr-2" />
            Top AI Aanbevelingen
          </h2>
          
          {filteredRecommendations.map((rec, index) => (
            <div key={index} className={`border rounded-lg p-6 ${getPriorityColor(rec.priority)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getPriorityIcon(rec.priority)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {rec.title || getTypeTitle(rec.type)}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rec.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        Confidence: {((rec.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    {rec.product_name && (
                      <div className="mb-2">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                          Product: {rec.product_name}
                        </span>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        <strong>Analyse:</strong> {rec.reason || rec.insight}
                      </p>
                      <p className="text-gray-700">
                        <strong>Aanbeveling:</strong> {rec.action || rec.recommendation}
                      </p>
                      {(rec.expected_impact || rec.potential_impact) && (
                        <p className="text-green-700 font-medium">
                          <strong>Verwacht Resultaat:</strong> {rec.expected_impact || rec.potential_impact}
                        </p>
                      )}
                    </div>
                    
                    {rec.metrics && (
                      <div className="mt-4 p-3 bg-white rounded border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Key Metrics:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {Object.entries(rec.metrics).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-gray-500">{key.replace(/_/g, ' ')}:</span>
                              <span className="ml-1 font-medium">
                                {typeof value === 'number' ? 
                                  (key.includes('percentage') ? `${value.toFixed(1)}%` :
                                   key.includes('price') || key.includes('revenue') ? `€${value.toFixed(2)}` :
                                   value.toFixed(1)) : 
                                  String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Implementeer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 text-yellow-500 mr-2" />
            Snelle Acties
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <TrendingUp className="h-6 w-6 text-green-500 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Product Prestatie</div>
                <div className="text-sm text-gray-500">Bekijk welke producten het best verkopen</div>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <Target className="h-6 w-6 text-blue-500 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Marketing Optimalisatie</div>
                <div className="text-sm text-gray-500">Vind de beste marketing kansen</div>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <Brain className="h-6 w-6 text-purple-500 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Voorspellende Analyse</div>
                <div className="text-sm text-gray-500">Voorspel toekomstige trends</div>
              </div>
            </button>
          </div>
        </div>

        {/* Specifieke AI Actie Plan */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3 mb-6">
            <Brain className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">🎯 AI Actie Plan - Specifieke Stappen</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deze Week */}
            <div className="bg-white p-4 rounded-lg border border-red-200">
              <h4 className="font-bold text-red-800 mb-3">🚨 DEZE WEEK (URGENT)</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-red-500 pl-3">
                  <p className="text-sm font-bold text-red-800">1. T-Shirt Voorraad Bestellen</p>
                  <p className="text-xs text-red-600">• Bestel 200 stuks bij TextielGrossier BV</p>
                  <p className="text-xs text-red-600">• Investering: €2.500 (200 × €12.50)</p>
                  <p className="text-xs text-red-600">• Voorkom: €2.034 omzetverlies</p>
                  <p className="text-xs text-red-600">• Actie: Bel maandag 09:00</p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-3">
                  <p className="text-sm font-bold text-yellow-800">2. Anna Smit Conversie</p>
                  <p className="text-xs text-yellow-600">• Stuur welkomstemail met 10% korting</p>
                  <p className="text-xs text-yellow-600">• Code: WELKOM10 (48u geldig)</p>
                  <p className="text-xs text-yellow-600">• Conversie kans: 30% = €26.25 winst</p>
                  <p className="text-xs text-yellow-600">• Actie: Vandaag versturen</p>
                </div>
              </div>
            </div>

            {/* Deze Maand */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-3">📈 DEZE MAAND (HIGH IMPACT)</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-3">
                  <p className="text-sm font-bold text-blue-800">1. Jeans Marketing Campagne</p>
                  <p className="text-xs text-blue-600">• €300 Meta Ads budget</p>
                  <p className="text-xs text-blue-600">• Target: Mannen 25-45, interesse mode</p>
                  <p className="text-xs text-blue-600">• Verwacht: +16 verkopen = +€800 winst</p>
                  <p className="text-xs text-blue-600">• ROI: 267% - Zeer winstgevend!</p>
                </div>
                <div className="border-l-4 border-green-500 pl-3">
                  <p className="text-sm font-bold text-green-800">2. Sneakers Opschalen</p>
                  <p className="text-xs text-green-600">• Verhoog voorraad 50 → 100 stuks</p>
                  <p className="text-xs text-green-600">• Start €200 Google Shopping campagne</p>
                  <p className="text-xs text-green-600">• Verwacht: +30 verkopen = +€1.440 winst</p>
                  <p className="text-xs text-green-600">• Beste ROI product!</p>
                </div>
              </div>
            </div>

            {/* Lange Termijn */}
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h4 className="font-bold text-purple-800 mb-3">🚀 Q4 STRATEGIE</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-purple-500 pl-3">
                  <p className="text-sm font-bold text-purple-800">1. VIP Klanten Programma</p>
                  <p className="text-xs text-purple-600">• Piet Bakker = €180 winst/jaar</p>
                  <p className="text-xs text-purple-600">• Lisa de Jong = €132 winst/jaar</p>
                  <p className="text-xs text-purple-600">• 15% VIP korting + gratis express</p>
                  <p className="text-xs text-purple-600">• Target: 5 VIP klanten = +€1.200 winst</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-3">
                  <p className="text-sm font-bold text-orange-800">2. Black Friday Prep</p>
                  <p className="text-xs text-orange-600">• Verhoog ALL voorraad met 200%</p>
                  <p className="text-xs text-orange-600">• €1.000 advertising budget 25-29 nov</p>
                  <p className="text-xs text-orange-600">• Verwacht: €15.000 omzet = €5.250 winst</p>
                  <p className="text-xs text-orange-600">• Grootste kans van het jaar!</p>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Calculator */}
          <div className="mt-6 bg-white p-4 rounded-lg border border-green-300">
            <h4 className="font-bold text-green-800 mb-2">💰 TOTAAL WINST POTENTIEEL:</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-green-600 text-lg">+€1.440</p>
                <p className="text-xs text-gray-600">Sneakers opschalen</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-blue-600 text-lg">+€800</p>
                <p className="text-xs text-gray-600">Jeans marketing</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-purple-600 text-lg">+€1.200</p>
                <p className="text-xs text-gray-600">VIP programma</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-orange-600 text-lg">+€5.250</p>
                <p className="text-xs text-gray-600">Black Friday</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-xl font-bold text-green-700">
                TOTAAL POTENTIEEL: +€8.690 EXTRA WINST
              </p>
              <p className="text-sm text-gray-600">Bij uitvoering van alle aanbevelingen</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIInsights;
