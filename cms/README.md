## CMS API (Headless, multi-tenant)

- Auth via header `x-api-key: <websiteApiKey>`
- Core resources: `Websites`, `Categories`, `Products`, `Customers`, `Orders`

### Quick start
1) Configure `.env`:
```
DATABASE_URL="file:./dev.db"
PORT=5050
```
2) Migrate DB:
```
npx prisma migrate dev --name init
```
3) Seed a website with API key:
```
node scripts/seed.js
```
4) Run dev:
```
npm run dev
```

### Endpoints
- GET /health
- GET/POST/PUT/DELETE /api/categories
- GET/POST/PUT/DELETE /api/products



