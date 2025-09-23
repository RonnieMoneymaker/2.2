const axios = require('axios');
const emailService = require('./emailService');
const { db } = require('../database/init');

class DHLService {
  constructor() {
    this.apiUrl = process.env.DHL_API_URL || 'https://api-eu.dhl.com/parcel/v1';
    this.apiKey = process.env.DHL_API_KEY || 'demo_key';
    this.accountNumber = process.env.DHL_ACCOUNT_NUMBER || 'demo_account';
    this.senderAddress = {
      name: process.env.COMPANY_NAME || 'Webshop BV',
      street: process.env.COMPANY_STREET || 'Hoofdstraat 123',
      houseNumber: process.env.COMPANY_HOUSE_NUMBER || '123',
      postalCode: process.env.COMPANY_POSTAL_CODE || '1000 AB',
      city: process.env.COMPANY_CITY || 'Amsterdam',
      country: process.env.COMPANY_COUNTRY || 'NL'
    };
  }

  // Create shipping label for order
  async createShippingLabel(orderId, options = {}) {
    try {
      // Get order details from database
      const order = await this.getOrderDetails(orderId);
      
      if (!order) {
        throw new Error('Bestelling niet gevonden');
      }

      // Prepare DHL shipment data
      const shipmentData = {
        accountNumber: this.accountNumber,
        shipmentDetails: {
          service: options.service || 'STANDARD',
          shipmentDate: new Date().toISOString().split('T')[0],
          sender: this.senderAddress,
          receiver: {
            name: `${order.first_name} ${order.last_name}`,
            street: this.parseAddress(order.shipping_address).street,
            houseNumber: this.parseAddress(order.shipping_address).houseNumber,
            postalCode: this.parseAddress(order.shipping_address).postalCode,
            city: this.parseAddress(order.shipping_address).city,
            country: order.country || 'NL'
          },
          packages: [{
            weight: options.weight || 1000, // grams
            length: options.length || 30,   // cm
            width: options.width || 20,     // cm
            height: options.height || 10,   // cm
            reference: order.order_number
          }]
        }
      };

      // For demo purposes, simulate DHL API response
      const mockResponse = {
        success: true,
        trackingNumber: `DHL${Date.now()}`,
        labelUrl: `https://example.com/label/${order.order_number}.pdf`,
        shipmentId: `SHIP_${Date.now()}`,
        estimatedDelivery: this.calculateDeliveryDate(order.country || 'NL'),
        cost: this.calculateShippingCost(shipmentData.shipmentDetails.packages[0])
      };

      // In real implementation:
      // const response = await axios.post(`${this.apiUrl}/shipments`, shipmentData, {
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json'
      //   }
      // });

      // Save tracking info to database
      await this.saveTrackingInfo(orderId, mockResponse);

      // Update order status to 'shipped'
      await this.updateOrderStatus(orderId, 'shipped', mockResponse.trackingNumber);

      // Send automatic email to customer
      await this.sendShippingNotification(order, mockResponse);

      return mockResponse;
    } catch (error) {
      console.error('DHL API Error:', error);
      throw new Error(`DHL label aanmaken mislukt: ${error.message}`);
    }
  }

  // Create bulk shipping labels
  async createBulkShippingLabels(orderIds, options = {}) {
    const results = {
      successful: [],
      failed: [],
      totalProcessed: orderIds.length
    };

    for (const orderId of orderIds) {
      try {
        const result = await this.createShippingLabel(orderId, options);
        results.successful.push({
          orderId,
          trackingNumber: result.trackingNumber,
          labelUrl: result.labelUrl
        });
      } catch (error) {
        results.failed.push({
          orderId,
          error: error.message
        });
      }
    }

    return results;
  }

  // Get order details from database
  getOrderDetails(orderId) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT o.*, c.first_name, c.last_name, c.email, c.country
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
      `, [orderId], (err, order) => {
        if (err) reject(err);
        else resolve(order);
      });
    });
  }

  // Parse address string into components
  parseAddress(addressString) {
    // Simple address parser - in real app would be more sophisticated
    const parts = addressString.split(',');
    const streetPart = parts[0]?.trim() || '';
    const cityPart = parts[1]?.trim() || '';
    
    // Extract house number from street
    const streetMatch = streetPart.match(/^(.+?)(\d+[a-zA-Z]*)$/);
    const street = streetMatch ? streetMatch[1].trim() : streetPart;
    const houseNumber = streetMatch ? streetMatch[2] : '';
    
    // Extract postal code from city part
    const cityMatch = cityPart.match(/^(\d{4}\s*[A-Z]{2})\s*(.+)$/);
    const postalCode = cityMatch ? cityMatch[1] : '';
    const city = cityMatch ? cityMatch[2] : cityPart;

    return {
      street: street || 'Onbekend',
      houseNumber: houseNumber || '1',
      postalCode: postalCode || '1000 AB',
      city: city || 'Amsterdam'
    };
  }

  // Calculate estimated delivery date
  calculateDeliveryDate(country) {
    const deliveryDays = {
      'NL': 1,
      'Nederland': 1,
      'BE': 2,
      'België': 2,
      'DE': 2,
      'Duitsland': 2,
      'FR': 3,
      'Frankrijk': 3
    };

    const days = deliveryDays[country] || 3;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    
    return deliveryDate.toISOString().split('T')[0];
  }

  // Calculate shipping cost based on package size
  calculateShippingCost(packageInfo) {
    const weight = packageInfo.weight || 1000;
    const volume = (packageInfo.length || 30) * (packageInfo.width || 20) * (packageInfo.height || 10);
    
    // Simple cost calculation
    let baseCost = 6.95;
    if (weight > 2000) baseCost += 2.00;
    if (volume > 10000) baseCost += 1.50;
    
    return baseCost;
  }

  // Save tracking information to database
  saveTrackingInfo(orderId, dhlResponse) {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO shipping_tracking (
          order_id, tracking_number, carrier, shipment_id, 
          label_url, estimated_delivery, shipping_cost, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        orderId, 
        dhlResponse.trackingNumber, 
        'DHL', 
        dhlResponse.shipmentId,
        dhlResponse.labelUrl,
        dhlResponse.estimatedDelivery,
        dhlResponse.cost
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Update order status
  updateOrderStatus(orderId, status, trackingNumber) {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE orders 
        SET status = ?, tracking_number = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status, trackingNumber, orderId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Send shipping notification email to customer
  async sendShippingNotification(order, trackingInfo) {
    try {
      const customer = {
        id: order.customer_id,
        email: order.email,
        first_name: order.first_name,
        last_name: order.last_name
      };

      const trackingUrl = `https://www.dhl.nl/nl/particulier/pakketten-ontvangen/pakket-volgen.html?submit=1&tracking-id=${trackingInfo.trackingNumber}`;
      
