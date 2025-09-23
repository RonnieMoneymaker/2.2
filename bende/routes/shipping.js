const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const router = express.Router();

// Calculate shipping cost for order
router.post('/calculate', [
  body('country').trim().isLength({ min: 1 }).withMessage('Land is verplicht'),
  body('items').isArray({ min: 1 }).withMessage('Items zijn verplicht'),
  body('total_value').isFloat({ min: 0 }).withMessage('Totale waarde is verplicht')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { country, items, total_value } = req.body;
  
  // Calculate total weight and dimensions
  let totalWeight = 0;
  let maxLength = 0, maxWidth = 0, totalHeight = 0;
  
  const productSkus = items.map(item => item.sku);
  const placeholders = productSkus.map(() => '?').join(',');
  
  db.all(
    `SELECT sku, weight_grams, length_cm, width_cm, height_cm, shipping_cost 
     FROM products 
     WHERE sku IN (${placeholders})`,
    productSkus,
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout bij ophalen productgegevens' });
      }
      
      items.forEach(item => {
        const product = products.find(p => p.sku === item.sku);
        if (product) {
          totalWeight += product.weight_grams * item.quantity;
          maxLength = Math.max(maxLength, product.length_cm);
          maxWidth = Math.max(maxWidth, product.width_cm);
          totalHeight += product.height_cm * item.quantity;
        }
      });
      
      // Find applicable shipping rule
      db.get(`
        SELECT * FROM shipping_rules 
        WHERE country = ? 
          AND min_weight <= ? 
          AND max_weight >= ?
          AND min_order_value <= ?
          AND max_order_value >= ?
          AND is_active = 1
        ORDER BY shipping_cost ASC
        LIMIT 1
      `, [country, totalWeight, totalWeight, total_value, total_value], (err, shippingRule) => {
        if (err) {
          return res.status(500).json({ error: 'Database fout bij ophalen verzendregels' });
        }
        
        let shippingCost = 0;
        let freeShipping = false;
        
        if (shippingRule) {
          if (shippingRule.free_shipping_threshold && total_value >= shippingRule.free_shipping_threshold) {
            shippingCost = 0;
            freeShipping = true;
          } else {
            shippingCost = shippingRule.shipping_cost;
          }
        } else {
          // Default shipping cost if no rule found
          shippingCost = 15.95;
        }
        
        res.json({
          shipping_cost: shippingCost,
          free_shipping: freeShipping,
          shipping_rule: shippingRule ? shippingRule.name : 'Standaard Verzending',
          package_info: {
            total_weight_grams: totalWeight,
            dimensions_cm: {
              length: maxLength,
              width: maxWidth,
              height: totalHeight
            }
          },
          free_shipping_threshold: shippingRule ? shippingRule.free_shipping_threshold : null,
          amount_for_free_shipping: shippingRule && shippingRule.free_shipping_threshold ? 
            Math.max(0, shippingRule.free_shipping_threshold - total_value) : null
        });
      });
    }
  );
});

// Get all shipping rules
router.get('/rules', (req, res) => {
  const { country } = req.query;
  
  let query = 'SELECT * FROM shipping_rules WHERE is_active = 1';
  const params = [];
  
  if (country) {
    query += ' AND country = ?';
    params.push(country);
  }
  
  query += ' ORDER BY country, min_weight';
  
  db.all(query, params, (err, rules) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen verzendregels' });
    }
    
    res.json({ shipping_rules: rules });
  });
});

