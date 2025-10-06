# 🌐 WEBSITE INTEGRATIE GUIDE

## Hoe Koppel Je Je Website Aan Het CMS

Je Voltmover CMS is nu een **headless e-commerce backend**. Dat betekent dat elke website (React, Vue, WordPress, zelfs plain HTML) ermee kan werken!

---

## 🚀 QUICK START - Webshop Koppelen

### **Stap 1: API Endpoints Gebruiken**

Je CMS draait op: `http://localhost:2000`

### **PUBLIC API (GEEN AUTHENTICATIE)**

#### **Producten Ophalen**
```javascript
// Haal alle producten op
fetch('http://localhost:2000/public/products')
  .then(res => res.json())
  .then(data => {
    console.log(data.products); // Array van 50 producten
  });

// Met filters
fetch('http://localhost:2000/public/products?category=1&search=laptop&limit=12')
  .then(res => res.json())
  .then(data => {
    console.log(data.products);
    console.log(data.pagination); // Page info
  });

// Featured producten
fetch('http://localhost:2000/public/featured')
  .then(res => res.json())
  .then(data => console.log(data.products));

// Enkel product
fetch('http://localhost:2000/public/products/macbook-pro-16--0')
  .then(res => res.json())
  .then(data => console.log(data)); // Complete product met reviews
```

#### **Categorieën Ophalen**
```javascript
fetch('http://localhost:2000/public/categories')
  .then(res => res.json())
  .then(data => console.log(data.categories));
```

#### **Shopping Cart**
```javascript
// Genereer session ID voor deze klant
const sessionId = localStorage.getItem('sessionId') || 
  Math.random().toString(36).substring(7);
localStorage.setItem('sessionId', sessionId);

// Voeg product toe aan cart
fetch(`http://localhost:2000/cart/${sessionId}/items`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 1,
    quantity: 2
  })
})
.then(res => res.json())
.then(data => console.log(data.cart));

// Haal cart op
fetch(`http://localhost:2000/cart/${sessionId}`)
  .then(res => res.json())
  .then(data => console.log(data.cart));

// Update quantity
fetch(`http://localhost:2000/cart/${sessionId}/items/1`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ quantity: 3 })
})
.then(res => res.json());

// Verwijder item
fetch(`http://localhost:2000/cart/${sessionId}/items/1`, {
  method: 'DELETE'
})
.then(res => res.json());
```

#### **Checkout (Order Plaatsen)**
```javascript
fetch(`http://localhost:2000/cart/${sessionId}/checkout`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer: {
      email: 'klant@example.com',
      firstName: 'Jan',
      lastName: 'Jansen',
      phone: '0612345678'
    },
    shipping: {
      firstName: 'Jan',
      lastName: 'Jansen',
      address: 'Hoofdstraat 123',
      city: 'Amsterdam',
      postalCode: '1000AB',
      country: 'NL',
      phone: '0612345678'
    },
    billing: {
      firstName: 'Jan',
      lastName: 'Jansen',
      address: 'Hoofdstraat 123',
      city: 'Amsterdam',
      postalCode: '1000AB',
      country: 'NL',
      email: 'klant@example.com'
    },
    shippingMethodId: 1,
    discountCode: 'WELCOME10', // Optioneel
    paymentMethod: 'mollie'
  })
})
.then(res => res.json())
.then(data => {
  console.log('Order created:', data.order);
  // Redirect naar betaling indien nodig
  if (data.paymentUrl) {
    window.location.href = data.paymentUrl;
  }
});
```

#### **Verzendmethodes**
```javascript
fetch('http://localhost:2000/public/shipping-methods?country=NL')
  .then(res => res.json())
  .then(data => console.log(data.shippingMethods));
