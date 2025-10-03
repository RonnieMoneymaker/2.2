# VoltMover CRM v2.1.0

Een moderne, volledig uitgeruste Customer Relationship Management (CRM) applicatie gebouwd met FastAPI en React.

## 🚀 Features

### ✅ Volledig Geïmplementeerd
- **👥 Contact Management** - Volledige klantenbeheer met zoeken en filtering
- **💼 Deal Pipeline** - Deal tracking met verschillende stages en waardes
- **📋 Task Management** - Taakbeheer met prioriteiten en deadlines
- **📊 Dashboard** - Real-time statistieken en overzichten
- **🔐 Authenticatie** - Veilige login met JWT tokens
- **👤 Gebruikersbeheer** - Multi-user support met rollen
- **⚙️ Instellingen** - Profiel en wachtwoord beheer
- **📱 Responsive Design** - Werkt perfect op desktop en mobile

### 🎯 Geplande Features
- **📧 Email Integratie** - Email tracking en communicatie
- **📅 Kalender Integratie** - Afspraken en meetings
- **📈 Geavanceerde Rapportage** - Uitgebreide analytics
- **🔔 Notificaties** - Real-time updates
- **📤 Import/Export** - Data import en export functionaliteit

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Moderne Python web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL/SQLite** - Database opties
- **JWT** - Authenticatie
- **Pydantic** - Data validatie

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe JavaScript
- **Material-UI** - Professional UI components
- **React Query** - Data fetching en caching
- **React Hook Form** - Form management
- **React Router** - Navigation

## 🚀 Quick Start

### Vereisten
- Python 3.8+
- Node.js 16+
- npm of yarn

### Backend Starten
```bash
# Windows
python start_backend.py

# Linux/Mac
python3 start_backend.py
```

### Frontend Starten
```bash
# Windows
start_frontend.bat

# Linux/Mac
chmod +x start_frontend.sh
./start_frontend.sh
```

### Handmatige Setup

#### Backend Setup
```bash
# Installeer dependencies
pip install -r requirements.txt

# Kopieer environment file
cp env.example .env

# Start de server
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
# Installeer dependencies
npm install

# Start development server
npm start
```

## 🔑 Default Login

Na het starten van de backend wordt automatisch een admin account aangemaakt:

- **Username:** `admin`
- **Password:** `admin123`

⚠️ **Belangrijk:** Wijzig dit wachtwoord direct na de eerste login!

## 📚 API Documentatie

Na het starten van de backend is de API documentatie beschikbaar op:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🗄️ Database

### Development
Standaard gebruikt de applicatie SQLite voor development. De database wordt automatisch aangemaakt in `backend/voltmover_crm.db`.

### Production
Voor productie wordt PostgreSQL aanbevolen. Update de `DATABASE_URL` in je `.env` file:
```
DATABASE_URL=postgresql://username:password@localhost:5432/voltmover_crm
```

## 🔧 Configuratie

Alle configuratie gebeurt via environment variables in het `.env` bestand:

```env
# Database
DATABASE_URL=sqlite:///./voltmover_crm.db

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
DEBUG=True
CORS_ORIGINS=["http://localhost:2000"]
```

## 📱 Screenshots

### Dashboard
![Dashboard](docs/dashboard.png)

### Contact Management
![Contacts](docs/contacts.png)

### Deal Pipeline
![Deals](docs/deals.png)

### Task Management
![Tasks](docs/tasks.png)

## 🏗️ Project Structure

```
voltmover-crm/
├── backend/                 # FastAPI backend
│   ├── main.py             # Application entry point
│   ├── database.py         # Database configuration
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   ├── auth.py             # Authentication utilities
│   └── routers/            # API route handlers
│       ├── auth.py
│       ├── contacts.py
│       ├── deals.py
│       ├── tasks.py
│       ├── users.py
│       └── dashboard.py
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── contexts/           # React contexts
│   ├── pages/              # Page components
│   ├── App.tsx             # Main app component
│   └── index.tsx           # Entry point
├── public/                 # Static files
├── requirements.txt        # Python dependencies
├── package.json           # Node.js dependencies
└── README.md              # This file
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
npm test
```

## 🚢 Deployment

### Docker (Aanbevolen)
```bash
# Build en start containers
docker-compose up -d
```

### Manual Deployment
1. Setup PostgreSQL database
2. Update environment variables
3. Install dependencies
4. Build frontend: `npm run build`
5. Start backend: `uvicorn main:app --host 0.0.0.0 --port 8000`
6. Serve frontend build files

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je changes (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 License

Dit project is gelicenseerd onder de MIT License - zie het [LICENSE](LICENSE) bestand voor details.

## 🆘 Support

Voor vragen of problemen:
- Open een [GitHub Issue](https://github.com/voltmover/crm/issues)
- Email: support@voltmover.com

## 🎉 Changelog

### v2.1.0 (Huidig)
- ✅ Complete CRM functionaliteit
- ✅ Modern React frontend
- ✅ FastAPI backend
- ✅ Authenticatie systeem
- ✅ Contact, Deal en Task management
- ✅ Dashboard met statistieken
- ✅ Responsive design

### Geplande Updates
- 📧 Email integratie
- 📅 Kalender functionaliteit
- 📊 Geavanceerde rapportage
- 🔔 Push notificaties
- 📱 Mobile app

---

**VoltMover CRM** - Moderne klantenbeheer voor moderne bedrijven 🚀
