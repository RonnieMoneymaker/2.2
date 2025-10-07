# 🚀 Quick Start Guide - Voltmover CMS

## ✅ Alles is werkend!

Je complete real-time backend met live dashboard is nu operationeel!

---

## 🎯 **Servers Starten**

### **Backend (Poort 2000)**
```bash
cd cms
$env:DATABASE_URL="file:./prisma/dev.db"
$env:PORT="2000"
npm start
```

### **Frontend (Poort 2001)**
```bash
cd cms/frontend
$env:PORT="2001"
npm start
```

---

## 🌐 **URLs**

| Service | URL | Beschrijving |
|---------|-----|--------------|
| **Dashboard** | http://localhost:2001 | Standaard admin dashboard |
| **Live Dashboard** | http://localhost:2001/live | Real-time monitoring dashboard ⭐ |
| **Backend API** | http://localhost:2000 | REST API endpoints |
| **WebSocket** | ws://localhost:2000 | Real-time WebSocket server |
| **Health Check** | http://localhost:2000/health | Server status |

---

## 📊 **Wat zit er in de Database?**

✅ **1 Website** - Voltmover Shop
✅ **9 Categorieën** - Electronics, Fashion, Home & Garden, Sports, Books
✅ **50 Producten** - Met varianten, attributen, en afbeeldingen
✅ **100 Klanten** - Nederlandse namen en adressen  
✅ **200 Bestellingen** - Complete orders met payment history
✅ **50 Reviews** - Product reviews (3-5 sterren)
✅ **4 Kortingscodes** - Actieve discount codes
✅ **2 Verzendmethoden** - Standaard en Express
✅ **4 BTW tarieven** - NL, BE, DE, FR

---

## 🔑 **API Authentication**

Voor alle `/api/*` endpoints (behalve public routes):

**Header:**
```
x-api-key: dev-api-key-123
```

**Voorbeeld:**
```bash
curl http://localhost:2000/api/products \
  -H "x-api-key: dev-api-key-123"
```

---

## 🎁 **Test Kortingscodes**

```
WELCOME10  → 10% korting bij orders boven €50
SUMMER25   → 25% korting bij orders boven €100  
FREESHIP   → Gratis verzending boven €25
SAVE50     → €50 korting bij orders boven €200
```

---

## 🔥 **Real-Time Features**

### **Live Dashboard** (http://localhost:2001/live)

**Real-Time KPIs:**
- 👥 Actieve Bezoekers
- 🛒 Vandaag Bestellingen + Omzet
- 💰 Gemiddelde Bestelling
- ⚠️ Lage Voorraad Alerts

**Live Updates:**
- 📊 Charts (30 dagen bestellingen & omzet)
- 👤 Actieve bezoekers met details
- 🛍️ Recent orders feed (real-time)
- 🔔 Toast notificaties bij nieuwe orders
- 🔊 Geluid bij nieuwe bestellingen

**WebSocket Events:**
- Automatische updates elke 5 seconden
- Instant notificaties bij nieuwe orders
- Live bezoeker tracking
- Real-time voorraad alerts

---

## 📡 **API Endpoints**

### **Public (Geen Auth)**
```bash
GET  /public/products              # Alle producten
GET  /public/products/:slug        # Enkel product
GET  /public/categories            # Alle categorieën
GET  /public/featured              # Featured producten
GET  /public/shipping-methods      # Verzendmethoden
POST /public/discount/validate     # Valideer kortingscode

GET  /cart/:sessionId              # Winkelwagen ophalen
POST /cart/:sessionId/items        # Item toevoegen
POST /cart/:sessionId/checkout     # Checkout
```

### **Admin (Auth Required)**
```bash
# Real-time
GET  /api/realtime/stats           # Complete live statistieken
GET  /api/realtime/stats/quick     # Quick stats
GET  /api/realtime/visitors        # Actieve bezoekers
GET  /api/realtime/admins          # Online admins

# Products
GET  /api/products                 # Alle producten
POST /api/products                 # Nieuw product
PUT  /api/products/:id             # Update product
DELETE /api/products/:id           # Verwijder product

# Orders
GET  /api/orders                   # Alle bestellingen
GET  /api/orders/:id               # Enkele bestelling
POST /api/orders                   # Nieuwe bestelling
PATCH /api/orders/:id/status       # Update status

# Customers
GET  /api/customers                # Alle klanten
POST /api/customers                # Nieuwe klant
PUT  /api/customers/:id            # Update klant

# Financial
GET  /api/financial/overview       # Financieel overzicht
GET  /api/financial/profit-by-product
GET  /api/financial/revenue-over-time

# Analytics
GET  /api/analytics/all            # Alle analytics
GET  /api/analytics/google-ads     # Google Ads data
GET  /api/analytics/facebook-ads   # Facebook Ads data
```

---

## 🧪 **Testing Real-Time Features**

