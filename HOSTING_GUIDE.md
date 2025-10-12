# 🚀 CRM Hosting Guide - Production Deployment

## 🎯 **Hosting Opties voor jouw CRM**

### 1️⃣ **🔥 VERCEL + RAILWAY (Aanbevolen - Makkelijkst)**
**Kosten**: €5-15/maand | **Setup tijd**: 15 minuten | **Skill level**: Beginner

#### **Voordelen**:
- ✅ Automatische deployments
- ✅ Gratis SSL certificaten
- ✅ CDN wereldwijd
- ✅ Eenvoudige database setup
- ✅ Monitoring ingebouwd

#### **Setup**:
```bash
# 1. Frontend op Vercel
npm run build
# Upload naar Vercel via GitHub

# 2. Backend op Railway
# Connect GitHub repo
# Railway detecteert automatisch Node.js
```

### 2️⃣ **💻 VPS (DigitalOcean/Linode)**
**Kosten**: €10-25/maand | **Setup tijd**: 1-2 uur | **Skill level**: Intermediate

#### **Voordelen**:
- ✅ Volledige controle
- ✅ Goedkoper voor high traffic
- ✅ Custom configuraties mogelijk
- ✅ Alle APIs/services mogelijk

### 3️⃣ **☁️ HEROKU (Eenvoudig maar duurder)**
**Kosten**: €25-50/maand | **Setup tijd**: 30 minuten | **Skill level**: Beginner

### 4️⃣ **🏠 EIGEN SERVER (Thuis/Kantoor)**
**Kosten**: €0 + internet | **Setup tijd**: 2-4 uur | **Skill level**: Advanced

---

## 🚀 **QUICK START: Vercel + Railway (Aanbevolen)**

### **Stap 1: Production Build Maken**
```bash
# In jouw project directory
npm run build
npm run build:client
```

### **Stap 2: Environment Variables**
```bash
# Maak .env.production
NODE_ENV=production
JWT_SECRET=jouw_super_veilige_jwt_secret_hier
DATABASE_URL=postgresql://user:pass@host:5432/crm_db

# API Keys (optioneel, werkt ook met mock data)
GOOGLE_ADS_DEVELOPER_TOKEN=your_token
META_ACCESS_TOKEN=your_token
DHL_API_KEY=your_key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### **Stap 3: Frontend op Vercel**
1. Ga naar [vercel.com](https://vercel.com)
2. Connect GitHub account
3. Import jouw project
4. Vercel detecteert React app automatisch
5. Deploy! → Je krijgt URL zoals `jouw-crm.vercel.app`

### **Stap 4: Backend op Railway**
1. Ga naar [railway.app](https://railway.app)
2. Connect GitHub repo
3. Railway detecteert Node.js automatisch
4. Add PostgreSQL database (€5/maand)
5. Set environment variables
6. Deploy! → Je krijgt API URL

### **Stap 5: Connect Frontend naar Backend**
Update `client/package.json`:
```json
{
  "proxy": "https://jouw-backend.up.railway.app"
}
```

---

## 🛠️ **Production Ready Configuratie**

### **Database Opties**:

#### **🐘 PostgreSQL (Aanbevolen)**
- Railway PostgreSQL: €5/maand
- Supabase: €25/maand (includes auth)
- AWS RDS: €15-30/maand

#### **🗄️ SQLite (Huidige setup)**
- Werkt perfect voor kleine/medium usage
- Gratis
- Backup via file copy

### **Domain & SSL**:
```bash
# 1. Koop domain (bijvoorbeeld: jouwcrm.nl)
# 2. Point naar Vercel IP
# 3. SSL is automatisch via Vercel
```

---

## 📦 **Production Scripts Maken**

### **package.json updaten**:
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "echo 'Server build complete'",
    "deploy": "npm run build && git push heroku main"
  }
}
```

### **Procfile voor Heroku**:
```
web: node server.js
```

### **Docker Setup** (optioneel):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 🔐 **Security voor Production**

### **Environment Variables**:
```bash
# Genereer sterke JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Database connection
DATABASE_URL=postgresql://user:pass@host:5432/crm_production

# CORS origins
CORS_ORIGIN=https://jouwcrm.nl,https://www.jouwcrm.nl

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **HTTPS & Security Headers**:
```javascript
// In server.js
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000'
}));
```

---

## 💰 **Kosten Overzicht**

| Hosting Optie | Maandelijks | Jaarlijks | Geschikt voor |
|---------------|-------------|-----------|---------------|
| **Vercel + Railway** | €10-15 | €120-180 | Startups, SMB |
| **DigitalOcean VPS** | €12-25 | €144-300 | Growing business |
| **Heroku** | €25-50 | €300-600 | Enterprise |
| **AWS/Azure** | €20-100+ | €240-1200+ | Large scale |
| **Eigen Server** | €0* | €0* | Tech-savvy users |

*Eigen server: Alleen internet + elektriciteit kosten

---

## 🚀 **SNELSTE OPTIE: 15 Minuten Live**

### **Railway All-in-One** (Makkelijkst):
1. Ga naar [railway.app](https://railway.app)
2. "Deploy from GitHub" → Connect je repo
3. Add PostgreSQL service
4. Set environment variables
5. Deploy → **Live binnen 15 minuten!**

### **Netlify + Supabase** (Alternative):
1. Frontend → Netlify (gratis)
2. Backend + DB → Supabase (€25/maand)
3. All-in-one solution

---

## 🌐 **Domain Setup**

### **Domain Registrars** (Nederland):
- **Transip.nl**: €8/jaar .nl domain
- **Hostnet.nl**: €10/jaar 
- **Godaddy.com**: €12/jaar

### **DNS Setup**:
```
Type: CNAME
Name: @
Value: jouw-app.vercel.app

Type: CNAME  
Name: www
Value: jouw-app.vercel.app
```

---

## 📊 **Monitoring & Analytics**

### **Gratis Monitoring**:
- **Vercel Analytics**: Ingebouwd
- **Google Analytics**: Gratis
- **Hotjar**: €39/maand (heatmaps)
- **LogRocket**: €99/maand (session replay)

### **Uptime Monitoring**:
- **UptimeRobot**: Gratis
- **Pingdom**: €10/maand

---

## 🎉 **Mijn Aanbeveling voor JOU**

### **🔥 BESTE OPTIE: Vercel + Railway**

**Waarom**:
- ✅ Super makkelijk setup
- ✅ Automatische deployments
- ✅ Schaalbaar
- ✅ Goede prijs/kwaliteit
- ✅ Monitoring ingebouwd
- ✅ Backup automatisch

**Total kosten**: €10-15/maand voor complete CRM systeem

### **Setup in 15 minuten**:
1. Push code naar GitHub
2. Connect Vercel voor frontend
3. Connect Railway voor backend + database
4. Add environment variables
5. **LIVE!** 🚀

**Wil je dat ik je help met de setup?** Ik kan de production configuratie files maken en je stap-voor-stap door het deployment proces leiden!