```

#### **Discount Code Valideren**
```javascript
fetch('http://localhost:2000/public/discount/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'WELCOME10',
    orderTotal: 10000 // in cents (€100)
  })
})
.then(res => res.json())
.then(data => {
  if (data.valid) {
    console.log('Discount:', data.discountAmount, 'cents');
  }
});
```

#### **BTW Tarief Ophalen**
```javascript
fetch('http://localhost:2000/public/tax-rate?country=NL')
  .then(res => res.json())
  .then(data => console.log(data.taxRate)); // 21.0
```

---

## 🖼️ MEDIA MANAGEMENT

### **Upload Productfoto's (via Admin Panel)**

```javascript
// Upload enkele foto
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('http://localhost:2000/api/media/upload', {
  method: 'POST',
  headers: {
    'x-api-key': 'dev-api-key-123'
  },
  body: formData
})
.then(res => res.json())
.then(data => {
  console.log('Uploaded:', data.url);
  // Gebruik: http://localhost:2000/media/filename.jpg
});

// Upload meerdere foto's
const formData = new FormData();
fileInput.files.forEach(file => {
  formData.append('images', file);
});

fetch('http://localhost:2000/api/media/upload-multiple', {
  method: 'POST',
  headers: {
    'x-api-key': 'dev-api-key-123'
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log('Uploaded:', data.files));
```

### **Toon Foto's op Website**

```html
<img src="http://localhost:2000/media/1728292847-123456.jpg" alt="Product" />
```

Alle product afbeeldingen zitten in `product.images` als JSON array:
```javascript
const images = JSON.parse(product.images);
// ["http://localhost:2000/media/file1.jpg", ...]
```

---

## 💰 VOORBEELDWEBSITE - Complete Webshop

### **HTML + JavaScript Voorbeeld**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Voltmover Shop</title>
  <style>
    .product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .product-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
    .product-card img { width: 100%; height: 200px; object-fit: cover; }
    .btn { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Voltmover Shop</h1>
  
  <!-- Cart -->
  <div id="cart">
    <h2>Winkelwagen (<span id="cart-count">0</span>)</h2>
    <div id="cart-items"></div>
    <button class="btn" onclick="checkout()">Bestellen</button>
  </div>
  
  <!-- Products -->
  <div id="products" class="product-grid"></div>

  <script>
    const API = 'http://localhost:2000';
    const sessionId = localStorage.getItem('sessionId') || Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);

    // Laad producten
    fetch(`${API}/public/products`)
      .then(res => res.json())
      .then(data => {
        const html = data.products.map(p => `
          <div class="product-card">
            <img src="${JSON.parse(p.images)[0]}" alt="${p.name}" />
            <h3>${p.name}</h3>
            <p>€${(p.priceCents / 100).toFixed(2)}</p>
            <p>Voorraad: ${p.stockQuantity}</p>
            <button class="btn" onclick="addToCart(${p.id})">
              Voeg toe
            </button>
          </div>
        `).join('');
        document.getElementById('products').innerHTML = html;
      });

    // Voeg toe aan cart
    function addToCart(productId) {
      fetch(`${API}/cart/${sessionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      })
      .then(res => res.json())
      .then(data => {
        alert('Product toegevoegd!');
        loadCart();
      });
    }

    // Laad cart
    function loadCart() {
      fetch(`${API}/cart/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          document.getElementById('cart-count').textContent = 
            data.cart.totals?.itemCount || 0;
        });
    }

    // Checkout
    function checkout() {
      fetch(`${API}/cart/${sessionId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            email: prompt('Email:'),
            firstName: prompt('Voornaam:'),
            lastName: prompt('Achternaam:'),
            phone: prompt('Telefoon:')
          },
          shipping: {
            firstName: 'Jan',
            lastName: 'Jansen',
            address: 'Hoofdstraat 1',
            city: 'Amsterdam',
            postalCode: '1000AB',
            country: 'NL',
            phone: '0612345678'
          },
          billing: {
            firstName: 'Jan',
            lastName: 'Jansen',
            address: 'Hoofdstraat 1',
            city: 'Amsterdam',
            postalCode: '1000AB',
            country: 'NL',
            email: 'test@example.com'
          },
          shippingMethodId: 1
        })
      })
      .then(res => res.json())
      .then(data => {
        alert(`Order ${data.order.orderNumber} aangemaakt! Totaal: €${(data.order.totalCents/100).toFixed(2)}`);
      });
    }

    loadCart();
  </script>
