# 🎯 GOOGLE ADS KOPPELEN - SIMPELE GIDS

## ✅ DIRECT WERKENDE METHODE

### **Stap 1: Verkrijg Google Ads Credentials**

1. Ga naar: https://ads.google.com
2. Login met je Google Ads account
3. Klik rechtsboven op **Tools & Settings** (🔧)
4. Onder "Setup": Klik **API Center**
5. Noteer je **Customer ID** (formaat: 123-456-7890)

### **Stap 2: Maak Developer Token**

1. Nog steeds in API Center
2. Klik **"Apply for Basic Access"** of **"Managed Access"**
3. Vul formulier in (waarom je API nodig hebt)
4. Wacht op goedkeuring (vaak binnen 24u)
5. Noteer je **Developer Token**

### **Stap 3: Maak OAuth Credentials**

1. Ga naar: https://console.cloud.google.com
2. Selecteer project of maak nieuwe: **"New Project"**
3. Naam: "CRM Google Ads"
4. Klik **Create**
5. In project:
   - Sidebar → **APIs & Services** → **Library**
   - Zoek: "Google Ads API"
   - Klik **Enable**
6. Sidebar → **Credentials**
7. Klik **"Create Credentials"** → **OAuth client ID**
8. Application type: **Web application**
9. Name: "CRM Backend"
10. **Authorized redirect URIs**: 
    ```
    http://localhost:2000/api/oauth/google/callback
    ```
11. Klik **Create**
12. Popup toont:
    - **Client ID**: xxxxx.apps.googleusercontent.com
    - **Client Secret**: xxxxx
    - Download JSON of copy beide

### **Stap 4: Verkrijg Refresh Token**

1. Ga naar: https://developers.google.com/oauthplayground
2. Klik **Settings** (⚙️ rechtsbovenaan)
3. Check **"Use your own OAuth credentials"**
4. Vul in:
   - OAuth Client ID: (van stap 3)
   - OAuth Client secret: (van stap 3)
5. Links: **Step 1**
   - Scroll naar "Google Ads API v14"
   - Select: **https://www.googleapis.com/auth/adwords**
6. Klik **"Authorize APIs"**
7. Login met Google Ads account
8. Allow access
9. Links: **Step 2**
10. Klik **"Exchange authorization code for tokens"**
11. Noteer **Refresh token**: 1//xxxxx

### **Stap 5: Vul In in CMS**

1. Open CMS: http://localhost:2001
2. Login: admin@webshop.nl / admin123
3. Klik **"Instellingen"** (onderaan menu)
4. Tab: **Google Ads**
5. Klik **"Bewerken"**
6. Vul ALLE velden in:
   ```
   Developer Token: (stap 2)
   Client ID: xxxxx.apps.googleusercontent.com (stap 3)
   Client Secret: xxxxx (stap 3)
   Refresh Token: 1//xxxxx (stap 4)
   Customer ID: 123-456-7890 (stap 1)
   ```
7. Klik **"Test Verbinding"**
8. Als GROEN vinkje: Klik **"Opslaan"**
9. ✅ **KLAAR!**

### **Stap 6: Verificatie**

**Check in Backend Terminal:**
```
⚠️ Google Ads credentials niet gevonden
↓ wordt ↓
✅ Google Ads API client geïnitialiseerd - LIVE DATA ACTIEF!
```

**Check in Dashboard:**
- Refresh browser (Ctrl+Shift+R)
- API Status Indicator: 🎯 Google Ads ✅ Live (GROEN)
- Marketing Kosten > €0 (als campaigns actief)

**Check in Advertising Pagina:**
- Ga naar: Marketing (in menu)
- Zie echte campaigns
- Echte spend, clicks, conversies

---

## 🚀 NOG SNELLER: VIA .ENV

Als je niet via CMS wilt:

1. Open bestand: `bende/.env` (maak als niet bestaat)
2. Voeg toe:
```env
GOOGLE_ADS_DEVELOPER_TOKEN=jouw_developer_token
GOOGLE_ADS_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=xxxxx
GOOGLE_ADS_REFRESH_TOKEN=1//xxxxx
GOOGLE_ADS_CUSTOMER_ID=123-456-7890
```
3. **Herstart backend**:
   - Stop backend (in terminal: Ctrl+C)
   - Start opnieuw: `cd bende; $env:PORT="2000"; node server.js`
4. ✅ **KLAAR!**

---

## ⚡ TROUBLESHOOTING

### **"Test Verbinding" geeft fout**

**Mogelijke oorzaken:**
1. Developer Token niet goedgekeurd → Wacht op goedkeuring
2. Customer ID verkeerd formaat → Moet zijn: 123-456-7890 (met streepjes!)
3. Refresh token verlopen → Genereer nieuwe via OAuth Playground
4. Scopes verkeerd → Moet zijn: https://www.googleapis.com/auth/adwords

**Oplossing:**
- Test credentials EERST in Google Ads zelf
- Verify Customer ID in Google Ads UI
- Regenerate refresh token via OAuth Playground

### **"Live data niet zichtbaar"**

1. Hard refresh browser: Ctrl+Shift+R
2. Check backend console: zie je "✅ LIVE DATA ACTIEF!"?
3. Check /api/settings/status: 
   ```bash
   curl http://localhost:2000/api/settings/status
   ```
4. Als `"connected": false` → credentials zijn niet correct

### **"Permission denied" error**

- Google Ads account moet MANAGER account zijn
- Of: Customer ID moet toegang hebben tot API
- Check in Google Ads → Admin → Access and security

---

## 📚 BELANGRIJKE LINKS

- **Google Ads**: https://ads.google.com
- **Cloud Console**: https://console.cloud.google.com
- **OAuth Playground**: https://developers.google.com/oauthplayground
- **API Center**: https://ads.google.com/aw/apicenter
- **API Docs**: https://developers.google.com/google-ads/api

---

## ✅ CHECKLIST

- [ ] Google Ads account bestaat
- [ ] Developer Token aangevraagd (24u wacht mogelijk)
- [ ] Cloud project aangemaakt
- [ ] Google Ads API enabled
- [ ] OAuth credentials aangemaakt
- [ ] Redirect URI toegevoegd: http://localhost:2000/api/oauth/google/callback
- [ ] Refresh token verkregen via OAuth Playground
- [ ] Alle 5 credentials ingevuld in CMS
- [ ] Test Verbinding: ✅ GROEN
- [ ] Opgeslagen in CMS
- [ ] Backend console: "✅ LIVE DATA ACTIEF!"
- [ ] Dashboard: API Status ✅ Groen
- [ ] Advertising pagina: Echte campaigns zichtbaar

---

## 🎉 RESULTAAT

**Na koppeling zie je:**

| Locatie | Voor | Na |
|---------|------|-----|
| **Backend Console** | ⚠️ Niet gevonden | ✅ LIVE DATA ACTIEF! |
| **Dashboard - API Status** | ❌ Uit | ✅ Live (groen) |
| **Dashboard - Marketing** | €0 | €XXX (echt!) |
| **Advertising Pagina** | Leeg | Echte campaigns! |
| **ROAS** | 0.0x | X.Xx (echt!) |

**Alle Google Ads data wordt nu LIVE gesynchroniseerd!** 🚀

---

**Tijdsinvestering:**
- Eerste keer: 30-60 minuten (incl. Developer Token goedkeuring)
- Daarna: 5 minuten voor nieuwe accounts

**Moeilijkheid:** ⭐⭐⭐ (3/5) - Volg deze stappen precies!

**Support:** Zie `API_KOPPELING_HANDLEIDING.md` voor meer details

