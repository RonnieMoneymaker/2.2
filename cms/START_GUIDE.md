# 🚀 VOLTMOVER CMS - QUICK START GUIDE

## ⚡ SYSTEEM STARTEN IN 3 STAPPEN

### **Stap 1: Backend Starten**
```bash
cd cms
PORT=2000 npm start
```
✅ API draait op: `http://localhost:2000`

### **Stap 2: Frontend Starten**
```bash
cd cms/frontend
PORT=2001 npm start
```
✅ UI draait op: `http://localhost:2001`

### **Stap 3: Open Browser**
```
http://localhost:2001
```
✅ API Key: `dev-api-key-123`

---

## 📊 WAT KAN JE DOEN?

### **12 PAGINA'S BESCHIKBAAR:**

1. **📊 Dashboard** (`/`)
   - Bekijk KPI's en statistieken
   - Exporteer data naar CSV
   - Zie omzet grafieken

2. **📦 Producten** (`/products`)
   - Voeg producten toe
   - Zoek en filter
   - Beheer voorraad

3. **📂 Categorieën** (`/categories`)
   - Maak hiërarchie
   - Parent/child relaties

4. **👥 Klanten** (`/customers`)
   - Klantendatabase
   - Contact informatie
   - Order geschiedenis

5. **🛒 Bestellingen** (`/orders`)
   - Maak orders
   - Update statussen
   - Bulk acties

6. **📈 Rapporten** (`/reports`)
   - 4 report types
   - Analytics dashboard
   - Export functionaliteit

7. **🎯 Marketing** (`/marketing`)
   - Kortingscodes
   - Promoties beheer
   - Campaign tracking

8. **📤 Bulk Import** (`/import`)
   - Upload CSV bestanden
   - Mass data import
   - Error reporting

9. **🔍 Zoeken** (`/search`)
   - Zoek overal
   - Cross-entity search
   - Quick navigation

10. **🔔 Notificaties** (`/notifications`)
    - Stock alerts
    - Order notifications
    - Customer updates

11. **📊 Activity Log** (`/activity`)
    - Audit trail
    - Action tracking
    - Filter & statistics

12. **⚙️ Instellingen** (`/settings`)
    - 10 settings secties
    - Complete configuratie

---

## 🎯 QUICK ACTIONS

### **Product Toevoegen:**
1. Ga naar "Producten"
2. Klik "Nieuw product"
3. Vul gegevens in
4. Klik "Aanmaken"

### **Bestelling Maken:**
1. Ga naar "Bestellingen"
2. Klik "Nieuwe bestelling"
3. Selecteer klant
4. Voeg producten toe
5. Klik "Aanmaken"

### **Bulk Import:**
1. Ga naar "Bulk Import"
2. Kies type
3. Download template
4. Vul data in Excel
5. Upload bestand

### **Data Exporteren:**
1. Ga naar "Dashboard"
2. Scroll naar "Data Exporteren"
3. Klik op type (Producten/Klanten/etc.)
4. CSV wordt gedownload

---

## 📊 SAMPLE DATA

Het systeem komt met voorbeelddata:
- ✅ 5 Categorieën
- ✅ 7 Producten (€19.99 - €799.00)
- ✅ 5 Klanten (complete profielen)
- ✅ 5 Bestellingen (diverse statussen)

---

## 🔑 API KEY

Standaard development key:
```
dev-api-key-123
```

Deze wordt automatisch gebruikt door de frontend.

---

## 🎨 UI FEATURES

- ⚡ Lightning branding
- 🌙 Dark sidebar theme
- 💫 Smooth animations
- 📱 Fully responsive
- 🎯 Color-coded statussen
- 🔔 Real-time alerts
- 📊 Interactive charts

---

## 🛠️ TROUBLESHOOTING

### **Backend start niet?**
```bash
cd cms
npm install
PORT=2000 npm start
```

### **Frontend start niet?**
```bash
cd cms/frontend
npm install
PORT=2001 npm start
```

### **404 errors?**
- Controleer of backend draait op poort 2000
- Check API key in frontend/src/services/api.ts

### **Geen data?**
```bash
cd cms
node scripts/seed.js
node scripts/seed-extended.js
```

---

## 🎉 KLAAR VOOR GEBRUIK!

Het Voltmover CMS is nu **volledig operationeel** met:
- ✅ 12 pagina's
- ✅ 200+ features
- ✅ Premium UI
- ✅ Real-time updates
- ✅ Complete documentation

**Open http://localhost:2001 en begin met je e-commerce management!** 🚀