</body>
</html>
```

---

## 📦 REACT WEBSITE VOORBEELD

### **Install Axios**
```bash
npm install axios
```

### **API Service**
```javascript
// src/services/shop.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:2000'
});

export const shopApi = {
  // Products
  getProducts: (params) => API.get('/public/products', { params }),
  getProduct: (slug) => API.get(`/public/products/${slug}`),
  getFeatured: () => API.get('/public/featured'),
  
  // Categories
  getCategories: () => API.get('/public/categories'),
  
  // Cart
  getCart: (sessionId) => API.get(`/cart/${sessionId}`),
  addToCart: (sessionId, data) => API.post(`/cart/${sessionId}/items`, data),
  updateCart: (sessionId, productId, quantity) => 
    API.put(`/cart/${sessionId}/items/${productId}`, { quantity }),
  removeFromCart: (sessionId, productId) => 
    API.delete(`/cart/${sessionId}/items/${productId}`),
  checkout: (sessionId, data) => API.post(`/cart/${sessionId}/checkout`, data),
  
  // Shipping & Discounts
  getShippingMethods: (country) => 
    API.get('/public/shipping-methods', { params: { country } }),
  validateDiscount: (code, orderTotal) => 
    API.post('/public/discount/validate', { code, orderTotal }),
  getTaxRate: (country) => API.get('/public/tax-rate', { params: { country } })
};
```

### **Product Listing Component**
```javascript
// src/pages/Shop.jsx
import { useState, useEffect } from 'react';
import { shopApi } from '../services/shop';

