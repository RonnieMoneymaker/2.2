# 🔌 API Koppeling Handleiding

## ✅ Systeem Ondersteunt LIVE DATA van:

### 📊 **Advertising Platforms**
- ✅ Google Ads - Live campaigns, metrics, ROAS
- ✅ Meta Ads (Facebook/Instagram) - Live campaigns, spend, conversies

### 📦 **Shipping Providers**
- ✅ DHL - Live labels, tracking, verzendkosten
- ✅ PostNL - Live verzending Nederland
- ✅ UPS - International shipping

### 📧 **Email Services**
- ✅ SMTP (Gmail, Outlook, etc.) - Transactional emails
- ✅ SendGrid - Marketing emails

### 💳 **Payment Providers**
- ✅ Mollie - iDEAL, credit cards (NL/EU)
- ✅ Stripe - International payments
- ✅ PayPal - Worldwide payments

---

## 🚀 HOE TE KOPPELEN

### **Methode 1: Via CMS Dashboard (Aanbevolen)**

1. **Open CMS**: http://localhost:2001
2. **Login**: admin@webshop.nl / admin123
3. **Ga naar**: API Instellingen
4. **Kies platform**: Google Ads, Meta Ads, etc.
5. **Voer credentials in**
6. **Klik "Test Verbinding"**
7. **Klik "Opslaan"**

✅ **Direct live data!** - Systeem herlaadt automatisch

---

### **Methode 2: Via .env Bestand**

Maak `.env` bestand in de `bende/` directory:

```env
# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_here
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret_here
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token_here
GOOGLE_ADS_CUSTOMER_ID=123-456-7890

# Meta/Facebook Ads API  
META_ACCESS_TOKEN=your_access_token_here
META_AD_ACCOUNT_ID=act_1234567890
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here

# DHL API
DHL_API_KEY=your_dhl_api_key
DHL_API_SECRET=your_dhl_api_secret
DHL_ACCOUNT_NUMBER=your_account_number
DHL_ENVIRONMENT=sandbox

# Email SMTP (bijv. Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASS=your_app_password

# Or SendGrid
SENDGRID_API_KEY=SG.your_api_key_here
```

**Herstart backend** voor .env changes:
```bash
# Stop server (Ctrl+C)
cd bende
$env:PORT="2000"
node server.js
```

---

## 📖 HOE CREDENTIALS TE VERKRIJGEN

### 🎯 **Google Ads API**

1. **Google Cloud Console**: https://console.cloud.google.com
2. **Maak project** → Enable Google Ads API
3. **OAuth 2.0 Credentials** aanmaken:
   - Type: OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs: http://localhost:2000/oauth/callback
4. **Developer Token aanvragen**: https://ads.google.com/aw/apicenter
5. **Refresh Token genereren**: 
   - https://developers.google.com/oauthplayground
   - Select Google Ads API v14
   - Authorize en exchange token

📚 **Docs**: https://developers.google.com/google-ads/api/docs/start

---

### 📱 **Meta Ads (Facebook/Instagram)**

1. **Meta for Developers**: https://developers.facebook.com
2. **Create App** → Business type
3. **Add Product**: Marketing API
4. **Get Access Token**:
   - Go to Tools → Access Token Tool
   - Select ads_read + ads_management permissions
   - Generate token
5. **Ad Account ID vinden**:
   - Go to Ads Manager: https://business.facebook.com/adsmanager
   - URL bevat act_XXXXXXXXX

📚 **Docs**: https://developers.facebook.com/docs/marketing-apis

---

### 📦 **DHL API**

1. **DHL Developer Portal**: https://developer.dhl.com
2. **Create Account**
3. **Subscribe to**: DHL Express Shipping API
4. **Get Credentials**:
   - API Key
   - API Secret
   - Account Number
5. **Start met sandbox mode** voor testen

📚 **Docs**: https://developer.dhl.com/api-reference/dhl-express-mydhl-api

---

### 📧 **SMTP Email (Gmail)**

1. **Gmail Account** → Settings → Security
2. **Enable 2-Factor Authentication**
3. **App Passwords**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: Mail
   - Select device: Other (Custom name)
   - Generate password: gebruik dit als SMTP_PASS

