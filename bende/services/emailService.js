const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail({ to, subject, text, html }) {
    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.COMPANY_NAME || 'Webshop CRM'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html
      });

      console.log('Email verzonden:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email fout:', error);
      return { success: false, error: error.message };
    }
  }

  async sendCustomerEmail(customer, { subject, message, template = 'default' }) {
    const templates = {
      default: this.getDefaultTemplate(customer, message),
      welcome: this.getWelcomeTemplate(customer),
      order_confirmation: this.getOrderConfirmationTemplate(customer, message),
      marketing: this.getMarketingTemplate(customer, message)
    };

    const html = templates[template] || templates.default;

    return await this.sendEmail({
      to: customer.email,
      subject,
      text: message,
      html
    });
  }

  getDefaultTemplate(customer, message) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${process.env.COMPANY_NAME || 'Webshop CRM'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.COMPANY_NAME || 'Webshop CRM'}</h1>
          </div>
          <div class="content">
            <h2>Beste ${customer.first_name} ${customer.last_name},</h2>
            <p>${message}</p>
            <p>Met vriendelijke groet,<br>Het ${process.env.COMPANY_NAME || 'Webshop'} Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Webshop CRM'}. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getWelcomeTemplate(customer) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welkom bij ${process.env.COMPANY_NAME || 'Webshop CRM'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .cta { background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welkom ${customer.first_name}!</h1>
          </div>
          <div class="content">
            <h2>Bedankt voor je registratie!</h2>
            <p>We zijn blij dat je je hebt aangesloten bij onze webshop. Je account is succesvol aangemaakt.</p>
            <p><strong>Je gegevens:</strong></p>
            <ul>
              <li>Naam: ${customer.first_name} ${customer.last_name}</li>
              <li>E-mail: ${customer.email}</li>
              <li>Klant ID: ${customer.id}</li>
            </ul>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="cta">Begin met winkelen</a>
            <p>Heb je vragen? Neem gerust contact met ons op!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Webshop CRM'}. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getOrderConfirmationTemplate(customer, orderDetails) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bestelling Bevestiging</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Bestelling Bevestigd</h1>
          </div>
          <div class="content">
            <h2>Beste ${customer.first_name},</h2>
            <p>Bedankt voor je bestelling! We hebben je order ontvangen en gaan deze verwerken.</p>
            <div class="order-details">
              ${orderDetails}
            </div>
            <p>Je ontvangt een track & trace code zodra je bestelling is verzonden.</p>
            <p>Met vriendelijke groet,<br>Het ${process.env.COMPANY_NAME || 'Webshop'} Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Webshop CRM'}. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getMarketingTemplate(customer, message) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Speciale Aanbieding</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .highlight { background: #FEF3C7; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #F59E0B; }
          .cta { background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 Exclusieve Aanbieding</h1>
          </div>
          <div class="content">
            <h2>Hallo ${customer.first_name},</h2>
            <div class="highlight">
              ${message}
            </div>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="cta">Profiteer Nu!</a>
            <p><small>Deze aanbieding is geldig tot ${new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString('nl-NL')}</small></p>
          </div>
          <div class="footer">
            <p>Wil je geen marketing e-mails meer ontvangen? <a href="#">Uitschrijven</a></p>
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Webshop CRM'}. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
