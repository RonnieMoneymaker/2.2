# 🔐 Complete Login System - Gebruikershandleiding

## 📋 Overzicht
Het CRM systeem heeft nu **twee aparte login portalen**:

### 🔧 **Admin/Staff Portal**
- **URL**: `http://localhost:3000/login` (of gewoon `http://localhost:3000`)
- **Voor**: Admin, Manager, Staff
- **Toegang tot**: Volledige CRM functionaliteiten, customer management, analytics, etc.

### 👥 **Customer Portal** 
- **URL**: `http://localhost:3000/customer-login`
- **Voor**: Klanten van de webshop
- **Toegang tot**: Eigen orders, profiel, order geschiedenis, tracking info

## 🎯 Demo Accounts

### 🔧 **Admin Accounts**:
```
Email: admin@webshop.nl
Wachtwoord: admin123
Rol: Administrator (volledige toegang)

Email: manager@webshop.nl  
Wachtwoord: admin123
Rol: Manager (beperkte toegang)
```

### 👤 **Customer Accounts**:
```
Email: piet.bakker@email.com
Wachtwoord: customer123
Status: VIP Customer

Email: jan.de.vries@email.com
Wachtwoord: customer123
Status: Active Customer

Email: maria.jansen@email.com
Wachtwoord: customer123
Status: Active Customer

Email: anna.smit@email.com
Wachtwoord: customer123
Status: New Customer
```

## 🚀 **Hoe Klanten een Account Krijgen**

### **Methode 1: Zelf Registreren**
1. Ga naar `http://localhost:3000/customer-login`
2. Klik "Nog geen account? Registreer hier"
3. Vul registratie formulier in:
   - Voornaam & Achternaam
   - Email adres
   - Wachtwoord (min. 6 karakters)
   - Optioneel: Telefoon, Adres
4. Account wordt aangemaakt
5. **Email verificatie** wordt verzonden
6. Klant klikt verificatie link
7. Account is actief → kan inloggen

### **Methode 2: Admin Maakt Account**
1. Admin logt in via admin portal
2. Ga naar "Klanten" pagina
3. Klik "Nieuwe Klant"
4. Vul klant gegevens in
5. **Optioneel**: Voeg wachtwoord toe
6. Klant ontvangt welcome email met login instructies

### **Methode 3: Automatisch bij Bestelling**
1. Klant plaatst bestelling op webshop
2. Systeem maakt automatisch account aan
3. Klant ontvangt email met:
   - Order bevestiging
   - Account details
   - Login instructies

## 🔒 **Security Features**

### **Password Security**
- ✅ Bcrypt hashing (10 rounds)
- ✅ Minimum 6 karakters
- ✅ Show/hide password toggle

### **Email Verification**
- ✅ JWT verification tokens
- ✅ 24 uur geldig
- ✅ Automatic account activation
- ✅ Resend verification option

### **Password Reset**
- ✅ Secure reset tokens (1 uur geldig)
- ✅ Email reset links
- ✅ Token validation
- ✅ No email enumeration

### **Role-based Access**
- ✅ Admin: Volledige CRM toegang
- ✅ Customer: Alleen eigen data
- ✅ JWT tokens per role
- ✅ Middleware protection

## 🖥️ **Customer Portal Features**

### **📊 Overzicht Tab**
- Totaal bestellingen
- Totaal besteed
- Gemiddelde bestelling waarde
- Klant sinds X dagen
- Uitgaven per maand chart
- Favoriete producten

### **📦 Mijn Bestellingen Tab**
- Complete order geschiedenis
- Order status tracking
- Track & Trace links
- Order details modal
- Item overzicht per order

### **👤 Profiel Tab**
- Persoonlijke gegevens
- Contact informatie
- Adres gegevens
- Account statistieken
- Edit profiel (toekomstige feature)

## 🔗 **API Endpoints**

### **Customer Authentication**
```
POST /api/customer-auth/register     - Registreer nieuwe klant
POST /api/customer-auth/login        - Customer login
GET  /api/customer-auth/verify/:token - Email verificatie
POST /api/customer-auth/resend-verification - Verificatie opnieuw verzenden
POST /api/customer-auth/forgot-password - Wachtwoord vergeten
POST /api/customer-auth/reset-password/:token - Wachtwoord reset
```

### **Customer Portal**
```
GET  /api/customer-portal/profile    - Klant profiel
PUT  /api/customer-portal/profile    - Update profiel
GET  /api/customer-portal/orders     - Klant orders
GET  /api/customer-portal/orders/:id - Specifieke order
GET  /api/customer-portal/analytics  - Klant analytics
```

## 📧 **Email Notifications**

### **Automatic Emails**
- ✅ **Welcome email** bij registratie
- ✅ **Email verificatie** met activation link
- ✅ **Password reset** emails
- ✅ **Order confirmations**
- ✅ **Shipping notifications** met tracking
- ✅ **Order status updates**

### **Email Templates**
- Responsive HTML templates
- Professional styling
- Branded design
- Clear call-to-action buttons

## 🧪 **Testing**

### **Playwright Tests**
```bash
npx playwright test tests/customer-login.spec.js --headed
```

### **Manual Testing**
1. **Admin Login**: http://localhost:3000
2. **Customer Login**: http://localhost:3000/customer-login
3. **Test Registration**: Maak nieuw customer account
4. **Test Portal**: Login als customer en bekijk orders
5. **Test Security**: Probeer admin functies als customer (moet falen)

## 🎉 **Resultaat**

**VOLLEDIG WERKEND DUAL LOGIN SYSTEEM!**

✅ **Admins** kunnen het CRM systeem beheren
✅ **Klanten** kunnen hun eigen orders bekijken
✅ **Security** is goed gescheiden
✅ **Registration** flow werkt
✅ **Email verification** geïmplementeerd
✅ **Password reset** functionaliteit
✅ **Role-based access control**

**Beide portals werken perfect naast elkaar!** 🚀