### **Test Nieuwe Order Notificatie**
```bash
curl -X POST http://localhost:2000/api/realtime/trigger/order/1 \
  -H "x-api-key: dev-api-key-123"
```
→ Je ziet een toast notificatie in het Live Dashboard! 🎉

### **Test Lage Voorraad Alert**
```bash
curl -X POST http://localhost:2000/api/realtime/trigger/lowstock/1 \
  -H "x-api-key: dev-api-key-123"
```
→ Waarschuwing verschijnt in Live Dashboard! ⚠️

### **Test API Calls**
```bash
# Haal producten op
curl http://localhost:2000/public/products?limit=5

# Haal categorieën op
curl http://localhost:2000/public/categories

# Live stats (vereist API key)
curl http://localhost:2000/api/realtime/stats/quick \
  -H "x-api-key: dev-api-key-123"
```

---

## 🔧 **Database Beheer**

### **Reset Database & Herlaad Data**
```bash
cd cms
$env:DATABASE_URL="file:./prisma/dev.db"
node scripts/complete-seed.js
```

### **Prisma Studio (Visual Database Editor)**
```bash
cd cms
npx prisma studio
```
→ Opent op http://localhost:5555

---

## 🎨 **Frontend Pagina's**

| Route | Pagina | Features |
|-------|--------|----------|
| `/` | Dashboard | KPIs, grafieken, overzicht |
| `/live` | **Live Dashboard** | Real-time monitoring ⭐ |
| `/financial` | Financieel | Winst, kosten, marges |
| `/products` | Producten | Product management |
| `/categories` | Categorieën | Categorie beheer |
| `/customers` | Klanten | Klanten database |
| `/orders` | Bestellingen | Order management |
| `/analytics` | Analytics | Platform metrics |
| `/integrations` | Integraties | Platform connections |
| `/import` | Bulk Import | CSV upload |
| `/settings` | Instellingen | System config |

---

## 🚨 **Troubleshooting**

### **Server start niet**
```bash
# Check of poort al in gebruik is
netstat -ano | findstr :2000

# Kill process
taskkill /PID <process_id> /F

# Start opnieuw
cd cms
$env:DATABASE_URL="file:./prisma/dev.db"
npm start
```

### **Database errors**
```bash
# Regenereer Prisma client
cd cms
npx prisma generate

# Reset database
node scripts/complete-seed.js
```

### **Frontend laadt niet**
```bash
# Clear cache en herinstall
cd cms/frontend
rm -r node_modules package-lock.json
npm install
npm start
```

### **WebSocket connectie faalt**
- Check of backend draait op poort 2000
- Check browser console voor errors
- Ververs de pagina
- Check firewall settings

---

## 📚 **Documentatie**

- `README.md` - Complete overview
- `REALTIME_FEATURES.md` - Real-time features guide
- `WEBSITE_INTEGRATIE_GUIDE.md` - Website integration
- `VOLLEDIG_SYSTEEM.md` - Technical details
- `ENTERPRISE_INTEGRATIONS.md` - Platform integrations

---

## 🎯 **Volgende Stappen**

### **1. Verken het Live Dashboard**
Open http://localhost:2001/live en zie:
- Real-time statistieken
- Live grafieken
- Actieve bezoekers (simuleer door test API calls)
- Recent orders

### **2. Test de APIs**
```bash
# Producten ophalen
curl http://localhost:2000/public/products

# Test realtime notificatie
curl -X POST http://localhost:2000/api/realtime/trigger/order/5 \
  -H "x-api-key: dev-api-key-123"
```

### **3. Bouw je eigen website**
Gebruik de Public API endpoints om je webshop te bouwen:
- Fetch producten
- Toon categorieën
- Winkelwagen functionaliteit
- Checkout flow

Zie `WEBSITE_INTEGRATIE_GUIDE.md` voor voorbeelden!

### **4. Koppel je domein**
- Deploy naar Railway/Vercel/Heroku
- Configureer environment variables
- Update CORS settings
- Setup PostgreSQL (production)

---

## 💡 **Tips**

✅ **Houd beide terminals open** - Backend én frontend moeten draaien
✅ **Check console logs** - Errors en events worden gelogd
✅ **Gebruik API key** - dev-api-key-123 voor alle admin endpoints
✅ **Test real-time** - Open 2 browser tabs om live updates te zien
✅ **Bekijk database** - Gebruik Prisma Studio (npx prisma studio)

---

## 🎉 **Success!**

Je hebt nu een **volledig werkende enterprise-grade e-commerce backend** met:
- ✅ Complete REST API
- ✅ Real-time WebSocket server
- ✅ Live monitoring dashboard
- ✅ 200 orders voorbeelddata
- ✅ Modern React admin panel
- ✅ Database met realistische data

**Veel plezier met je real-time backend!** 🚀⚡

---

**Made with ⚡ by Voltmover**