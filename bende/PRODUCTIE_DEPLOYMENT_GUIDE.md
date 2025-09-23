# 🚀 PRODUCTIE DEPLOYMENT GUIDE

## ✅ **WAT NU WERKT (VOOR TESTING)**

Het systeem draait nu **zonder authenticatie** zodat je alle functionaliteiten kunt testen:

- ✅ **Dashboard**: Live data, analytics
- ✅ **Klanten**: Toevoegen, bewerken, verwijderen  
- ✅ **Orders**: Bekijken, bewerken
- ✅ **Producten**: Toevoegen, bewerken, verwijderen
- ✅ **API Settings**: Nu toegankelijk zonder login

**Test URL**: http://localhost:3000

---

## 🎯 **STAPPEN VOOR ECHTE PRODUCTIE WEBSITE**

### **1. DATABASE UPGRADE (Verplicht)**

**Huidige situatie**: SQLite (alleen voor development)
**Productie**: PostgreSQL (Supabase/Railway)

#### **Optie A: Supabase (Aanbevolen)**
```bash
# 1. Ga naar supabase.com
# 2. Maak nieuw project
# 3. Kopieer DATABASE_URL
# 4. Voeg toe aan .env.production:
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

#### **Optie B: Railway PostgreSQL**
```bash
# 1. Ga naar railway.app  
# 2. Add PostgreSQL service
# 3. Kopieer CONNECTION_URL
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:7396/railway
```

### **2. ECHTE API KOPPELINGEN INSTELLEN**

#### **Google Ads API** (Voor advertentie tracking)
1. Ga naar [Google Ads API Console](https://developers.google.com/google-ads/api)
2. Maak Developer Token aan
3. Stel OAuth2 in
4. Voeg toe aan `.env.production`:
```env
GOOGLE_ADS_DEVELOPER_TOKEN=xxx-xxx-xxx
GOOGLE_ADS_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=xxx
GOOGLE_ADS_REFRESH_TOKEN=xxx
GOOGLE_ADS_CUSTOMER_ID=123-456-7890
```

#### **DHL API** (Voor verzending)
1. Registreer bij [DHL Developer Portal](https://developer.dhl.com/)
2. Vraag API keys aan
3. Voeg toe aan `.env.production`:
```env
DHL_API_KEY=xxx
DHL_API_SECRET=xxx
DHL_ACCOUNT_NUMBER=xxx
DHL_ENVIRONMENT=production
```

#### **Email Service** (Voor klantcommunicatie)
**Optie A: Gmail SMTP**
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jouw-crm@gmail.com
SMTP_PASS=jouw-app-wachtwoord
```

**Optie B: SendGrid (Professioneler)**
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx.xxx
```

#### **Betalingen** (Kies één)
**Mollie (Nederlands, makkelijkst):**
```env
MOLLIE_API_KEY=live_xxx
```

**Stripe (Internationaal):**
```env
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
```

### **3. HOSTING OPTIES**

#### **Optie A: Railway (Aanbevolen)**
```bash
# 1. Push naar GitHub
# 2. Ga naar railway.app
# 3. Deploy from GitHub
# 4. Add PostgreSQL database
# 5. Set environment variables
# 6. Deploy!
```

#### **Optie B: Vercel + Supabase**
```bash
# 1. Frontend naar Vercel
# 2. Backend naar Railway/Heroku
# 3. Database op Supabase
```

### **4. ENVIRONMENT SETUP**

Kopieer `env.production.example` naar `.env.production` en vul alle waarden in:

```bash
cp env.production.example .env.production
# Bewerk .env.production met echte waarden
```

### **5. DEPLOYMENT COMMANDO'S**

```bash
# Development (huidige setup)
npm run dev

# Production build
npm run build:production

# Production start
NODE_ENV=production npm start
```

---

## 🔐 **BEVEILIGING (Voor productie)**

### **Authenticatie Weer Inschakelen**
Na testing, schakel authenticatie weer in door comments te verwijderen in:
- `routes/products.js`  
- `routes/apiSettings.js`

### **HTTPS Verplicht**
- Gebruik altijd SSL certificaten
- Railway/Vercel doen dit automatisch

### **Environment Variables**
- Bewaar NOOIT API keys in code
- Gebruik altijd environment variables
- Verschillende keys voor development/production

---

## 📋 **CHECKLIST VOOR LIVE GANG**

### **Technisch**
- [ ] PostgreSQL database opgezet
- [ ] Alle API keys ingevuld  
- [ ] HTTPS werkend
- [ ] Email service getest
- [ ] Betalingen getest
- [ ] Backup strategie

### **Functioneel**
- [ ] Klanten kunnen worden toegevoegd
- [ ] Orders worden correct verwerkt
- [ ] Producten kunnen worden beheerd
- [ ] Pakbonnen kunnen worden gegenereerd
- [ ] Email notificaties werken
- [ ] Analytics tonen echte data

### **Juridisch**
- [ ] Privacy Policy
- [ ] Terms of Service  
- [ ] GDPR compliance
- [ ] Cookie consent

---

## 🆘 **SUPPORT & ONDERHOUD**

### **Monitoring**
- Database performance
- API rate limits
- Error logging
- Uptime monitoring

### **Backups**
- Dagelijkse database backups
- Code repository backups
- Environment variables backup

### **Updates**
- Security patches
- Dependency updates
- Feature updates

---

**🎉 Je CRM systeem is klaar voor een echte productie omgeving!**

**Volgende stap**: Test alle functionaliteiten op http://localhost:3000 en laat weten welke onderdelen je wilt verbeteren voordat je live gaat.