      const emailContent = `
        <h2>Je bestelling is verzonden! 📦</h2>
        <p>Beste ${order.first_name},</p>
        <p>Goed nieuws! Je bestelling <strong>${order.order_number}</strong> is zojuist verzonden via DHL.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Verzendgegevens:</h3>
          <p><strong>Track & Trace:</strong> ${trackingInfo.trackingNumber}</p>
          <p><strong>Verwachte levering:</strong> ${new Date(trackingInfo.estimatedDelivery).toLocaleDateString('nl-NL')}</p>
          <p><strong>Verzendadres:</strong> ${order.shipping_address}</p>
        </div>
        
        <p>
          <a href="${trackingUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            📍 Volg je pakket
          </a>
        </p>
        
        <p>Je pakket wordt bezorgd door DHL. Zorg dat er iemand thuis is of kies een DHL ServicePoint voor ophaling.</p>
        
        <p>Heb je vragen over je bestelling? Neem gerust contact met ons op!</p>
      `;

      const result = await emailService.sendCustomerEmail(customer, {
        subject: `📦 Je bestelling ${order.order_number} is verzonden!`,
        message: emailContent,
        template: 'order_confirmation'
      });

      // Log email in database
      if (result.success) {
        db.run(`
          INSERT INTO email_logs (customer_id, subject, message, template, sent_by, status) 
          VALUES (?, ?, ?, ?, ?, ?)
        `, [order.customer_id, `Verzending ${order.order_number}`, emailContent, 'shipping_notification', 1, 'sent']);

        // Add customer interaction
        db.run(`
          INSERT INTO customer_interactions (customer_id, interaction_type, subject, description, created_by) 
          VALUES (?, ?, ?, ?, ?)
        `, [order.customer_id, 'email', 'Verzendnotificatie', `Automatische email verzonden voor bestelling ${order.order_number} met track & trace ${trackingInfo.trackingNumber}`, 'DHL Service']);
      }

      return result;
    } catch (error) {
      console.error('Error sending shipping notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get tracking information
  async getTrackingInfo(trackingNumber) {
    try {
      // In real implementation:
      // const response = await axios.get(`${this.apiUrl}/track/${trackingNumber}`, {
      //   headers: { 'Authorization': `Bearer ${this.apiKey}` }
      // });

      // Mock tracking response
      return {
        trackingNumber,
        status: 'in_transit',
        statusDescription: 'Pakket is onderweg naar de ontvanger',
        estimatedDelivery: this.calculateDeliveryDate('NL'),
        events: [
          {
            timestamp: new Date().toISOString(),
            location: 'Amsterdam Sorteercentrum',
            description: 'Pakket is aangekomen in sorteercentrum',
            statusCode: 'arrived_at_facility'
          },
          {
            timestamp: new Date(Date.now() - 2*60*60*1000).toISOString(),
            location: 'Webshop',
            description: 'Pakket is opgehaald door DHL',
            statusCode: 'picked_up'
          }
        ]
      };
    } catch (error) {
      throw new Error(`Tracking info ophalen mislukt: ${error.message}`);
    }
  }

  // Generate packing slip data
  generatePackingSlip(order, orderItems) {
    return {
      order_number: order.order_number,
      order_date: order.order_date,
      customer: {
        name: `${order.first_name} ${order.last_name}`,
        email: order.email,
        shipping_address: order.shipping_address
      },
      items: orderItems.map(item => ({
        name: item.product_name,
        sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      })),
      totals: {
        subtotal: order.total_amount,
        shipping_cost: 5.95, // Would calculate based on actual shipping
        tax_amount: order.total_amount * 0.21,
        total: order.total_amount + 5.95 + (order.total_amount * 0.21)
      },
      notes: order.notes || '',
      generated_at: new Date().toISOString()
    };
  }
}

module.exports = new DHLService();
