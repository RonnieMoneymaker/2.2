const { db } = require('../database/init');

class AIAnalytics {
  
  // Analyze product performance and give recommendations
  async analyzeProductPerformance(period = 30) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.category,
          p.purchase_price,
          p.selling_price,
          p.stock_quantity,
          ROUND((p.selling_price - p.purchase_price), 2) as unit_margin,
          ROUND(((p.selling_price - p.purchase_price) / NULLIF(p.selling_price, 0) * 100), 2) as margin_percentage,
          COALESCE(sales.quantity_sold, 0) as quantity_sold,
          COALESCE(sales.revenue, 0) as revenue,
          COALESCE(sales.gross_profit, 0) as gross_profit,
          COALESCE(sales.orders_count, 0) as orders_count,
          ROUND(COALESCE(sales.revenue, 0) / ${period}, 2) as daily_revenue,
          ROUND(COALESCE(sales.quantity_sold, 0) / ${period}, 2) as daily_sales
        FROM products p
        LEFT JOIN (
          SELECT 
            oi.product_sku,
            SUM(oi.quantity) as quantity_sold,
            SUM(oi.total_price) as revenue,
            SUM(oi.total_price - (oi.quantity * p2.purchase_price)) as gross_profit,
            COUNT(DISTINCT oi.order_id) as orders_count
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          LEFT JOIN products p2 ON oi.product_sku = p2.sku
          WHERE o.order_date >= date('now', '-${period} days')
            AND o.status != 'cancelled'
          GROUP BY oi.product_sku
        ) sales ON p.sku = sales.product_sku
        WHERE p.is_active = 1
      `, (err, products) => {
        if (err) return reject(err);
        
        const recommendations = this.generateProductRecommendations(products, period);
        resolve({
          products,
          recommendations,
          analysis_date: new Date().toISOString(),
          period_days: period
        });
      });
    });
  }

  generateProductRecommendations(products, period) {
    const recommendations = [];
    
    products.forEach(product => {
      const dailySales = parseFloat(product.daily_sales) || 0;
      const marginPercentage = parseFloat(product.margin_percentage) || 0;
      const stockQuantity = parseInt(product.stock_quantity) || 0;
      const revenue = parseFloat(product.revenue) || 0;
      
      // High performing products to scale up
      if (dailySales > 1 && marginPercentage > 50 && stockQuantity > 20) {
        recommendations.push({
          product_id: product.id,
          product_name: product.name,
          type: 'scale_up',
          priority: 'high',
          confidence: 0.85,
          reason: `Hoge verkoop (${dailySales.toFixed(1)}/dag) en goede marge (${marginPercentage.toFixed(1)}%). Verhoog voorraad en marketing.`,
          action: `Verhoog voorraad naar ${Math.ceil(stockQuantity * 1.5)} stuks en overweeg meer marketing voor dit product.`,
          expected_impact: `Potentiële omzetverhoging: €${(revenue * 0.3).toFixed(2)}/maand`,
          metrics: {
            current_daily_sales: dailySales,
            margin_percentage: marginPercentage,
            current_stock: stockQuantity
          }
        });
      }
      
      // Low performing products to optimize or discontinue
      if (dailySales < 0.5 && revenue < 100 && stockQuantity > 10) {
        recommendations.push({
          product_id: product.id,
          product_name: product.name,
          type: 'optimize_or_discontinue',
          priority: 'medium',
          confidence: 0.75,
          reason: `Lage verkoop (${dailySales.toFixed(1)}/dag) en beperkte omzet (€${revenue.toFixed(2)}). Voorraad kost opslagruimte.`,
          action: `Overweeg korting om voorraad te verkopen of stop met inkoop van dit product.`,
          expected_impact: `Kostenbesparing opslagruimte: €${(stockQuantity * 2).toFixed(2)}/maand`,
          metrics: {
            current_daily_sales: dailySales,
            total_revenue: revenue,
            tied_up_capital: stockQuantity * product.purchase_price
          }
        });
      }
      
      // High margin products with low sales - marketing opportunity
      if (marginPercentage > 60 && dailySales < 1 && dailySales > 0) {
        recommendations.push({
          product_id: product.id,
          product_name: product.name,
          type: 'increase_marketing',
          priority: 'high',
          confidence: 0.80,
          reason: `Uitstekende marge (${marginPercentage.toFixed(1)}%) maar lage verkoop. Marketing kans!`,
          action: `Start gerichte advertentiecampagne. Hoge marge rechtvaardigt marketing investering.`,
          expected_impact: `Bij 50% verkoop verhoging: +€${((dailySales * 0.5 * product.unit_margin * 30)).toFixed(2)} winst/maand`,
          metrics: {
            margin_percentage: marginPercentage,
            unit_margin: product.unit_margin,
            current_daily_sales: dailySales
          }
        });
      }
      
      // Low stock warning
      if (stockQuantity < 10 && dailySales > 0.5) {
        recommendations.push({
          product_id: product.id,
          product_name: product.name,
          type: 'restock_urgent',
          priority: 'urgent',
          confidence: 0.95,
          reason: `Lage voorraad (${stockQuantity} stuks) bij goede verkoop (${dailySales.toFixed(1)}/dag). Risico op uitverkoop!`,
          action: `Bestel direct nieuwe voorraad. Huidige voorraad duurt nog ${Math.ceil(stockQuantity / dailySales)} dagen.`,
          expected_impact: `Voorkom omzetverlies van €${(dailySales * product.selling_price * 7).toFixed(2)}/week`,
          metrics: {
            current_stock: stockQuantity,
            days_remaining: Math.ceil(stockQuantity / (dailySales || 1)),
            daily_sales: dailySales
          }
        });
      }
      
      // Price optimization opportunity
      if (dailySales > 2 && marginPercentage < 40) {
        const suggestedPrice = product.purchase_price * 1.6; // 60% margin
        recommendations.push({
          product_id: product.id,
          product_name: product.name,
          type: 'price_optimization',
          priority: 'medium',
          confidence: 0.70,
          reason: `Hoge verkoop (${dailySales.toFixed(1)}/dag) maar lage marge (${marginPercentage.toFixed(1)}%). Prijsverhoging mogelijk.`,
          action: `Test prijsverhoging naar €${suggestedPrice.toFixed(2)} voor betere marge.`,
          expected_impact: `Potentiële extra winst: €${((suggestedPrice - product.selling_price) * dailySales * 30).toFixed(2)}/maand`,
          metrics: {
            current_price: product.selling_price,
            suggested_price: suggestedPrice,
            current_margin: marginPercentage,
            projected_margin: ((suggestedPrice - product.purchase_price) / suggestedPrice * 100)
          }
        });
      }
    });
    
    // Sort by priority and confidence
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return recommendations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.confidence - a.confidence;
    });
  }

  // Analyze customer behavior and give insights
  async analyzeCustomerBehavior() {
    return new Promise((resolve, reject) => {
      const queries = {
        // Customer segments
        customerSegments: `
          SELECT 
            CASE 
              WHEN total_spent = 0 THEN 'Geen aankopen'
              WHEN total_spent < 100 THEN 'Lage waarde'
              WHEN total_spent < 500 THEN 'Gemiddelde waarde'
              WHEN total_spent < 1000 THEN 'Hoge waarde'
              ELSE 'VIP'
            END as segment,
            COUNT(*) as customers,
            AVG(total_spent) as avg_spent,
            SUM(total_spent) as total_revenue,
            AVG(total_orders) as avg_orders
          FROM customers
          GROUP BY segment
        `,
        
        // Repeat purchase behavior
        repeatBehavior: `
          SELECT 
            COUNT(CASE WHEN total_orders = 1 THEN 1 END) as one_time_customers,
            COUNT(CASE WHEN total_orders > 1 THEN 1 END) as repeat_customers,
            AVG(CASE WHEN total_orders > 1 THEN total_orders END) as avg_repeat_orders,
            MAX(total_orders) as max_orders
          FROM customers
          WHERE total_orders > 0
        `,
        
        // Geographic insights
        geoInsights: `
          SELECT 
            city,
            COUNT(*) as customers,
            AVG(total_spent) as avg_spent,
            SUM(total_spent) as total_revenue
          FROM customers
          WHERE city IS NOT NULL AND total_spent > 0
          GROUP BY city
          ORDER BY total_revenue DESC
          LIMIT 10
        `
      };
      
      const results = {};
      const queryKeys = Object.keys(queries);
      let completed = 0;
      
      queryKeys.forEach(key => {
        db.all(queries[key], (err, rows) => {
          if (err) {
            console.error(`Error in query ${key}:`, err);
            results[key] = [];
          } else {
            results[key] = rows;
          }
          
          completed++;
          if (completed === queryKeys.length) {
            const insights = this.generateCustomerInsights(results);
            resolve({
              data: results,
              insights,
              analysis_date: new Date().toISOString()
            });
          }
        });
      });
    });
  }

  generateCustomerInsights(data) {
    const insights = [];
    
    // Analyze customer segments
    const segments = data.customerSegments || [];
    const totalCustomers = segments.reduce((sum, seg) => sum + seg.customers, 0);
    const vipCustomers = segments.find(seg => seg.segment === 'VIP');
    const nopurchaseCustomers = segments.find(seg => seg.segment === 'Geen aankopen');
    
    if (vipCustomers && vipCustomers.customers > 0) {
      insights.push({
        type: 'customer_segment',
        priority: 'high',
        confidence: 0.90,
        title: 'VIP Klanten Focus',
        insight: `Je hebt ${vipCustomers.customers} VIP klanten (${((vipCustomers.customers / totalCustomers) * 100).toFixed(1)}%) die gemiddeld €${vipCustomers.avg_spent.toFixed(2)} besteden.`,
        recommendation: 'Creëer een VIP programma met exclusieve aanbiedingen en persoonlijke service om deze waardevolle klanten te behouden.',
        potential_impact: `Behoud van VIP klanten kan €${(vipCustomers.total_revenue * 0.1).toFixed(2)} extra omzet opleveren.`
      });
    }
    
    if (nopurchaseCustomers && nopurchaseCustomers.customers > 5) {
      insights.push({
        type: 'conversion_opportunity',
        priority: 'medium',
        confidence: 0.75,
        title: 'Conversie Kans',
        insight: `${nopurchaseCustomers.customers} klanten hebben zich geregistreerd maar nog niets gekocht.`,
        recommendation: 'Start een welkomstcampagne met 10% korting voor eerste aankoop binnen 7 dagen.',
        potential_impact: `Bij 20% conversie: €${(nopurchaseCustomers.customers * 0.2 * 75).toFixed(2)} extra omzet.`
      });
    }
    
    // Analyze repeat behavior
    const repeatData = data.repeatBehavior?.[0];
    if (repeatData) {
      const repeatRate = (repeatData.repeat_customers / (repeatData.repeat_customers + repeatData.one_time_customers)) * 100;
      
      if (repeatRate < 30) {
        insights.push({
          type: 'retention_improvement',
          priority: 'high',
          confidence: 0.85,
          title: 'Klant Retentie Verbeteren',
          insight: `Slechts ${repeatRate.toFixed(1)}% van klanten koopt meer dan één keer. Dit is onder het gemiddelde van 35%.`,
          recommendation: 'Implementeer een follow-up email serie en loyaliteitsprogramma om repeat purchases te stimuleren.',
          potential_impact: `Verhoging naar 35% repeat rate kan €${(repeatData.one_time_customers * 0.05 * 85).toFixed(2)} extra omzet genereren.`
        });
      }
    }
    
    // Geographic insights
    const geoData = data.geoInsights || [];
    if (geoData.length > 0) {
      const topCity = geoData[0];
      insights.push({
        type: 'geographic_opportunity',
        priority: 'medium',
        confidence: 0.70,
        title: 'Geografische Kans',
        insight: `${topCity.city} is je beste markt met €${topCity.total_revenue.toFixed(2)} omzet van ${topCity.customers} klanten.`,
        recommendation: `Focus marketing op ${topCity.city} en vergelijkbare steden. Overweeg lokale partnerships of evenementen.`,
        potential_impact: `Uitbreiding naar vergelijkbare markten kan 25% omzetgroei opleveren.`
      });
    }
    
    return insights.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.confidence - a.confidence;
    });
  }

  // Analyze business health and give strategic recommendations
  async analyzeBusinessHealth() {
    return new Promise((resolve, reject) => {
      // Get key business metrics
      db.all(`
        SELECT 
          -- Revenue metrics
          (SELECT SUM(total_amount) FROM orders WHERE order_date >= date('now', '-30 days') AND status != 'cancelled') as monthly_revenue,
          (SELECT SUM(total_amount) FROM orders WHERE order_date >= date('now', '-60 days') AND order_date < date('now', '-30 days') AND status != 'cancelled') as previous_month_revenue,
          