function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shopApi.getProducts({ limit: 12, featured: true })
      .then(res => {
        setProducts(res.data.products);
        setLoading(false);
      });
  }, []);

  const addToCart = (productId) => {
    const sessionId = localStorage.getItem('sessionId') || 
      Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
    
    shopApi.addToCart(sessionId, { productId, quantity: 1 })
      .then(() => alert('Product toegevoegd!'));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="product-grid">
      {products.map(product => (
        <div key={product.id} className="product-card">
          <img src={JSON.parse(product.images)[0]} alt={product.name} />
          <h3>{product.name}</h3>
          <p>€{(product.priceCents / 100).toFixed(2)}</p>
          <p>⭐ {product.averageRating} ({product.reviewCount} reviews)</p>
          {product.stockQuantity > 0 ? (
            <button onClick={() => addToCart(product.id)}>
              Voeg toe aan winkelwagen
            </button>
          ) : (
            <button disabled>Uitverkocht</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔑 BESCHIKBARE DISCOUNT CODES

Test deze codes op je website:

```
WELCOME10  → 10% korting boven €50
SUMMER25   → 25% korting boven €100
FREESHIP   → Gratis verzending boven €25
SAVE50     → €50 korting boven €200
```

---

## 📊 ADMIN PANEL FEATURES

### **Financial Dashboard** (`/financial`)
Je ziet nu IN ÉÉN OOGOPSLAG:

✅ **Bruto Winst** - €XX,XXX (met winstmarge %)
✅ **Omzet** - Totale verkopen
✅ **Kosten** - Inkoopkosten producten
✅ **Gemiddelde Bestelling** - Per order waarde & winst

**Plus:**
- Top 10 meest winstgevende producten
- Prestaties per categorie
- Lage voorraad waarschuwingen
- Revenue/profit grafieken (30 dagen)

**Filters:**
- Vandaag
- Deze week
- Deze maand
- Dit jaar
- Altijd

### **Endpoints voor Rapportages**

```javascript
// Financieel overzicht
GET /api/financial/overview?period=month
Headers: x-api-key: dev-api-key-123

Response:
{
  "period": "month",
  "orderCount": 50,
  "revenue": {
    "totalCents": 100000,    // €1,000 omzet
    "taxCents": 21000,       // €210 BTW
    "shippingCents": 2975,   // €29.75 verzending
    "discountCents": 5000    // €50 korting
  },
  "costs": {
    "productCostCents": 60000 // €600 inkoop
  },
  "profit": {
    "grossProfitCents": 40000,     // €400 bruto winst
    "netProfitCents": 35000,       // €350 netto winst
    "marginPercentage": 40.0       // 40% winstmarge
  },
  "averages": {
    "orderValueCents": 2000,       // €20 gem. order
    "profitPerOrderCents": 800     // €8 winst per order
  }
}
```

```javascript
// Top winstgevende producten
GET /api/financial/profit-by-product?limit=10&sort=profit_desc

// Omzet over tijd
GET /api/financial/revenue-over-time?days=30

// Winst over tijd
GET /api/financial/profit-over-time?days=30

// Categorie performance
GET /api/financial/category-performance

// Lage voorraad
GET /api/financial/low-stock
```

---

## 🎯 COMPLETE API OVERZICHT

### **PUBLIC (Website - Geen Auth)**
```
GET  /public/products                → Alle producten
GET  /public/products/:slug          → Enkel product
GET  /public/featured                → Featured products
GET  /public/categories              → Alle categorieën
GET  /public/shipping-methods        → Verzendmethodes
POST /public/discount/validate       → Check kortingscode
GET  /public/tax-rate                → BTW tarief

GET    /cart/:sessionId              → Haal winkelwagen op
POST   /cart/:sessionId/items        → Voeg product toe
PUT    /cart/:sessionId/items/:id    → Update quantity
DELETE /cart/:sessionId/items/:id    → Verwijder product
POST   /cart/:sessionId/checkout     → Plaats bestelling

GET  /media/:filename                → Haal afbeelding op
```

### **ADMIN (CMS Panel - Requires API Key)**
```
🔑 Header: x-api-key: dev-api-key-123

Products:     /api/products
Categories:   /api/categories
Customers:    /api/customers
Orders:       /api/orders
Financial:    /api/financial/*
Analytics:    /api/analytics/*
Integrations: /api/integrations/*
Media:        /api/media/*
Chat:         /api/chat/*
Email:        /api/email-marketing/*
```

---

## 💡 PRAKTISCHE VOORBEELDEN

### **Use Case 1: Product Pagina Bouwen**
```javascript
// Haal product op
const product = await shopApi.getProduct('macbook-pro-16--0');

// Toon op website
<div>
  <h1>{product.name}</h1>
  <p>{product.description}</p>
  <p>€{(product.priceCents / 100).toFixed(2)}</p>
  
  {product.comparePriceCents && (
    <p className="line-through">
      Was: €{(product.comparePriceCents / 100).toFixed(2)}
    </p>
  )}
  
  <p>Op voorraad: {product.stockQuantity}</p>
  <p>⭐ {product.averageRating} ({product.reviewCount} reviews)</p>
  
  {/* Afbeeldingen */}
  {JSON.parse(product.images).map(img => (
    <img key={img} src={img} alt={product.name} />
  ))}
  
  {/* Varianten */}
  {product.variants.map(v => (
    <button key={v.id}>{v.name} - €{(v.priceCents/100).toFixed(2)}</button>
  ))}
  
  {/* Attributes */}
  {product.attributes.map(attr => (
    <p key={attr.id}>{attr.name}: {attr.value}</p>
  ))}
  
  {/* Reviews */}
  {product.reviews.map(review => (
    <div key={review.id}>
      <p>⭐ {review.rating}/5 {review.isVerifiedPurchase && '✓ Geverifieerde aankoop'}</p>
      <p>{review.title}</p>
      <p>{review.comment}</p>
      <p>- {review.customer.firstName} {review.customer.lastName}</p>
    </div>
  ))}
</div>
```

### **Use Case 2: Checkout Flow**
```javascript
// 1. Klant voegt producten toe
await shopApi.addToCart(sessionId, { productId: 1, quantity: 2 });

// 2. Haal verzendmethodes op
const shipping = await shopApi.getShippingMethods('NL');

// 3. Valideer discount code
const discount = await shopApi.validateDiscount('WELCOME10', 10000);

// 4. Plaats order
const order = await shopApi.checkout(sessionId, {
  customer: { ... },
  shipping: { ... },
  billing: { ... },
  shippingMethodId: 1,
  discountCode: 'WELCOME10'
});

// 5. Redirect naar betaling (Mollie/Stripe)
window.location.href = order.paymentUrl;
```

---

## 🎨 WORDPRESS INTEGRATIE

Als je WordPress gebruikt, maak dan een custom plugin:

```php
<?php
// voltmover-shop/voltmover-api.php

class VoltmoverAPI {
  private $api_base = 'http://localhost:2000';
  
  public function get_products($args = []) {
    $url = $this->api_base . '/public/products';
    if ($args) {
      $url .= '?' . http_build_query($args);
    }
    
    $response = wp_remote_get($url);
    return json_decode(wp_remote_retrieve_body($response), true);
  }
  
  public function add_to_cart($session_id, $product_id, $quantity = 1) {
    $url = $this->api_base . "/cart/{$session_id}/items";
    
    $response = wp_remote_post($url, [
      'headers' => ['Content-Type' => 'application/json'],
      'body' => json_encode([
        'productId' => $product_id,
        'quantity' => $quantity
      ])
    ]);
    
    return json_decode(wp_remote_retrieve_body($response), true);
  }
}

// Gebruik in templates
$api = new VoltmoverAPI();
$products = $api->get_products(['limit' => 12]);

foreach ($products['products'] as $product) {
  echo '<h3>' . $product['name'] . '</h3>';
  echo '<p>€' . ($product['priceCents'] / 100) . '</p>';
}
```

---

## 🔒 PRODUCTIE DEPLOYMENT

### **Voor productie moet je:**

1. **CORS Configureren**
```javascript
// cms/src/server.js
app.use(cors({
  origin: ['https://jouwwebsite.nl', 'https://www.jouwwebsite.nl'],
  credentials: true
}));
```

2. **Database URL Updaten**
```bash
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db"
# Of behoud SQLite
DATABASE_URL="file:./prisma/prod.db"
```

3. **Media Storage**
- Lokaal: `cms/uploads/` (huidige setup)
- Cloud: AWS S3, Cloudflare R2, Azure Blob

4. **Environment Variables**
```bash
NODE_ENV=production
PORT=2000
DATABASE_URL=...
API_KEY=<genereer sterke key>
```

---

## ✅ WAT JE NU HEBT

### **🎯 Complete Headless E-Commerce Backend**
- ✅ Public API voor website (geen auth)
- ✅ Shopping cart systeem
- ✅ Checkout flow met discount codes
- ✅ Media upload & serving
- ✅ Financial dashboard met WINST tracking
- ✅ Admin panel met alle management

### **💰 Financial Tracking**
- ✅ Real-time winst berekening
- ✅ Omzet per product
- ✅ Kosten tracking
- ✅ Winstmarge percentage
- ✅ Category performance
- ✅ Low stock alerts

### **🛒 E-Commerce Features**
- ✅ 50 Producten (variants, attributes, reviews)
- ✅ 100 Klanten (met adressen)
- ✅ 200 Orders (complete history)
- ✅ Discount codes (4 actieve)
- ✅ Shipping methods (NL, BE, DE)
- ✅ Tax rates (BTW per land)
- ✅ Payment tracking (Mollie/Stripe)

---

## 🚀 START JE WEBSITE

1. **Test met de HTML template hierboven**
2. **Of bouw met React/Vue**
3. **Of koppel aan WordPress**

Alle data komt uit jouw CMS - **één centrale plek voor alles!**

---

**Questions? Check the CMS at http://localhost:2001** 🎉
