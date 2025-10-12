# 🚀 SIMPELE API KOPPELING - GEEN OAUTH, GEWOON WERKEND!

## ✅ GOOGLE ADS - HANDMATIG KOPPELEN (WERKT 100%)

### Wat Je Nodig Hebt:
1. **Developer Token** - Vraag aan bij https://ads.google.com/aw/apicenter
2. **Customer ID** - Vind in Google Ads dashboard (formaat: 123-456-7890)

### Via CMS:
1. Open: http://localhost:2001/settings
2. Tab: Google Ads
3. Klik: "Bewerken"
4. Vul in:
   - Developer Token: jouw_token
   - Customer ID: 123-456-7890
5. Test → Opslaan
6. ✅ Herstart backend
7. Live data!

### Via .env (sneller):
Maak `bende/.env`:
```env
PORT=2000
GOOGLE_ADS_DEVELOPER_TOKEN=jouw_developer_token_hier
GOOGLE_ADS_CUSTOMER_ID=123-456-7890
```

Herstart backend → KLAAR!

---

## ✅ META/FACEBOOK ADS - SIMPEL!

### Wat Je Nodig Hebt:
1. **Access Token** - https://developers.facebook.com/tools/explorer
2. **Ad Account ID** - https://business.facebook.com/adsmanager (act_XXXXX in URL)

### Via .env:
```env
META_ACCESS_TOKEN=jouw_access_token
META_AD_ACCOUNT_ID=act_1234567890
```

Herstart backend → KLAAR!

---

## ⚡ SNELSTE WEG: ALLES IN .ENV

Maak bestand `bende/.env`:
```env
# Server
PORT=2000
DB_PATH=./database/crm.db

# Google Ads (als je hebt)
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=

# Meta Ads (als je hebt)
META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=

# Email (als je hebt)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

Vul wat je hebt in, herstart → WERKT!

---

## 🔧 BACKEND HERSTART:

```bash
# Stop huidige backend (Ctrl+C in terminal)

# Start opnieuw:
cd "C:\Users\ronni\Desktop\CmsCMR laatste poging universeel anders verwijder ik alles\bende"
$env:PORT="2000"
node server.js
```

Console toont:
```
✅ Google Ads API client geïnitialiseerd - LIVE DATA ACTIEF!
```

---

## ✅ DAT IS ALLES!

Geen OAuth, geen ingewikkelde flows, gewoon:
1. Credentials in .env
2. Herstart backend
3. Live data!