          -- Customer metrics
          (SELECT COUNT(*) FROM customers WHERE date_created >= date('now', '-30 days')) as new_customers_month,
          (SELECT COUNT(*) FROM customers WHERE total_orders > 1) as repeat_customers,
          (SELECT COUNT(*) FROM customers WHERE total_orders > 0) as active_customers,
          
          -- Order metrics
          (SELECT COUNT(*) FROM orders WHERE order_date >= date('now', '-30 days') AND status != 'cancelled') as monthly_orders,
          (SELECT AVG(total_amount) FROM orders WHERE order_date >= date('now', '-30 days') AND status != 'cancelled') as avg_order_value,
          
          -- Cost metrics
          (SELECT SUM(amount) FROM fixed_costs WHERE is_active = 1 AND billing_cycle = 'monthly') as monthly_fixed_costs
      `, (err, metrics) => {
        if (err) return reject(err);
        
        const businessMetrics = metrics[0] || {};
        const insights = this.generateBusinessInsights(businessMetrics);
        
        resolve({
          metrics: businessMetrics,
          insights,
          health_score: this.calculateHealthScore(businessMetrics),
          analysis_date: new Date().toISOString()
        });
      });
    });
  }

  generateBusinessInsights(metrics) {
    const insights = [];
    
    // Revenue growth analysis
    const currentRevenue = parseFloat(metrics.monthly_revenue) || 0;
    const previousRevenue = parseFloat(metrics.previous_month_revenue) || 0;
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;
    
    if (revenueGrowth > 10) {
      insights.push({
        type: 'growth_acceleration',
        priority: 'high',
        confidence: 0.85,
        title: 'Sterke Groei Momentum',
        insight: `Omzet groeide ${revenueGrowth.toFixed(1)}% ten opzichte van vorige maand (€${currentRevenue.toFixed(2)}).`,
        recommendation: 'Profiteer van momentum: verhoog marketing budget en voorraad van best verkopende producten.',
        potential_impact: `Bij behoud van groei: €${(currentRevenue * 1.1).toFixed(2)} volgende maand.`
      });
    } else if (revenueGrowth < -5) {
      insights.push({
        type: 'revenue_decline',
        priority: 'urgent',
        confidence: 0.90,
        title: 'Omzet Daling',
        insight: `Omzet daalde ${Math.abs(revenueGrowth).toFixed(1)}% ten opzichte van vorige maand.`,
        recommendation: 'Analyseer oorzaken: seizoenseffect, concurrentie, of product issues. Start recovery campagne.',
        potential_impact: `Zonder actie risico op €${(Math.abs(currentRevenue - previousRevenue) * 1.5).toFixed(2)} verder verlies.`
      });
    }
    
    // Customer acquisition
    const newCustomers = parseInt(metrics.new_customers_month) || 0;
    const monthlyOrders = parseInt(metrics.monthly_orders) || 0;
    const customerAcquisitionCost = monthlyOrders > 0 ? currentRevenue / newCustomers : 0;
    
    if (newCustomers < 10) {
      insights.push({
        type: 'customer_acquisition',
        priority: 'high',
        confidence: 0.80,
        title: 'Lage Klantwerving',
        insight: `Slechts ${newCustomers} nieuwe klanten deze maand. Dit is onder de gezonde groei van 20+ nieuwe klanten.`,
        recommendation: 'Verhoog marketing budget voor klantwerving. Focus op social media en Google Ads.',
        potential_impact: `Verdubbeling nieuwe klanten kan €${(newCustomers * 85 * 2).toFixed(2)} extra omzet opleveren.`
      });
    }
    
    // Break-even analysis
    const monthlyFixedCosts = parseFloat(metrics.monthly_fixed_costs) || 0;
    const avgOrderValue = parseFloat(metrics.avg_order_value) || 0;
    const breakEvenOrders = avgOrderValue > 0 ? Math.ceil(monthlyFixedCosts / (avgOrderValue * 0.6)) : 0; // Assuming 60% gross margin
    
    if (monthlyOrders < breakEvenOrders) {
      insights.push({
        type: 'break_even_warning',
        priority: 'urgent',
        confidence: 0.95,
        title: 'Break-even Risico',
        insight: `Je hebt ${breakEvenOrders - monthlyOrders} extra bestellingen nodig om break-even te bereiken.`,
        recommendation: 'Focus op conversie optimalisatie en verhoog gemiddelde bestelwaarde door upselling.',
        potential_impact: `Bereiken break-even voorkomt €${(monthlyFixedCosts - (monthlyOrders * avgOrderValue * 0.6)).toFixed(2)} verlies.`
      });
    }
    
    // Customer lifetime value optimization
    const activeCustomers = parseInt(metrics.active_customers) || 0;
    const repeatCustomers = parseInt(metrics.repeat_customers) || 0;
    const repeatRate = activeCustomers > 0 ? (repeatCustomers / activeCustomers * 100) : 0;
    
    if (repeatRate > 40) {
      insights.push({
        type: 'loyalty_strength',
        priority: 'medium',
        confidence: 0.80,
        title: 'Sterke Klantloyaliteit',
        insight: `${repeatRate.toFixed(1)}% van klanten koopt meerdere keren. Dit is uitstekend!`,
        recommendation: 'Introduceer een referral programma om loyale klanten nieuwe klanten te laten werven.',
        potential_impact: `Referral programma kan ${Math.floor(repeatCustomers * 0.3)} nieuwe klanten opleveren.`
      });
    }
    
    return insights;
  }

  calculateHealthScore(metrics) {
    let score = 0;
    let maxScore = 0;
    
    // Revenue growth (25 points)
    const currentRevenue = parseFloat(metrics.monthly_revenue) || 0;
    const previousRevenue = parseFloat(metrics.previous_month_revenue) || 0;
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;
    
    if (revenueGrowth > 15) score += 25;
    else if (revenueGrowth > 5) score += 20;
    else if (revenueGrowth > 0) score += 15;
    else if (revenueGrowth > -5) score += 10;
    else score += 5;
    maxScore += 25;
    
    // Customer acquisition (20 points)
    const newCustomers = parseInt(metrics.new_customers_month) || 0;
    if (newCustomers > 20) score += 20;
    else if (newCustomers > 15) score += 15;
    else if (newCustomers > 10) score += 10;
    else if (newCustomers > 5) score += 5;
    maxScore += 20;
    
    // Order volume (20 points)
    const monthlyOrders = parseInt(metrics.monthly_orders) || 0;
    if (monthlyOrders > 100) score += 20;
    else if (monthlyOrders > 50) score += 15;
    else if (monthlyOrders > 25) score += 10;
    else if (monthlyOrders > 10) score += 5;
    maxScore += 20;
    
    // Average order value (15 points)
    const avgOrderValue = parseFloat(metrics.avg_order_value) || 0;
    if (avgOrderValue > 150) score += 15;
    else if (avgOrderValue > 100) score += 12;
    else if (avgOrderValue > 75) score += 9;
    else if (avgOrderValue > 50) score += 6;
    else if (avgOrderValue > 25) score += 3;
    maxScore += 15;
    
    // Repeat customer rate (20 points)
    const activeCustomers = parseInt(metrics.active_customers) || 0;
    const repeatCustomers = parseInt(metrics.repeat_customers) || 0;
    const repeatRate = activeCustomers > 0 ? (repeatCustomers / activeCustomers * 100) : 0;
    
    if (repeatRate > 40) score += 20;
    else if (repeatRate > 30) score += 15;
    else if (repeatRate > 20) score += 10;
    else if (repeatRate > 10) score += 5;
    maxScore += 20;
    
    const healthScore = Math.round((score / maxScore) * 100);
    
    return {
      score: healthScore,
      grade: this.getHealthGrade(healthScore),
      breakdown: {
        revenue_growth: revenueGrowth,
        customer_acquisition: newCustomers,
        order_volume: monthlyOrders,
        avg_order_value: avgOrderValue,
        repeat_rate: repeatRate
      }
    };
  }

  getHealthGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  // Generate seasonal recommendations
  generateSeasonalRecommendations() {
    const month = new Date().getMonth() + 1; // 1-12
    const recommendations = [];
    
    switch (month) {
      case 12:
      case 1:
        recommendations.push({
          type: 'seasonal',
          priority: 'high',
          title: 'Winter/Kerst Optimalisatie',
          insight: 'Winter periode met hoge consumentenbestedingen.',
          recommendation: 'Focus op warme kleding, cadeauartikelen en bundel aanbiedingen.',
          timing: 'Nu implementeren'
        });
        break;
      case 3:
      case 4:
      case 5:
        recommendations.push({
          type: 'seasonal',
          priority: 'medium',
          title: 'Lente Collectie',
          insight: 'Lente vraag naar lichtere kleding en outdoor producten.',
          recommendation: 'Promoot lente/zomer collectie en outdoor accessoires.',
          timing: 'Start promotie nu'
        });
        break;
      case 6:
      case 7:
      case 8:
        recommendations.push({
          type: 'seasonal',
          priority: 'high',
          title: 'Zomer Piek',
          insight: 'Zomer piekseizoen voor mode en vakantie items.',
          recommendation: 'Maximaliseer voorraad zomerkleding en vakantie accessoires.',
          timing: 'Verhoog marketing budget'
        });
        break;
      case 9:
      case 10:
      case 11:
        recommendations.push({
          type: 'seasonal',
          priority: 'medium',
          title: 'Herfst Voorbereiding',
          insight: 'Voorbereiding op winter en Black Friday.',
          recommendation: 'Bereid Black Friday campagnes voor en stock winter items.',
          timing: 'Plan nu voor Q4'
        });
        break;
    }
    
    return recommendations;
  }
}

module.exports = new AIAnalytics();
