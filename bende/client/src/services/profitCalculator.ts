// Comprehensive profit calculation service
export class ProfitCalculator {
  
  // Calculate real profit per product (selling - purchase - shipping - tax)
  static calculateProductProfit(
    sellingPrice: number, 
    purchasePrice: number, 
    shippingCost: number = 0, 
    taxRate: number = 21, // Default Dutch VAT
    quantity: number = 1
  ) {
    const subtotal = sellingPrice * quantity;
    const totalPurchaseCost = purchasePrice * quantity;
    const totalShippingCost = shippingCost * quantity;
    const taxAmount = (subtotal * taxRate) / 100;
    
    // Real profit = Revenue - Purchase Cost - Shipping - Tax
    const realProfit = subtotal - totalPurchaseCost - totalShippingCost - taxAmount;
    const profitMarginPercentage = subtotal > 0 ? (realProfit / subtotal) * 100 : 0;
    
    return {
      revenue: subtotal,
      purchase_cost: totalPurchaseCost,
      shipping_cost: totalShippingCost,
      tax_amount: taxAmount,
      real_profit: realProfit,
      profit_margin_percentage: profitMarginPercentage,
      profit_per_unit: realProfit / quantity,
      breakdown: {
        selling_price: sellingPrice,
        purchase_price: purchasePrice,
        shipping_per_unit: shippingCost,
        tax_per_unit: taxAmount / quantity,
        net_profit_per_unit: realProfit / quantity
      }
    };
  }

  // Calculate customer lifetime profit
  static calculateCustomerProfit(
    totalSpent: number, 
    averageMarginPercentage: number = 35,
    averageShippingCost: number = 5.95,
    totalOrders: number = 1
  ) {
    const grossProfit = totalSpent * (averageMarginPercentage / 100);
    const totalShippingCosts = averageShippingCost * totalOrders;
    const realCustomerProfit = grossProfit - totalShippingCosts;
    
    return {
      total_spent: totalSpent,
      gross_profit: grossProfit,
      shipping_costs: totalShippingCosts,
      real_profit: realCustomerProfit,
      profit_per_order: realCustomerProfit / totalOrders,
      margin_after_shipping: totalSpent > 0 ? (realCustomerProfit / totalSpent) * 100 : 0
    };
  }

