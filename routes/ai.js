const express = require('express');
const aiAnalytics = require('../services/aiAnalytics');
const router = express.Router();

// Get AI product recommendations
router.get('/product-recommendations', async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const analysis = await aiAnalytics.analyzeProductPerformance(parseInt(period));
    
    res.json({
      success: true,
      analysis,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in AI product analysis:', error);
    res.status(500).json({ 
      error: 'AI analyse fout',
      message: error.message 
    });
  }
});

// Get AI customer behavior insights
router.get('/customer-insights', async (req, res) => {
  try {
    const analysis = await aiAnalytics.analyzeCustomerBehavior();
    
    res.json({
      success: true,
      analysis,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in AI customer analysis:', error);
    res.status(500).json({ 
      error: 'AI klantanalyse fout',
      message: error.message 
    });
  }
});

// Get comprehensive business health analysis
router.get('/business-health', async (req, res) => {
  try {
    const analysis = await aiAnalytics.analyzeBusinessHealth();
    
    res.json({
      success: true,
      analysis,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in AI business health analysis:', error);
    res.status(500).json({ 
      error: 'AI bedrijfsanalyse fout',
      message: error.message 
    });
  }
});

// Get seasonal recommendations
router.get('/seasonal-recommendations', (req, res) => {
  try {
    const recommendations = aiAnalytics.generateSeasonalRecommendations();
    
    res.json({
      success: true,
      recommendations,
      current_month: new Date().getMonth() + 1,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating seasonal recommendations:', error);
    res.status(500).json({ 
      error: 'Seizoen aanbevelingen fout',
      message: error.message 
    });
  }
});

// Get complete AI dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [productAnalysis, customerAnalysis, businessHealth] = await Promise.all([
      aiAnalytics.analyzeProductPerformance(30),
      aiAnalytics.analyzeCustomerBehavior(),
      aiAnalytics.analyzeBusinessHealth()
    ]);
    
    const seasonalRecs = aiAnalytics.generateSeasonalRecommendations();
    
    // Combine top recommendations from all analyses
    const allRecommendations = [
      ...productAnalysis.recommendations.slice(0, 3),
      ...customerAnalysis.insights.slice(0, 2),
      ...businessHealth.insights.slice(0, 2),
      ...seasonalRecs.slice(0, 1)
    ];
    
    // Sort by priority and confidence
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const topRecommendations = allRecommendations
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return (b.confidence || 0.5) - (a.confidence || 0.5);
      })
      .slice(0, 8);
    
    res.json({
      success: true,
      overview: {
        business_health_score: businessHealth.health_score,
        total_recommendations: allRecommendations.length,
        urgent_actions: allRecommendations.filter(r => r.priority === 'urgent').length,
        high_priority: allRecommendations.filter(r => r.priority === 'high').length
      },
      top_recommendations: topRecommendations,
      detailed_analysis: {
        product_performance: productAnalysis,
        customer_behavior: customerAnalysis,
        business_health: businessHealth,
        seasonal: seasonalRecs
      },
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating AI dashboard:', error);
    res.status(500).json({ 
      error: 'AI dashboard fout',
      message: error.message 
    });
  }
});

// Get specific product recommendation
router.get('/product/:id/recommendation', async (req, res) => {
  try {
    const productId = req.params.id;
    const analysis = await aiAnalytics.analyzeProductPerformance(30);
    
    const productRec = analysis.recommendations.find(r => r.product_id == productId);
    
    if (!productRec) {
      return res.json({
        success: true,
        message: 'Geen specifieke aanbevelingen voor dit product op dit moment.',
        general_advice: 'Product presteert binnen normale parameters. Monitor verkoop trends.'
      });
    }
    
    res.json({
      success: true,
      recommendation: productRec,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting product recommendation:', error);
    res.status(500).json({ 
      error: 'Product aanbeveling fout',
      message: error.message 
    });
  }
});

// Backward-compatibility alias used by tests: /api/ai/insights
router.get('/insights', async (req, res) => {
  try {
    const analysis = await aiAnalytics.analyzeCustomerBehavior();
    res.json({ success: true, analysis, generated_at: new Date().toISOString() });
  } catch (error) {
    console.error('Error in AI insights alias:', error);
    res.status(500).json({ error: 'AI insights fout', message: error.message });
  }
});

module.exports = router;
