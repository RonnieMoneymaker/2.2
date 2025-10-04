import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const apiKey = 'dev-api-key-123';
  const website = await prisma.website.upsert({
    where: { domain: 'example.local' },
    update: {},
    create: { name: 'Example', domain: 'example.local', apiKey }
  });

  const cat = await prisma.category.upsert({
    where: { websiteId_slug: { websiteId: website.id, slug: 'default' } },
    update: {},
    create: { websiteId: website.id, name: 'Default', slug: 'default' }
  });

  await prisma.product.upsert({
    where: { websiteId_slug: { websiteId: website.id, slug: 'demo-product' } },
    update: {},
    create: {
      websiteId: website.id,
      name: 'Demo product',
      slug: 'demo-product',
      sku: 'DEMO-001',
      description: 'Voorbeeld product',
      priceCents: 1999,
      currency: 'EUR',
      stockQuantity: 10,
      categoryId: cat.id,
      images: [{ url: 'https://picsum.photos/400' }]
    }
  });

  console.log('Seed completed. API key:', apiKey);

  // Seed a customer and a couple of orders for analytics
  const customer = await prisma.customer.upsert({
    where: { websiteId_email: { websiteId: website.id, email: 'jan@example.local' } },
    update: {},
    create: {
      websiteId: website.id,
      email: 'jan@example.local',
      firstName: 'Jan',
      lastName: 'Jansen',
      city: 'Amsterdam',
      country: 'Nederland'
    }
  });

  const prod = await prisma.product.findFirst({ where: { websiteId: website.id, slug: 'demo-product' } });

  if (prod) {
    const order1 = await prisma.order.upsert({
      where: { websiteId_orderNumber: { websiteId: website.id, orderNumber: 'ORD-1001' } },
      update: {},
      create: {
        websiteId: website.id,
        customerId: customer.id,
        orderNumber: 'ORD-1001',
        status: 'delivered',
        totalCents: 1999
      }
    });
    await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        productId: prod.id,
        quantity: 1,
        unitCents: 1999,
        totalCents: 1999
      }
    });

    const order2 = await prisma.order.upsert({
      where: { websiteId_orderNumber: { websiteId: website.id, orderNumber: 'ORD-1002' } },
      update: {},
      create: {
        websiteId: website.id,
        customerId: customer.id,
        orderNumber: 'ORD-1002',
        status: 'processing',
        totalCents: 3998
      }
    });
    await prisma.orderItem.create({
      data: {
        orderId: order2.id,
        productId: prod.id,
        quantity: 2,
        unitCents: 1999,
        totalCents: 3998
      }
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


