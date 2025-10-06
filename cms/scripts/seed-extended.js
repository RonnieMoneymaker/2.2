import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const apiKey = 'dev-api-key-123';
  
  // Get existing website
  const website = await prisma.website.findUnique({
    where: { apiKey }
  });

  if (!website) {
    console.error('Website not found. Run npm run db:seed first!');
    return;
  }

  console.log('Adding extended sample data...');

  // Add more categories
  const electronics = await prisma.category.upsert({
    where: { websiteId_slug: { websiteId: website.id, slug: 'elektronica' } },
    update: {},
    create: { websiteId: website.id, name: 'Elektronica', slug: 'elektronica' }
  });

  const clothing = await prisma.category.upsert({
    where: { websiteId_slug: { websiteId: website.id, slug: 'kleding' } },
    update: {},
    create: { websiteId: website.id, name: 'Kleding', slug: 'kleding' }
  });

  const home = await prisma.category.upsert({
    where: { websiteId_slug: { websiteId: website.id, slug: 'wonen' } },
    update: {},
    create: { websiteId: website.id, name: 'Wonen & Interieur', slug: 'wonen' }
  });

  // Add more products
  const products = [
    {
      name: 'Smartphone X Pro',
      slug: 'smartphone-x-pro',
      sku: 'ELEC-001',
      description: 'Krachtige smartphone met 5G',
      priceCents: 79900,
      stockQuantity: 25,
      categoryId: electronics.id,
    },
    {
      name: 'Draadloze Koptelefoon',
      slug: 'draadloze-koptelefoon',
      sku: 'ELEC-002',
      description: 'Noise cancelling koptelefoon',
      priceCents: 24900,
      stockQuantity: 50,
      categoryId: electronics.id,
    },
    {
      name: 'T-Shirt Basic Navy',
      slug: 't-shirt-basic-navy',
      sku: 'CLOTH-001',
      description: 'Comfortabel katoenen t-shirt',
      priceCents: 1995,
      stockQuantity: 100,
      categoryId: clothing.id,
    },
    {
      name: 'Spijkerbroek Slim Fit',
      slug: 'spijkerbroek-slim-fit',
      sku: 'CLOTH-002',
      description: 'Moderne slim fit jeans',
      priceCents: 5995,
      stockQuantity: 75,
      categoryId: clothing.id,
    },
    {
      name: 'Design Lamp LED',
      slug: 'design-lamp-led',
      sku: 'HOME-001',
      description: 'Moderne LED staande lamp',
      priceCents: 8900,
      stockQuantity: 30,
      categoryId: home.id,
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { websiteId_slug: { websiteId: website.id, slug: prod.slug } },
      update: {},
      create: {
        websiteId: website.id,
        ...prod,
      }
    });
  }

  console.log('✅ Added products');

  // Add more customers
  const customers = [
    {
      email: 'maria@example.nl',
      firstName: 'Maria',
      lastName: 'de Vries',
      phone: '06-12345678',
      address: 'Hoofdstraat 123',
      city: 'Utrecht',
      postalCode: '3511 AB',
      country: 'Nederland',
    },
    {
      email: 'peter@example.nl',
      firstName: 'Peter',
      lastName: 'Bakker',
      phone: '06-98765432',
      address: 'Kalverstraat 45',
      city: 'Amsterdam',
      postalCode: '1012 NX',
      country: 'Nederland',
    },
    {
      email: 'sophie@example.nl',
      firstName: 'Sophie',
      lastName: 'Vermeulen',
      phone: '06-55512345',
      address: 'Wijnhaven 67',
      city: 'Rotterdam',
      postalCode: '3011 WJ',
      country: 'Nederland',
    },
    {
      email: 'thomas@example.nl',
      firstName: 'Thomas',
      lastName: 'Smit',
      phone: '06-77788899',
      city: 'Den Haag',
      country: 'Nederland',
    },
  ];

  for (const cust of customers) {
    await prisma.customer.upsert({
      where: { websiteId_email: { websiteId: website.id, email: cust.email } },
      update: {},
      create: {
        websiteId: website.id,
        ...cust,
      }
    });
  }

  console.log('✅ Added customers');

  // Add more orders
  const allProducts = await prisma.product.findMany({ where: { websiteId: website.id } });
  const allCustomers = await prisma.customer.findMany({ where: { websiteId: website.id } });

  if (allProducts.length > 0 && allCustomers.length > 0) {
    // Order 3: Maria orders smartphone
    const customer1 = allCustomers.find(c => c.email === 'maria@example.nl');
    const smartphone = allProducts.find(p => p.slug === 'smartphone-x-pro');
    
    if (customer1 && smartphone) {
      const order3 = await prisma.order.upsert({
        where: { websiteId_orderNumber: { websiteId: website.id, orderNumber: 'ORD-1003' } },
        update: {},
        create: {
          websiteId: website.id,
          customerId: customer1.id,
          orderNumber: 'ORD-1003',
          status: 'shipped',
          totalCents: smartphone.priceCents,
        }
      });
      
      // Check if order item already exists
      const existingItem = await prisma.orderItem.findFirst({
        where: { orderId: order3.id, productId: smartphone.id }
      });
      
      if (!existingItem) {
        await prisma.orderItem.create({
          data: {
            orderId: order3.id,
            productId: smartphone.id,
            quantity: 1,
            unitCents: smartphone.priceCents,
            totalCents: smartphone.priceCents,
          }
        });
      }
    }

    // Order 4: Peter orders clothing
    const customer2 = allCustomers.find(c => c.email === 'peter@example.nl');
    const tshirt = allProducts.find(p => p.slug === 't-shirt-basic-navy');
    const jeans = allProducts.find(p => p.slug === 'spijkerbroek-slim-fit');
    
    if (customer2 && tshirt && jeans) {
      const totalCents = (tshirt.priceCents * 2) + jeans.priceCents;
      const order4 = await prisma.order.upsert({
        where: { websiteId_orderNumber: { websiteId: website.id, orderNumber: 'ORD-1004' } },
        update: {},
        create: {
          websiteId: website.id,
          customerId: customer2.id,
          orderNumber: 'ORD-1004',
          status: 'delivered',
          totalCents,
        }
      });
      
      const existingItems = await prisma.orderItem.findMany({
        where: { orderId: order4.id }
      });
      
      if (existingItems.length === 0) {
        await prisma.orderItem.createMany({
          data: [
            {
              orderId: order4.id,
              productId: tshirt.id,
              quantity: 2,
              unitCents: tshirt.priceCents,
              totalCents: tshirt.priceCents * 2,
            },
            {
              orderId: order4.id,
              productId: jeans.id,
              quantity: 1,
              unitCents: jeans.priceCents,
              totalCents: jeans.priceCents,
            }
          ]
        });
      }
    }

    // Order 5: Sophie orders lamp
    const customer3 = allCustomers.find(c => c.email === 'sophie@example.nl');
    const lamp = allProducts.find(p => p.slug === 'design-lamp-led');
    
    if (customer3 && lamp) {
      const order5 = await prisma.order.upsert({
        where: { websiteId_orderNumber: { websiteId: website.id, orderNumber: 'ORD-1005' } },
        update: {},
        create: {
          websiteId: website.id,
          customerId: customer3.id,
          orderNumber: 'ORD-1005',
          status: 'pending',
          totalCents: lamp.priceCents,
        }
      });
      
      const existingItem = await prisma.orderItem.findFirst({
        where: { orderId: order5.id, productId: lamp.id }
      });
      
      if (!existingItem) {
        await prisma.orderItem.create({
          data: {
            orderId: order5.id,
            productId: lamp.id,
            quantity: 1,
            unitCents: lamp.priceCents,
            totalCents: lamp.priceCents,
          }
        });
      }
    }
  }

  console.log('✅ Added orders');
  console.log('\n🎉 Extended seed completed successfully!');
  console.log('\nStats:');
  console.log(`- Categories: ${await prisma.category.count({ where: { websiteId: website.id } })}`);
  console.log(`- Products: ${await prisma.product.count({ where: { websiteId: website.id } })}`);
  console.log(`- Customers: ${await prisma.customer.count({ where: { websiteId: website.id } })}`);
  console.log(`- Orders: ${await prisma.order.count({ where: { websiteId: website.id } })}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


