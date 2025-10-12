# 📖 CMS MET MAGIC LIVE MAP - GEBRUIKSAANWIJZING

## ✅ WAT WERKT NU:

### 🌐 **Systeem Draait:**
- Backend: http://localhost:2000 ✅
- Frontend: http://localhost:2001 ✅
- Login: admin@webshop.nl / admin123 ✅

### 📊 **Werkende Pagina's:**
- ✅ Dashboard (alle cijfers op 0 - geen fake data!)
- ✅ Klanten (lege lijst - voeg toe via UI)
- ✅ Bestellingen (lege lijst - komt van klanten)
- ✅ Producten (lege lijst - voeg toe via UI)
- ✅ Analytics (lege grafieken - wacht op data)
- ✅ Advertising (wacht op Google/Meta Ads koppeling)
- ✅ Geografische Kaart (toont klanten wanneer toegevoegd)
- ✅ **Magic Live Map** (echte klanten + orders op kaart!)
- ✅ Financiën (kosten management)
- ✅ Verzending (shipping rules)
- ✅ Instellingen (API configuratie)

### 🗺️ **Magic Live Map Locatie:**
http://localhost:2001/magic-live-map

**Wat het doet:**
- Toont klanten op Nederlandse kaart
- Live orders met animaties
- Real-time statistieken
- Customer heatmap (VIP/Active/New)
- Update elke 30 seconden

---

## 🚀 AAN DE SLAG:

### **Stap 1: Voeg Een Product Toe**
1. Menu → Producten
2. Klik "+ Nieuw Product"
3. Vul in:
   - Naam: "Test Product"
   - SKU: "TEST-001"
   - Verkoopprijs: 99.99
   - Inkoopprijs: 50.00
   - Voorraad: 100
4. Klik "Opslaan"
5. ✅ Product zichtbaar!

### **Stap 2: Voeg Een Klant Toe**
1. Menu → Klanten
2. Klik "+ Nieuwe Klant"
3. Vul in:
   - Email: test@email.com
   - Naam: Test Klant
   - Stad: Amsterdam
   - Postcode: 1000 AB
4. Klik "Opslaan"
5. ✅ Klant zichtbaar!
6. **Magic Live Map** → Klant verschijnt op kaart!

### **Stap 3: Maak Een Bestelling**
1. Menu → Bestellingen
2. Klik "+ Nieuwe Bestelling"
3. Selecteer klant + product
4. Vul bedrag in
5. Klik "Opslaan"
6. ✅ Dashboard cijfers updaten!
7. **Magic Live Map** → Order verschijnt!

---

## 🔌 API'S KOPPELEN (OPTIONEEL):

### **Google Ads (Voor Live Advertising Data):**

**Benodigdheden:**
- Developer Token (https://ads.google.com/aw/apicenter)
- Customer ID (in Google Ads dashboard)

**Koppelen:**
1. Maak bestand: `bende/.env`
2. Voeg toe:
```env
PORT=2000
GOOGLE_ADS_DEVELOPER_TOKEN=jouw_token_hier
GOOGLE_ADS_CUSTOMER_ID=123-456-7890
```
3. **Herstart backend**
4. Console toont: "✅ Google Ads API client geïnitialiseerd - LIVE DATA ACTIEF!"
5. Advertising pagina → Echte campaigns!

### **Meta/Facebook Ads:**

```env
META_ACCESS_TOKEN=jouw_access_token
META_AD_ACCOUNT_ID=act_1234567890
```

Herstart backend → Live Meta Ads data!

### **Email (Gmail):**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jouw@gmail.com
SMTP_PASS=jouw_app_password
```

Herstart backend → Emails werken!

---

## 📊 WAT TE VERWACHTEN:

### **ZONDER API Koppelingen:**
- Alle cijfers op €0 of 0
- Lege lijsten
- "Geen data" messages
- **Dit is NORMAAL en CORRECT!**
- Geen fake data meer!

### **MET Data Toegevoegd:**
- Dashboard: Klanten, orders, omzet LIVE
- Magic Live Map: Klanten op kaart
- Geografische kaart: Heatmap van klanten
- Grafieken: Echte trend data

### **MET API's Gekoppeld:**
- Google Ads: Live campaigns, spend, ROAS
- Meta Ads: Live Facebook/Instagram data  
- Email: Verstuur naar klanten
- Alles ECHT, niets fake!

---

## 🎯 MAGIC LIVE MAP - HOOGTEPUNT!

### **Waar:**
http://localhost:2001/magic-live-map

**Of:** Menu → Geografische Kaart

### **Wat Je Ziet:**
- 🗺️ Kaart van Nederland
- 📍 Klanten op hun locatie
- 🔴 Live orders met animaties
- 📊 Real-time statistieken
- 💰 Omzet en winst live

### **Hoe Het Werkt:**
1. Voeg klanten toe (met stad!)
2. Maak bestellingen
3. Open Magic Live Map
4. Zie alles LIVE op kaart!
5. Auto-update elke 30 sec

---

## 🔧 PROBLEMEN OPLOSSEN:

### **"Geen data zichtbaar"**
✅ CORRECT! Systeem is schoon. Voeg data toe via UI.

### **"API Status 404"**  
⚠️ Normale foutmelding - API Status Indicator is optioneel
Kan genegeerd worden

### **"Instellingen pagina laadt niet"**
1. Check of backend draait: http://localhost:2000/api/test
2. Herstart backend
3. Hard refresh browser: Ctrl+Shift+R

### **"Webshop dropdown leeg"**
Normaal - geen webshops in database
Via API kan je er toevoegen (optioneel)

---

## 📝 COMPLETE CHECKLIST:

### **Basis Werking:**
- [x] Backend draait (poort 2000)
- [x] Frontend draait (poort 2001)
- [x] Login werkt
- [x] Dashboard laadt
- [x] Alle cijfers op 0 (geen fake data!)
- [x] Instellingen button werkt
- [x] Magic Live Map bereikbaar

### **Data Toevoegen:**
- [ ] Product toegevoegd
- [ ] Klant toegevoegd (met stad!)
- [ ] Bestelling gemaakt
- [ ] Dashboard toont data
- [ ] Magic Live Map toont klant

### **API Koppeling (Optioneel):**
- [ ] .env bestand aangemaakt
- [ ] Google Ads credentials ingevuld
- [ ] Backend herstart
- [ ] Console: "LIVE DATA ACTIEF!"
- [ ] Advertising pagina: campaigns zichtbaar

---

## 🎉 SAMENVATTING:

**Het CMS is nu:**
- ✅ 100% Schoon (geen fake data)
- ✅ Volledig werkend
- ✅ Klaar voor echte data
- ✅ API-ready (Google Ads, Meta Ads, Email)
- ✅ Magic Live Map operationeel

**Belangrijkste URLs:**
- CMS: http://localhost:2001
- Magic Live Map: http://localhost:2001/magic-live-map
- Instellingen: http://localhost:2001/settings

**Login:**
- admin@webshop.nl / admin123

**Begin met:** Voeg producten en klanten toe!
**Later:** Koppel API's via .env voor live advertising data

🚀 **VEEL PLEZIER MET JE SCHONE CMS!** 🚀

