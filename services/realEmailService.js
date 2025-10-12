const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

class RealEmailService {
  constructor() {
    this.transporter = null;
    this.emailProvider = process.env.EMAIL_PROVIDER || 'smtp'; // 'smtp' or 'sendgrid'
    this.initializeEmailService();
  }

  initializeEmailService() {
    if (this.emailProvider === 'sendgrid') {
      this.initializeSendGrid();
    } else {
      this.initializeSMTP();
    }
  }

  initializeSendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️ SendGrid API key niet gevonden - gebruik mock email service');
      return;
    }

    sgMail.setApiKey(apiKey);
    console.log('✅ SendGrid email service geïnitialiseerd');
  }

  initializeSMTP() {
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.log('⚠️ SMTP credentials niet gevonden - email service niet actief');
      return;
    }

    this.transporter = nodemailer.createTransport(smtpConfig);
    console.log('✅ SMTP email service geïnitialiseerd');
  }

  async sendOrderConfirmation(orderData) {
    const emailData = {
      to: orderData.customerEmail,
      from: process.env.FROM_EMAIL || 'noreply@webshop.nl',
      subject: `Bevestiging van je bestelling ${orderData.orderNumber}`,
      html: this.generateOrderConfirmationHTML(orderData)
    };

    return await this.sendEmail(emailData);
  }

  async sendShippingNotification(shippingData) {
    const emailData = {
      to: shippingData.customerEmail,
      from: process.env.FROM_EMAIL || 'noreply@webshop.nl',
      subject: `Je bestelling ${shippingData.orderNumber} is verzonden!`,
      html: this.generateShippingNotificationHTML(shippingData)
    };

    return await this.sendEmail(emailData);
  }

  async sendTrackingUpdate(trackingData) {
    const emailData = {
      to: trackingData.customerEmail,
      from: process.env.FROM_EMAIL || 'noreply@webshop.nl',
      subject: `Update voor je bestelling ${trackingData.orderNumber}`,
      html: this.generateTrackingUpdateHTML(trackingData)
    };

    return await this.sendEmail(emailData);
  }

  async sendMarketingEmail(campaignData) {
    const emailData = {
      to: campaignData.recipients,
      from: process.env.FROM_EMAIL || 'noreply@webshop.nl',
      subject: campaignData.subject,
      html: campaignData.htmlContent
    };

    return await this.sendEmail(emailData);
  }

  async sendEmail(emailData) {
    try {
      if (this.emailProvider === 'sendgrid' && sgMail.apiKey) {
        return await this.sendWithSendGrid(emailData);
      } else if (this.transporter) {
        return await this.sendWithSMTP(emailData);
      } else {
        return this.mockSendEmail(emailData);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWithSendGrid(emailData) {
    try {
      const msg = {
        to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
        from: emailData.from,
        subject: emailData.subject,
        html: emailData.html
      };

      await sgMail.send(msg);
      
      console.log('✅ Email verzonden via SendGrid naar:', emailData.to);
      return { success: true, provider: 'sendgrid' };

    } catch (error) {
      console.error('SendGrid error:', error.response?.body || error.message);
      return { success: false, error: error.message, provider: 'sendgrid' };
    }
  }

  async sendWithSMTP(emailData) {
    try {
      const mailOptions = {
        from: emailData.from,
        to: Array.isArray(emailData.to) ? emailData.to.join(',') : emailData.to,
        subject: emailData.subject,
        html: emailData.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email verzonden via SMTP naar:', emailData.to);
      return { success: true, provider: 'smtp', messageId: result.messageId };

    } catch (error) {
      console.error('SMTP error:', error);
      return { success: false, error: error.message, provider: 'smtp' };
    }
  }

  mockSendEmail(emailData) {
    console.log('🔄 Mock email verzonden:');
    console.log(`   Naar: ${Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to}`);
    console.log(`   Onderwerp: ${emailData.subject}`);
    console.log(`   Van: ${emailData.from}`);
    
    return { 
      success: true, 
      provider: 'mock',
      messageId: `mock_${Date.now()}`
    };
  }

  generateOrderConfirmationHTML(orderData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .product-item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .total { font-weight: bold; font-size: 1.2em; color: #4F46E5; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Bedankt voor je bestelling!</h1>
        </div>
        <div class="content">
            <p>Beste ${orderData.customerName},</p>
            <p>We hebben je bestelling ontvangen en bevestigen deze hierbij.</p>
            
            <div class="order-details">
                <h3>Bestelling Details</h3>
                <p><strong>Bestelnummer:</strong> ${orderData.orderNumber}</p>
                <p><strong>Datum:</strong> ${new Date(orderData.orderDate).toLocaleDateString('nl-NL')}</p>
                <p><strong>Totaalbedrag:</strong> €${orderData.total.toFixed(2)}</p>
            </div>

            ${orderData.items ? orderData.items.map(item => `
                <div class="product-item">
                    <strong>${item.name}</strong> - ${item.quantity}x €${item.price.toFixed(2)}
                </div>
            `).join('') : ''}

            <p>Je bestelling wordt zo snel mogelijk verwerkt en verzonden. Je ontvangt een e-mail met trackinggegevens zodra je bestelling onderweg is.</p>
            
            <p>Heb je vragen over je bestelling? Neem dan contact met ons op via support@webshop.nl</p>
        </div>
        <div class="footer">
            <p>Met vriendelijke groet,<br>Het Webshop Team</p>
        </div>
    </body>
    </html>
    `;
  }

  generateShippingNotificationHTML(shippingData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .tracking-info { background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10B981; }
            .tracking-number { font-size: 1.2em; font-weight: bold; color: #10B981; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Je bestelling is verzonden! 📦</h1>
        </div>
        <div class="content">
            <p>Beste ${shippingData.customerName},</p>
            <p>Goed nieuws! Je bestelling ${shippingData.orderNumber} is verzonden en is onderweg naar je toe.</p>
            
            <div class="tracking-info">
                <h3>Tracking Informatie</h3>
                <p><strong>Track & Trace nummer:</strong><br>
                <span class="tracking-number">${shippingData.trackingNumber}</span></p>
                <p><strong>Verwachte levering:</strong> ${new Date(shippingData.estimatedDelivery).toLocaleDateString('nl-NL')}</p>
                <p><strong>Verzendmethode:</strong> ${shippingData.shippingMethod || 'DHL'}</p>
            </div>

            <p>Je kunt je bestelling volgen via: <a href="https://www.dhl.nl/nl/particulier/pakketten-volgen.html?submit=1&tracking-id=${shippingData.trackingNumber}">DHL Tracking</a></p>
            
            <p>Heb je vragen? Neem contact met ons op via support@webshop.nl</p>
        </div>
        <div class="footer">
            <p>Met vriendelijke groet,<br>Het Webshop Team</p>
        </div>
    </body>
    </html>
    `;
  }

  generateTrackingUpdateHTML(trackingData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .status-update { background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3B82F6; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Update voor je bestelling</h1>
        </div>
        <div class="content">
            <p>Beste ${trackingData.customerName},</p>
            <p>Er is een update voor je bestelling ${trackingData.orderNumber}.</p>
            
            <div class="status-update">
                <h3>Status Update</h3>
                <p><strong>Huidige status:</strong> ${trackingData.statusDescription}</p>
                <p><strong>Locatie:</strong> ${trackingData.location}</p>
                <p><strong>Tijd:</strong> ${new Date(trackingData.timestamp).toLocaleString('nl-NL')}</p>
            </div>

            <p>Je kunt je bestelling blijven volgen via: <a href="https://www.dhl.nl/nl/particulier/pakketten-volgen.html?submit=1&tracking-id=${trackingData.trackingNumber}">DHL Tracking</a></p>
        </div>
        <div class="footer">
            <p>Met vriendelijke groet,<br>Het Webshop Team</p>
        </div>
    </body>
    </html>
    `;
  }
}

module.exports = new RealEmailService();