  // Calculate order profit with detailed breakdown
  static calculateOrderProfit(orderItems: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    purchase_price?: number;
    shipping_cost?: number;
  }>, country: string = 'Nederland') {
    let totalRevenue = 0;
    let totalPurchaseCost = 0;
    let totalShippingCost = 0;
    let totalTax = 0;
    
    const itemBreakdown = orderItems.map(item => {
      const itemRevenue = item.unit_price * item.quantity;
      const itemPurchaseCost = (item.purchase_price || 0) * item.quantity;
      const itemShippingCost = (item.shipping_cost || 5.95) * item.quantity;
      const itemTax = this.calculateTax(itemRevenue, country);
      const itemProfit = itemRevenue - itemPurchaseCost - itemShippingCost - itemTax;
      
      totalRevenue += itemRevenue;
      totalPurchaseCost += itemPurchaseCost;
      totalShippingCost += itemShippingCost;
      totalTax += itemTax;
      
      return {
        product_name: item.product_name,
        quantity: item.quantity,
        revenue: itemRevenue,
        purchase_cost: itemPurchaseCost,
        shipping_cost: itemShippingCost,
        tax: itemTax,
        profit: itemProfit,
        margin_percentage: itemRevenue > 0 ? (itemProfit / itemRevenue) * 100 : 0
      };
    });
    
    const totalProfit = totalRevenue - totalPurchaseCost - totalShippingCost - totalTax;
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    return {
      summary: {
        total_revenue: totalRevenue,
        total_purchase_cost: totalPurchaseCost,
        total_shipping_cost: totalShippingCost,
        total_tax: totalTax,
        total_profit: totalProfit,
        profit_margin_percentage: overallMargin
      },
      item_breakdown: itemBreakdown,
      country: country
    };
  }

  // Calculate tax based on country
  static calculateTax(amount: number, country: string): number {
    const taxRates: { [key: string]: number } = {
      'Nederland': 21,
      'België': 21,
      'Duitsland': 19,
      'Frankrijk': 20,
      'EU': 20
    };
    
    const taxRate = taxRates[country] || 21;
    return (amount * taxRate) / 100;
  }

  // Calculate monthly profit with all costs
  static calculateMonthlyProfit(
    monthlyRevenue: number,
    averageMarginPercentage: number = 35,
    monthlyFixedCosts: number = 11825,
    monthlyAdSpend: number = 800,
    averageShippingCostPerOrder: number = 5.95,
    monthlyOrders: number = 100
  ) {
    const grossProfit = monthlyRevenue * (averageMarginPercentage / 100);
    const totalShippingCosts = averageShippingCostPerOrder * monthlyOrders;
    const netProfit = grossProfit - monthlyFixedCosts - monthlyAdSpend - totalShippingCosts;
    
    return {
      revenue: monthlyRevenue,
      gross_profit: grossProfit,
      fixed_costs: monthlyFixedCosts,
      ad_spend: monthlyAdSpend,
      shipping_costs: totalShippingCosts,
      net_profit: netProfit,
      profit_margin: monthlyRevenue > 0 ? (netProfit / monthlyRevenue) * 100 : 0,
      break_even_revenue: monthlyFixedCosts + monthlyAdSpend + totalShippingCosts,
      cost_breakdown: {
        fixed_costs_percentage: monthlyRevenue > 0 ? (monthlyFixedCosts / monthlyRevenue) * 100 : 0,
        ad_spend_percentage: monthlyRevenue > 0 ? (monthlyAdSpend / monthlyRevenue) * 100 : 0,
        shipping_percentage: monthlyRevenue > 0 ? (totalShippingCosts / monthlyRevenue) * 100 : 0,
        cogs_percentage: 100 - averageMarginPercentage
      }
    };
  }

  // Get profit color coding for UI
  static getProfitColor(profitMargin: number): string {
    if (profitMargin >= 50) return 'text-green-600';
    if (profitMargin >= 30) return 'text-green-500';
    if (profitMargin >= 15) return 'text-yellow-600';
    if (profitMargin >= 5) return 'text-orange-600';
    return 'text-red-600';
  }

  // Get profit status text
  static getProfitStatus(profitMargin: number): string {
    if (profitMargin >= 50) return 'Uitstekend';
    if (profitMargin >= 30) return 'Goed';
    if (profitMargin >= 15) return 'Gemiddeld';
    if (profitMargin >= 5) return 'Laag';
    return 'Verlies';
  }

  // Format currency for display
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  // Calculate shipping cost based on weight and country
  static calculateShippingCost(
    totalWeight: number, 
    country: string, 
    orderValue: number
  ): { cost: number; freeShipping: boolean; threshold?: number } {
    const shippingRules: { [key: string]: any } = {
      'Nederland': {
        standard: { cost: 4.95, freeThreshold: 50 },
        heavy: { cost: 8.95, weightLimit: 1000 }
      },
      'België': {
        standard: { cost: 6.95, freeThreshold: 75 }
      },
      'Duitsland': {
        standard: { cost: 9.95, freeThreshold: 100 }
      },
      'EU': {
        standard: { cost: 12.95, freeThreshold: 100 }
      }
    };

    const rules = shippingRules[country] || shippingRules['EU'];
    const standardRule = rules.standard;
    
    // Check for free shipping
    if (standardRule.freeThreshold && orderValue >= standardRule.freeThreshold) {
      return { cost: 0, freeShipping: true, threshold: standardRule.freeThreshold };
    }
    
    // Check for heavy items
    if (rules.heavy && totalWeight > rules.heavy.weightLimit) {
      return { cost: rules.heavy.cost, freeShipping: false };
    }
    
    return { 
      cost: standardRule.cost, 
      freeShipping: false, 
      threshold: standardRule.freeThreshold 
    };
  }
}

export default ProfitCalculator;
