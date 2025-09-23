# Webshop CRM Systeem

Een volledig Customer Relationship Management (CRM) systeem voor webshops, gebouwd met Node.js, Express, React en TypeScript.

## 🚀 Functies

### ✅ Klantenbeheer
- Volledig CRUD voor klanten (Create, Read, Update, Delete)
- Zoeken en filteren op naam, email en status
- Klantstatussen: Nieuw, Actief, Inactief, VIP
- Klantinteracties bijhouden (email, telefoon, chat, notities)
- Paginatie voor grote datasets

### ✅ Bestellingenbeheer
- Overzicht van alle bestellingen
- Bestelling details met orderitems
- Status tracking (pending, processing, shipped, delivered, cancelled)
- Koppeling met klantgegevens
- Automatische klantstatistiek updates

### ✅ Analytics Dashboard
- Real-time statistieken en KPI's
- Verkoopcijfers over tijd (grafieken)
- Top klanten en recente bestellingen
- Status verdeling van bestellingen
- Klant segmentatie en retentie metrics

### ✅ Moderne UI/UX
- Responsief design met Tailwind CSS
- Intuïtieve navigatie en layouts
- Interactive charts met Recharts
- Moderne icons met Lucide React
- Loading states en error handling

## 🛠️ Technische Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **SQLite** - Database (makkelijk te deployen)
- **Express Validator** - Input validatie
- **CORS, Helmet, Morgan** - Security en logging middleware

### Frontend
- **React 18** + **TypeScript** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling framework
- **Recharts** - Data visualisatie
- **Axios** - HTTP client
- **Lucide React** - Icon library

## 📦 Installatie

### Vereisten
- Node.js (versie 16 of hoger)
- npm of yarn

### Setup

1. **Clone het project**
```bash
git clone <repository-url>
cd webshop-crm
```

2. **Installeer backend dependencies**
```bash
npm install
```

3. **Installeer frontend dependencies**
```bash
cd client
npm install
cd ..
```

4. **Environment variabelen**
```bash
# Maak een .env bestand in de root directory
NODE_ENV=development
PORT=5000
JWT_SECRET=jouw_geheime_jwt_sleutel_hier_vervangen
DB_PATH=./database/crm.db
API_BASE_URL=http://localhost:5000/api
```

5. **Start de applicatie**

Voor development (start beide backend en frontend):
```bash
npm run dev
```

Of start ze apart:
```bash
# Backend (poort 5000)
npm run server

# Frontend (poort 3000)  
npm run client
```

6. **Open de applicatie**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 🗄️ Database Schema

De SQLite database wordt automatisch aangemaakt met sample data bij eerste start.

### Tabellen:
- **customers** - Klantgegevens en statistieken
- **orders** - Bestellingsinformatie
- **order_items** - Individuele producten per bestelling
- **customer_interactions** - Klantinteracties en notities

## 🔌 API Endpoints

### Klanten
- `GET /api/customers` - Alle klanten (met paginatie en zoeken)
- `GET /api/customers/:id` - Specifieke klant met orders en interacties
- `POST /api/customers` - Nieuwe klant aanmaken
- `PUT /api/customers/:id` - Klant bijwerken
- `DELETE /api/customers/:id` - Klant verwijderen
- `POST /api/customers/:id/interactions` - Interactie toevoegen

### Bestellingen
- `GET /api/orders` - Alle bestellingen (met filtering)
- `GET /api/orders/:id` - Specifieke bestelling met items
- `POST /api/orders` - Nieuwe bestelling aanmaken
- `PATCH /api/orders/:id/status` - Status bijwerken
- `GET /api/orders/stats/summary` - Bestellingstatistieken

### Analytics
- `GET /api/analytics/dashboard` - Dashboard overzicht
- `GET /api/analytics/sales-over-time` - Verkoopcijfers over tijd
- `GET /api/analytics/customers` - Klant analytics
- `GET /api/analytics/products` - Product prestaties
- `GET /api/analytics/retention` - Retentie metrics

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker (optioneel)
```dockerfile
# Dockerfile voorbeeld
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 📊 Sample Data

Het systeem wordt geleverd met sample data:
- 4 voorbeeldklanten met verschillende statussen
- 5 voorbeeldbestellingen met verschillende statussen
- Klantinteracties en notities
- Realistische Nederlandse gegevens

## 🔐 Security Features

- Input validatie met Express Validator
- Helmet.js voor security headers
- CORS configuratie
- SQL injection preventie
- XSS protection via React

## 🎨 UI Components

### Layout Components
- **Sidebar** - Navigatie menu
- **Header** - Zoekbalk en gebruikersprofiel
- **Layout** - Main wrapper component

### Dashboard Components
- **StatsCard** - KPI weergave kaarten
- **Charts** - Verschillende grafiek types
- **Tables** - Data tabellen met paginatie

## 📈 Toekomstige Uitbreidingen

- [ ] Gebruikersbeheer en authenticatie
- [ ] Email integratie voor klantcommunicatie
- [ ] Product catalogus management
- [ ] Rapportage en export functionaliteit
- [ ] Notificaties en alerts
- [ ] Multi-tenant support
- [ ] API rate limiting
- [ ] Backup en restore functionaliteit

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/nieuwe-functie`)
3. Commit je wijzigingen (`git commit -am 'Voeg nieuwe functie toe'`)
4. Push naar de branch (`git push origin feature/nieuwe-functie`)
5. Maak een Pull Request

## 📝 License

Dit project is gelicenseerd onder de MIT License - zie het LICENSE bestand voor details.

## 📞 Support

Voor vragen of support, maak een issue aan in de GitHub repository.

---

**Webshop CRM** - Een moderne oplossing voor klantenbeheer en analytics 🎯