**Settings**:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jouw@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx (app password)
```

---

### 📧 **SendGrid**

1. **SendGrid Account**: https://signup.sendgrid.com
2. **Free plan**: 100 emails/dag gratis
3. **API Key aanmaken**:
   - Settings → API Keys
   - Create API Key
   - Full Access
   - Copy key (begint met SG.)

---

## 🔄 AUTOMATISCHE LIVE DATA ACTIVATIE

### **Wat gebeurt er automatisch:**

1. ✅ **Credentials opslaan** (via CMS of .env)
2. ✅ **Service herlaadt** automatisch
3. ✅ **API test** connectie
4. ✅ **Frontend schakelt om** naar live data
5. ✅ **Dashboard toont** echte cijfers

### **Live Data Endpoints:**

| API | Wat Je Ziet | Waar |
|-----|-------------|------|
| **Google Ads** | Live campaigns, spend, clicks, conversies, ROAS | Advertising pagina |
| **Meta Ads** | Live Facebook/Instagram campaigns, metrics | Advertising pagina |
| **Google + Meta** | Combined marketing kosten | Dashboard "Marketing Breakdown" |
| **DHL** | Live verzendlabels, tracking, tarieven | Verzending pagina |
| **SMTP** | Email verzonden naar klanten | Email geschiedenis |

---

## 🧪 TESTEN VAN API VERBINDINGEN

### **Via CMS:**
1. API Instellingen → Select platform
2. Voer credentials in
3. Klik "Test Verbinding"
4. ✅ Groen = Werkt!
5. ❌ Rood = Check credentials

### **Via Terminal:**
```bash
# Test Google Ads
curl http://localhost:2000/api/apiSettings/status

# Response als Google Ads ACTIEF is:
{
  "google_ads": {
    "connected": true,
    "status": "active",
    "message": "Live data beschikbaar"
  }
}
```

---

## 💡 TIPS

### ✅ **Best Practices:**

1. **Start met Sandbox/Test mode**
   - Google Ads: Test account
   - DHL: sandbox environment
   - Meta Ads: Test ad account

2. **Test eerst met .env**
   - Makkelijker debuggen
   - Sneller itereren
   - Daarna naar database

3. **Check console logs**
   - Backend terminal toont:
     - "✅ Google Ads API client geïnitialiseerd - LIVE DATA ACTIEF!"
     - "⚠️ Meta Ads credentials niet gevonden"

4. **Monitor API calls**
   - Dashboard laat zien: "Live data" vs "Geen data"
   - Console toont API responses

### ⚠️ **Veelvoorkomende Problemen:**

**"API niet actief" ondanks credentials:**
- ✅ Herstart backend na .env changes
- ✅ Check spelling van environment variabelen
- ✅ Credentials valid? Test in Google/Meta console

**"Permission denied" errors:**
- ✅ Check OAuth scopes/permissions
- ✅ Refresh token nog geldig?
- ✅ Ad account toegang correct?

**"Rate limit exceeded":**
- ✅ Google/Meta limiet bereikt
- ✅ Wacht 24u of upgrade plan
- ✅ Reduce polling frequency

---

## 🎯 VERIFICATIE

### **Checklist - Is API gekoppeld?**

#### Google Ads:
- [ ] Console log: "✅ Google Ads API client geïnitialiseerd"
- [ ] API Status endpoint: `"connected": true`
- [ ] Advertising pagina: Echte campaigns zichtbaar
- [ ] Dashboard: Marketing kosten > €0

#### Meta Ads:
- [ ] Console log: "✅ Meta Ads API client geïnitialiseerd"
- [ ] API Status endpoint: `"connected": true`
- [ ] Advertising pagina: Facebook campaigns zichtbaar
- [ ] Dashboard: Marketing kosten > €0

#### DHL:
- [ ] Verzending pagina: Live tarieven calculator werkt
- [ ] Order pagina: "Generate DHL Label" button werkt
- [ ] Tracking numbers worden gegenereerd

#### Email:
- [ ] Test email verzonden via CMS
- [ ] Customer ontvangt email
- [ ] Email geschiedenis toont verzonden emails

---

## 🚀 NA KOPPELING

### **Wat Je Direct Ziet:**

1. **Dashboard**
   - Marketing Kosten Breakdown: Echte bedragen van Google + Meta
   - ROAS: Echte return on ad spend
   - Live bezoekers: Als Google Analytics gekoppeld

2. **Advertising Pagina**
   - Live campaigns lijst
   - Real-time spend, clicks, conversies
   - Performance grafieken
   - Platform vergelijking

3. **Orders**
   - "Generate DHL Label" werkt
   - Tracking numbers automatisch
   - Email notifications naar klanten

4. **Magic Live Map**
   - Echte customer locaties
   - Echte orders op kaart
   - Live statistieken

---

## 📞 SUPPORT

**Lukt het niet?**

1. Check backend console voor errors
2. Test API credentials in originele platform
3. Verify OAuth scopes/permissions
4. Check firewall/network issues

**Backend logs bekijken:**
```bash
# In terminal waar backend draait
# Zie je: "✅ API client geïnitialiseerd"?
# Of: "⚠️ credentials niet gevonden"?
```

---

## ✨ RESULTAAT

**Met gekoppelde API's:**
- 🎯 Geen fake data meer
- 📊 Alle cijfers zijn LIVE
- 🔄 Auto-refresh elke 30-60 seconden
- 💰 Echte ROAS, profit, costs
- 📈 Echte grafieken en trends

**Het CMS wordt een ECHTE business intelligence tool!** 🚀

