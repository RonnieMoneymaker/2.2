const axios = require('axios');
const fs = require('fs');
const path = require('path');

class RealDHLService {
  constructor() {
    this.apiKey = process.env.DHL_API_KEY;
    this.apiSecret = process.env.DHL_API_SECRET;
    this.accountNumber = process.env.DHL_ACCOUNT_NUMBER;
    this.baseUrl = process.env.DHL_ENVIRONMENT === 'production' 
      ? 'https://api-eu.dhl.com' 
      : 'https://api-sandbox.dhl.com';
    
    this.authToken = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    try {
      if (!this.apiKey || !this.apiSecret) {
        console.log('⚠️ DHL API credentials niet gevonden - gebruik mock service');
        return false;
      }

      if (this.authToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return true;
      }

      const response = await axios.post(`${this.baseUrl}/auth/v1/validate`, {
        apiKey: this.apiKey,
        apiSecret: this.apiSecret
      });

      this.authToken = response.data.accessToken;
      this.tokenExpiry = new Date(Date.now() + (response.data.expiresIn * 1000));
      
      console.log('✅ DHL API authenticated successfully');
      return true;

    } catch (error) {
      console.error('❌ DHL authentication failed:', error.response?.data || error.message);
      return false;
    }
  }

  async createShipment(shipmentData) {
    try {
      const isAuthenticated = await this.authenticate();
      if (!isAuthenticated) {
        return this.createMockShipment(shipmentData);
      }

      const shipmentRequest = {
        plannedShippingDateAndTime: new Date().toISOString(),
        pickup: {
          isRequested: false
        },
        productCode: shipmentData.serviceType || 'N',
        localProductCode: shipmentData.serviceType || 'N',
        getRateEstimates: false,
        accounts: [{
          typeCode: 'shipper',
          number: this.accountNumber
        }],
        customerDetails: {
          shipperDetails: {
            postalAddress: {
              postalCode: shipmentData.sender.postalCode,
              cityName: shipmentData.sender.city,
              countryCode: shipmentData.sender.countryCode,
              addressLine1: shipmentData.sender.street
            },
            contactInformation: {
              email: shipmentData.sender.email,
              phone: shipmentData.sender.phone,
              companyName: shipmentData.sender.companyName,
              fullName: shipmentData.sender.name
            }
          },
          receiverDetails: {
            postalAddress: {
              postalCode: shipmentData.receiver.postalCode,
              cityName: shipmentData.receiver.city,
              countryCode: shipmentData.receiver.countryCode,
              addressLine1: shipmentData.receiver.street
            },
            contactInformation: {
              email: shipmentData.receiver.email,
              phone: shipmentData.receiver.phone,
              companyName: shipmentData.receiver.companyName || '',
              fullName: shipmentData.receiver.name
            }
          }
        },
        content: {
          packages: shipmentData.packages.map(pkg => ({
            weight: pkg.weight,
            dimensions: {
              length: pkg.length,
              width: pkg.width,
              height: pkg.height
            }
          })),
          isCustomsDeclarable: shipmentData.receiver.countryCode !== 'NL',
          declaredValue: shipmentData.declaredValue || 0,
          declaredValueCurrency: 'EUR',
          description: shipmentData.description || 'Webshop order',
          incoterms: 'DAP'
        },
        outputImageProperties: {
          imageOptions: [{
            typeCode: 'label',
            templateName: 'ECOM26_84_001',
            isRequested: true
          }]
        }
      };

      const response = await axios.post(`${this.baseUrl}/shipments/v1/shipments`, shipmentRequest, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const shipment = response.data.shipments[0];
      
      // Save label to file
      if (shipment.documents && shipment.documents.length > 0) {
        const labelData = shipment.documents[0].content;
        const labelPath = path.join(__dirname, '../labels', `${shipment.shipmentTrackingNumber}.pdf`);
        
        // Create labels directory if it doesn't exist
        const labelsDir = path.dirname(labelPath);
        if (!fs.existsSync(labelsDir)) {
          fs.mkdirSync(labelsDir, { recursive: true });
        }
        
        fs.writeFileSync(labelPath, Buffer.from(labelData, 'base64'));
      }

      return {
        success: true,
        trackingNumber: shipment.shipmentTrackingNumber,
        labelUrl: shipment.documents?.[0]?.url,
        labelPath: `labels/${shipment.shipmentTrackingNumber}.pdf`,
        estimatedDelivery: shipment.estimatedDeliveryDate,
        cost: shipment.shipmentCharges?.[0]?.amount || 0,
        currency: shipment.shipmentCharges?.[0]?.currency || 'EUR'
      };

    } catch (error) {
      console.error('Error creating DHL shipment:', error.response?.data || error.message);
      return this.createMockShipment(shipmentData);
    }
  }

  async trackShipment(trackingNumber) {
    try {
      const isAuthenticated = await this.authenticate();
      if (!isAuthenticated) {
        return this.getMockTrackingInfo(trackingNumber);
      }

      const response = await axios.get(`${this.baseUrl}/track/shipments`, {
        params: {
          trackingNumber: trackingNumber
        },
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const shipment = response.data.shipments[0];
      
      return {
        trackingNumber: trackingNumber,
        status: shipment.status.statusCode,
        statusDescription: shipment.status.status,
        estimatedDelivery: shipment.estimatedDeliveryDate,
        events: shipment.events.map(event => ({
          timestamp: event.timestamp,
          location: event.location?.address?.addressLocality,
          description: event.description,
          statusCode: event.statusCode
        }))
      };

    } catch (error) {
      console.error('Error tracking DHL shipment:', error.response?.data || error.message);
      return this.getMockTrackingInfo(trackingNumber);
    }
  }

  async getShippingRates(rateRequest) {
    try {
      const isAuthenticated = await this.authenticate();
      if (!isAuthenticated) {
        return this.getMockRates(rateRequest);
      }

      const response = await axios.post(`${this.baseUrl}/rates/v1/rates`, {
        customerDetails: {
          shipperDetails: {
            postalAddress: {
              postalCode: rateRequest.sender.postalCode,
              cityName: rateRequest.sender.city,
              countryCode: rateRequest.sender.countryCode
            }
          },
          receiverDetails: {
            postalAddress: {
              postalCode: rateRequest.receiver.postalCode,
              cityName: rateRequest.receiver.city,
              countryCode: rateRequest.receiver.countryCode
            }
          }
        },
        accounts: [{
          typeCode: 'shipper',
          number: this.accountNumber
        }],
        productCode: rateRequest.serviceType || 'N',
        plannedShippingDateAndTime: new Date().toISOString(),
        unitOfMeasurement: 'metric',
        isCustomsDeclarable: rateRequest.receiver.countryCode !== 'NL',
        monetaryAmount: [{
          typeCode: 'declaredValue',
          value: rateRequest.declaredValue || 0,
          currency: 'EUR'
        }],
        packages: rateRequest.packages
      }, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.products.map(product => ({
        serviceType: product.productCode,
        serviceName: product.productName,
        totalPrice: product.totalPrice[0].price,
        currency: product.totalPrice[0].currency,
        deliveryTime: product.deliveryCapabilities?.deliveryTypeCode,
        estimatedDelivery: product.deliveryCapabilities?.estimatedDeliveryDateAndTime
      }));

    } catch (error) {
      console.error('Error getting DHL rates:', error.response?.data || error.message);
      return this.getMockRates(rateRequest);
    }
  }

  createMockShipment(shipmentData) {
    const trackingNumber = `3S4A${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    console.log('🔄 Mock DHL shipment created:', trackingNumber);
    
    return {
      success: true,
      trackingNumber: trackingNumber,
      labelUrl: `https://mock-dhl-api.com/labels/${trackingNumber}.pdf`,
      labelPath: `labels/${trackingNumber}.pdf`,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      cost: 6.95,
      currency: 'EUR'
    };
  }

  getMockTrackingInfo(trackingNumber) {
    return {
      trackingNumber: trackingNumber,
      status: 'transit',
      statusDescription: 'Shipment is on its way',
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      events: [
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          location: 'Amsterdam',
          description: 'Shipment picked up',
          statusCode: 'PU'
        },
        {
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          location: 'Utrecht',
          description: 'In transit',
          statusCode: 'T'
        }
      ]
    };
  }

  getMockRates(rateRequest) {
    return [
      {
        serviceType: 'N',
        serviceName: 'DHL Parcel Netherlands',
        totalPrice: 6.95,
        currency: 'EUR',
        deliveryTime: 'next_business_day',
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        serviceType: 'E',
        serviceName: 'DHL Express',
        totalPrice: 12.50,
        currency: 'EUR',
        deliveryTime: 'same_day',
        estimatedDelivery: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
}

module.exports = new RealDHLService();
