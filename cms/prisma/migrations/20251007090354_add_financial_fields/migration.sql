-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "contactInfo" TEXT;
ALTER TABLE "Customer" ADD COLUMN "tags" TEXT;

-- CreateTable
CREATE TABLE "CustomerComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "author" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomerComment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdSpend" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "websiteId" INTEGER NOT NULL,
    "integrationId" INTEGER,
    "platform" TEXT NOT NULL,
    "campaignId" TEXT,
    "campaignName" TEXT,
    "date" DATETIME NOT NULL,
    "spendCents" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdSpend_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShippingRate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "websiteId" INTEGER NOT NULL,
    "carrier" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "minWeightGrams" INTEGER,
    "maxWeightGrams" INTEGER,
    "priceCents" INTEGER NOT NULL,
    "pricePerKgCents" INTEGER NOT NULL DEFAULT 0,
    "deliveryDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaymentProvider" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "websiteId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "webhookUrl" TEXT,
    "config" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SyncQueue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "websiteId" INTEGER NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Integration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "websiteId" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" TEXT NOT NULL,
    "lastSync" DATETIME,
    "syncStatus" TEXT DEFAULT 'idle',
    "lastError" TEXT,
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "syncInterval" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Integration_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Integration" ("config", "createdAt", "id", "isActive", "lastError", "lastSync", "name", "platform", "syncStatus", "updatedAt", "websiteId") SELECT "config", "createdAt", "id", "isActive", "lastError", "lastSync", "name", "platform", "syncStatus", "updatedAt", "websiteId" FROM "Integration";
DROP TABLE "Integration";
ALTER TABLE "new_Integration" RENAME TO "Integration";
CREATE UNIQUE INDEX "Integration_websiteId_platform_name_key" ON "Integration"("websiteId", "platform", "name");
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "websiteId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "paymentMethod" TEXT,
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "shippingCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "profitCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "customerNote" TEXT,
    "internalNote" TEXT,
    "adminComments" TEXT,
    "shippingFirstName" TEXT,
    "shippingLastName" TEXT,
    "shippingCompany" TEXT,
    "shippingAddress" TEXT,
    "shippingCity" TEXT,
    "shippingState" TEXT,
    "shippingPostal" TEXT,
    "shippingCountry" TEXT,
    "shippingPhone" TEXT,
    "billingFirstName" TEXT,
    "billingLastName" TEXT,
    "billingCompany" TEXT,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingPostal" TEXT,
    "billingCountry" TEXT,
    "billingPhone" TEXT,
    "billingEmail" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME,
    "cancelledAt" DATETIME,
    "refundedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("billingAddress", "billingCity", "billingCompany", "billingCountry", "billingEmail", "billingFirstName", "billingLastName", "billingPhone", "billingPostal", "billingState", "cancelledAt", "createdAt", "currency", "customerId", "customerNote", "deliveredAt", "discountCents", "id", "internalNote", "orderNumber", "paymentMethod", "paymentStatus", "refundedAt", "shippedAt", "shippingAddress", "shippingCents", "shippingCity", "shippingCompany", "shippingCountry", "shippingFirstName", "shippingLastName", "shippingPhone", "shippingPostal", "shippingState", "status", "subtotalCents", "taxCents", "totalCents", "trackingNumber", "trackingUrl", "updatedAt", "websiteId") SELECT "billingAddress", "billingCity", "billingCompany", "billingCountry", "billingEmail", "billingFirstName", "billingLastName", "billingPhone", "billingPostal", "billingState", "cancelledAt", "createdAt", "currency", "customerId", "customerNote", "deliveredAt", "discountCents", "id", "internalNote", "orderNumber", "paymentMethod", "paymentStatus", "refundedAt", "shippedAt", "shippingAddress", "shippingCents", "shippingCity", "shippingCompany", "shippingCountry", "shippingFirstName", "shippingLastName", "shippingPhone", "shippingPostal", "shippingState", "status", "subtotalCents", "taxCents", "totalCents", "trackingNumber", "trackingUrl", "updatedAt", "websiteId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_websiteId_status_idx" ON "Order"("websiteId", "status");
CREATE INDEX "Order_websiteId_customerId_idx" ON "Order"("websiteId", "customerId");
CREATE INDEX "Order_websiteId_createdAt_idx" ON "Order"("websiteId", "createdAt");
CREATE UNIQUE INDEX "Order_websiteId_orderNumber_key" ON "Order"("websiteId", "orderNumber");
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "websiteId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "shortDescription" TEXT,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "comparePriceCents" INTEGER,
    "costCents" INTEGER,
    "taxRate" REAL NOT NULL DEFAULT 21.0,
    "shippingCostCents" INTEGER NOT NULL DEFAULT 0,
    "profitMarginCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "weight" REAL,
    "dimensions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "images" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "comparePriceCents", "costCents", "createdAt", "currency", "description", "id", "images", "isActive", "isFeatured", "lowStockThreshold", "metaDescription", "metaTitle", "name", "priceCents", "shortDescription", "sku", "slug", "stockQuantity", "updatedAt", "websiteId", "weight") SELECT "categoryId", "comparePriceCents", "costCents", "createdAt", "currency", "description", "id", "images", "isActive", "isFeatured", "lowStockThreshold", "metaDescription", "metaTitle", "name", "priceCents", "shortDescription", "sku", "slug", "stockQuantity", "updatedAt", "websiteId", "weight" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_websiteId_isActive_idx" ON "Product"("websiteId", "isActive");
CREATE UNIQUE INDEX "Product_websiteId_slug_key" ON "Product"("websiteId", "slug");
CREATE UNIQUE INDEX "Product_websiteId_sku_key" ON "Product"("websiteId", "sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CustomerComment_customerId_idx" ON "CustomerComment"("customerId");

-- CreateIndex
CREATE INDEX "AdSpend_websiteId_date_idx" ON "AdSpend"("websiteId", "date");

-- CreateIndex
CREATE INDEX "AdSpend_websiteId_platform_date_idx" ON "AdSpend"("websiteId", "platform", "date");

-- CreateIndex
CREATE INDEX "ShippingRate_websiteId_carrier_country_idx" ON "ShippingRate"("websiteId", "carrier", "country");

-- CreateIndex
CREATE INDEX "PaymentProvider_websiteId_isActive_idx" ON "PaymentProvider"("websiteId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProvider_websiteId_provider_key" ON "PaymentProvider"("websiteId", "provider");

-- CreateIndex
CREATE INDEX "SyncQueue_websiteId_status_idx" ON "SyncQueue"("websiteId", "status");

-- CreateIndex
CREATE INDEX "SyncQueue_websiteId_entity_entityId_idx" ON "SyncQueue"("websiteId", "entity", "entityId");