// Create shipping rule
router.post('/rules', [
  body('name').trim().isLength({ min: 1 }).withMessage('Naam is verplicht'),
  body('country').trim().isLength({ min: 1 }).withMessage('Land is verplicht'),
  body('shipping_cost').isFloat({ min: 0 }).withMessage('Verzendkosten moeten een positief getal zijn')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const {
    name, country, min_weight = 0, max_weight = 999999,
    min_order_value = 0, max_order_value = 999999.99,
    shipping_cost, free_shipping_threshold
  } = req.body;
  
  db.run(`
    INSERT INTO shipping_rules (
      name, country, min_weight, max_weight, min_order_value, 
      max_order_value, shipping_cost, free_shipping_threshold
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [name, country, min_weight, max_weight, min_order_value, max_order_value, shipping_cost, free_shipping_threshold],
  function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij aanmaken verzendregel' });
    }
    
    res.status(201).json({
      message: 'Verzendregel succesvol aangemaakt',
      ruleId: this.lastID
    });
  });
});

// Calculate tax for order
router.post('/calculate-tax', [
  body('country').trim().isLength({ min: 1 }).withMessage('Land is verplicht'),
  body('items').isArray({ min: 1 }).withMessage('Items zijn verplicht'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotaal is verplicht')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { country, items, subtotal } = req.body;
  
  // Get tax rules for country
  db.all(`
    SELECT * FROM tax_rules 
    WHERE country = ? AND is_active = 1
    ORDER BY applies_to DESC
  `, [country], (err, taxRules) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen belastingregels' });
    }
    
    if (taxRules.length === 0) {
      return res.json({
        tax_amount: 0,
        tax_rate: 0,
        tax_breakdown: [],
        total_with_tax: subtotal,
        message: 'Geen belastingregels gevonden voor dit land'
      });
    }
    
    // Calculate tax per item based on category or general rule
    let totalTax = 0;
    const taxBreakdown = [];
    
    // Get product categories for items
    const productSkus = items.map(item => item.sku);
    const placeholders = productSkus.map(() => '?').join(',');
    
    if (productSkus.length > 0) {
      db.all(`
        SELECT sku, category FROM products WHERE sku IN (${placeholders})
      `, productSkus, (err, products) => {
        if (err) {
          return res.status(500).json({ error: 'Database fout bij ophalen productcategorieën' });
        }
        
        items.forEach(item => {
          const product = products.find(p => p.sku === item.sku);
          const category = product ? product.category : null;
          
          // Find applicable tax rule
          let applicableTaxRule = taxRules.find(rule => 
            rule.applies_to === 'category' && rule.product_category === category
          );
          
          if (!applicableTaxRule) {
            applicableTaxRule = taxRules.find(rule => rule.applies_to === 'all');
          }
          
          if (applicableTaxRule) {
            const itemTax = (item.total_price * applicableTaxRule.tax_rate) / 100;
            totalTax += itemTax;
            
            taxBreakdown.push({
              sku: item.sku,
              name: item.name || item.sku,
              category: category,
              tax_rate: applicableTaxRule.tax_rate,
              tax_amount: itemTax,
              rule_name: applicableTaxRule.name
            });
          }
        });
        
        res.json({
          tax_amount: totalTax,
          tax_rate: totalTax > 0 ? (totalTax / subtotal * 100) : 0,
          tax_breakdown: taxBreakdown,
          total_with_tax: subtotal + totalTax,
          country: country
        });
      });
    } else {
      // No products, use general tax rate
      const generalTaxRule = taxRules.find(rule => rule.applies_to === 'all');
      const taxRate = generalTaxRule ? generalTaxRule.tax_rate : 21; // Default to 21% BTW
      const taxAmount = (subtotal * taxRate) / 100;
      
      res.json({
        tax_amount: taxAmount,
        tax_rate: taxRate,
        tax_breakdown: [{
          rule_name: generalTaxRule ? generalTaxRule.name : 'Standaard BTW',
          tax_rate: taxRate,
          tax_amount: taxAmount
        }],
        total_with_tax: subtotal + taxAmount,
        country: country
      });
    }
  });
});

// Get tax rules
router.get('/tax-rules', (req, res) => {
  const { country } = req.query;
  
  let query = 'SELECT * FROM tax_rules WHERE is_active = 1';
  const params = [];
  
  if (country) {
    query += ' AND country = ?';
    params.push(country);
  }
  
  query += ' ORDER BY country, tax_rate';
  
  db.all(query, params, (err, rules) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen belastingregels' });
    }
    
    res.json({ tax_rules: rules });
  });
});

module.exports = router;
