# 🚀 SUPABASE SETUP GUIDE

## 📋 **STAP-VOOR-STAP INSTRUCTIES**

### **1. Supabase Project Aanmaken**

1. Ga naar [supabase.com](https://supabase.com)
2. Klik op **"Start your project"**
3. Sign in met GitHub/Google
4. Klik op **"New project"**
5. Vul in:
   - **Organization**: Kies of maak nieuwe
   - **Project name**: `webshop-crm` (of jouw naam)
   - **Database Password**: Kies sterk wachtwoord (BEWAAR DIT!)
   - **Region**: Europe (West) - voor snelheid
6. Klik **"Create new project"**
7. Wacht 2-3 minuten tot project klaar is

### **2. Database Connection String Ophalen**

1. In je Supabase dashboard, ga naar **Settings** (tandwiel icoon)
2. Klik op **Database** in de sidebar
3. Scroll naar **Connection String**
4. Kopieer de **URI** (begint met `postgresql://`)
5. Vervang `[YOUR-PASSWORD]` met je database wachtwoord

**Voorbeeld:**
```
postgresql://postgres:jouwwachtwoord@db.abcdefghijklmnop.supabase.co:5432/postgres
```

### **3. Environment Configuratie**

1. Kopieer het voorbeeld bestand:
```bash
cp env.supabase.example .env
```

2. Open `.env` en vul in:
```env
DATABASE_URL=postgresql://postgres:jouwwachtwoord@db.jouwproject.supabase.co:5432/postgres
NODE_ENV=development
JWT_SECRET=test_jwt_secret_for_supabase_testing
FROM_EMAIL=test@example.com
```

### **4. Connectie Testen**

Run het test script:
```bash
node test-supabase-connection.js
```

**Verwachte output:**
```
🚀 SUPABASE CONNECTIE TEST
================================

🔗 Connectie URL gevonden: postgresql://postgres:...
📡 Maken van connectie pool...
🔌 Testen van database connectie...
✅ Connectie succesvol!

📊 Database informatie ophalen...
✅ PostgreSQL versie: 15.1
✅ Database naam: postgres
✅ Gebruiker: postgres

🔐 Testen van permissies...
✅ CREATE TABLE permissie: OK
✅ INSERT permissie: OK
✅ SELECT permissie: OK
✅ DROP TABLE permissie: OK

🏗️  Testen van schema initialisatie...
✅ Schema initialisatie succesvol!

📝 Testen van sample data...
✅ Test klant aangemaakt (ID: 1)
✅ Test product aangemaakt
✅ Database bevat: 1 klanten, 1 producten

🎉 SUPABASE CONNECTIE TEST VOLTOOID!
✅ Database is klaar voor productie gebruik
```

---

## 🔧 **TROUBLESHOOTING**

### **❌ "DATABASE_URL niet gevonden"**
- Controleer of `.env` bestand bestaat
- Controleer of `DATABASE_URL` correct is ingevuld

### **❌ "Connection timeout"**
- Controleer internetverbinding
- Controleer of Supabase project actief is
- Probeer andere region

### **❌ "Authentication failed"**
- Controleer database wachtwoord
- Zorg dat je het juiste wachtwoord gebruikt (niet je Supabase account wachtwoord)

### **❌ "SSL connection error"**
- Dit is normaal voor Supabase, wordt automatisch opgelost

---

## 🎯 **VOLGENDE STAPPEN**

### **Na succesvolle test:**

1. **Server met Supabase starten:**
```bash
# Stop huidige server (Ctrl+C)
npm run dev
```

2. **Controleer of alles werkt:**
- Dashboard: http://localhost:3000
- Klanten: Voeg nieuwe klant toe
- Producten: Voeg nieuw product toe
- Check Supabase dashboard of data verschijnt

3. **Supabase Dashboard bekijken:**
- Ga naar **Table Editor** in Supabase
- Zie je tabellen: `customers`, `products`, `orders`, etc.
- Bekijk de data die je hebt toegevoegd

---

## 📊 **SUPABASE VOORDELEN**

- ✅ **Gratis tier**: 500MB database, 50MB file storage
- ✅ **Automatische backups**
- ✅ **Real-time subscriptions**
- ✅ **Built-in authentication**
- ✅ **REST API automatisch gegenereerd**
- ✅ **Dashboard voor data beheer**
- ✅ **Edge functions support**

---

## 💰 **KOSTEN**

- **Free tier**: $0/maand (perfect voor testing)
- **Pro tier**: $25/maand (voor productie)
- **Betaal alleen wat je gebruikt**

---

**🎉 Je bent nu klaar om je CRM systeem met Supabase te gebruiken!**
