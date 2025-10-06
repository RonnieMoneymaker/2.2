// Complete Seed Script - Realistic E-Commerce Data
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting complete seed...\n');

  // Create or get website
  console.log('Getting/Creating website...');
  let website = await prisma.website.findUnique({
    where: { apiKey: 'dev-api-key-123' }
  });
  
  if (!website) {
    website = await prisma.website.create({
      data: {
        name: 'Voltmover Shop',
        domain: 'voltmover.nl',
        apiKey: 'dev-api-key-123',
        isActive: true
      }
    });
    console.log('✅ Website created\n');
  } else {
    console.log('✅ Website already exists\n');
  }
  
  // Clear existing data for fresh seed
  console.log('Clearing existing data...');
  await prisma.orderItem.deleteMany({ where: { order: { websiteId: website.id } } });
  await prisma.orderStatusHistory.deleteMany({ where: { order: { websiteId: website.id } } });
  await prisma.paymentTransaction.deleteMany({ where: { order: { websiteId: website.id } } });
  await prisma.order.deleteMany({ where: { websiteId: website.id } });
  await prisma.customerAddress.deleteMany({ where: { customer: { websiteId: website.id } } });
  await prisma.review.deleteMany({ where: { product: { websiteId: website.id } } });
  await prisma.productVariant.deleteMany({ where: { product: { websiteId: website.id } } });
  await prisma.productAttribute.deleteMany({ where: { product: { websiteId: website.id } } });
  await prisma.product.deleteMany({ where: { websiteId: website.id } });
  await prisma.customer.deleteMany({ where: { websiteId: website.id } });
  await prisma.category.deleteMany({ where: { websiteId: website.id } });
  await prisma.discountCode.deleteMany({ where: { websiteId: website.id } });
  await prisma.shippingZone.deleteMany({ where: { shippingMethod: { websiteId: website.id } } });
  await prisma.shippingMethod.deleteMany({ where: { websiteId: website.id } });
  await prisma.taxRate.deleteMany({ where: { websiteId: website.id } });
  await prisma.setting.deleteMany({ where: { websiteId: website.id } });
  await prisma.notification.deleteMany({ where: { websiteId: website.id } });
  console.log('✅ Existing data cleared\n');

  // Create categories
  console.log('Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        websiteId: website.id,
        name: 'Electronics',
        slug: 'electronics'
      }
    }),
    prisma.category.create({
      data: {
        websiteId: website.id,
        name: 'Fashion',
        slug: 'fashion'
      }
    }),
    prisma.category.create({
      data: {
        websiteId: website.id,
        name: 'Home & Garden',
        slug: 'home-garden'
      }
    }),
    prisma.category.create({
      data: {
        websiteId: website.id,
        name: 'Sports',
        slug: 'sports'
      }
    }),
    prisma.category.create({
      data: {
        websiteId: website.id,
        name: 'Books',
        slug: 'books'
      }
    })
  ]);
  console.log(`✅ ${categories.length} categories created\n`);

  // Create subcategories
  console.log('Creating subcategories...');
  await Promise.all([
    prisma.category.create({
      data: {
        websiteId: website.id,
        name: 'Laptops',
        slug: 'laptops',
        parentId: categories[0].id
      }
    }),
    prisma.category.create({
      data: {
        websiteId: website.id,
        name: 'Smartphones',
        slug: 'smartphones',
        parentId: categories[0].id
      }
    }),
    prisma.category.create({
      data: {
        websiteId: website.id,
        name: 'Men',
        slug: 'men',
        parentId: categories[1].id
      }
    }),
    prisma.category.create({
      data: {
        websiteId: website.id,
        name: 'Women',
        slug: 'women',
        parentId: categories[1].id
      }
    })
  ]);
  console.log('✅ Subcategories created\n');

  // Create products
  console.log('Creating 50 products...');
  const products = [];
  const productData = [
    { name: 'MacBook Pro 16"', category: 0, price: 249900, cost: 200000, stock: 15, weight: 2.0, featured: true },
    { name: 'Dell XPS 15', category: 0, price: 179900, cost: 140000, stock: 12, weight: 1.8, featured: true },
    { name: 'iPhone 15 Pro', category: 0, price: 119900, cost: 90000, stock: 25, weight: 0.2, featured: true },
    { name: 'Samsung Galaxy S24', category: 0, price: 89900, cost: 70000, stock: 30, weight: 0.2, featured: false },
    { name: 'iPad Air', category: 0, price: 64900, cost: 50000, stock: 18, weight: 0.5, featured: false },
    { name: 'AirPods Pro 2', category: 0, price: 27900, cost: 20000, stock: 50, weight: 0.1, featured: true },
    { name: 'Sony WH-1000XM5', category: 0, price: 39900, cost: 30000, stock: 22, weight: 0.3, featured: false },
    { name: 'Nike Air Max', category: 1, price: 12999, cost: 8000, stock: 40, weight: 0.8, featured: false },
    { name: 'Adidas Ultraboost', category: 1, price: 14999, cost: 9000, stock: 35, weight: 0.7, featured: false },
    { name: 'Levi\'s 501 Jeans', category: 1, price: 8999, cost: 5000, stock: 60, weight: 0.5, featured: false }
  ];

  // Create 50 products with variations
  for (let i = 0; i < 50; i++) {
    const base = productData[i % productData.length];
    const product = await prisma.product.create({
      data: {
        websiteId: website.id,
        categoryId: categories[base.category].id,
        name: `${base.name} ${i > 9 ? `v${i}` : ''}`,
        slug: `${base.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`,
        sku: `SKU-${1000 + i}`,
        description: `High-quality ${base.name}. ${i % 3 === 0 ? 'Limited edition' : 'Best seller'}. Perfect for ${i % 2 === 0 ? 'professionals' : 'everyday use'}.`,
        shortDescription: `Premium ${base.name} with excellent features`,
        priceCents: base.price + (i * 1000),
        comparePriceCents: i % 3 === 0 ? base.price + (i * 1000) + 5000 : null,
        costCents: base.cost,
        stockQuantity: base.stock - (i % 10),
        lowStockThreshold: 5,
        weight: base.weight,
        isActive: true,
        isFeatured: base.featured && i < 10,
        images: JSON.stringify([
          `https://picsum.photos/800/600?random=${i}`,
          `https://picsum.photos/800/600?random=${i + 100}`,
          `https://picsum.photos/800/600?random=${i + 200}`
        ]),
        metaTitle: `Buy ${base.name} | Voltmover Shop`,
        metaDescription: `Best prices on ${base.name}. Free shipping over €50. Order now!`
      }
    });
    products.push(product);

    // Add product attributes
    await Promise.all([
      prisma.productAttribute.create({
        data: {
          productId: product.id,
          name: 'Brand',
          value: i % 5 === 0 ? 'Apple' : i % 5 === 1 ? 'Samsung' : i % 5 === 2 ? 'Nike' : i % 5 === 3 ? 'Sony' : 'Dell'
        }
      }),
      prisma.productAttribute.create({
        data: {
          productId: product.id,
          name: 'Warranty',
          value: i % 2 === 0 ? '2 years' : '1 year'
        }
      })
    ]);

    // Add variants for some products (like clothing)
    if (i % 5 === 0 && i < 20) {
      await Promise.all([
        prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: `${product.sku}-S`,
            name: 'Small',
            priceCents: product.priceCents,
            stockQuantity: 10,
            attributes: JSON.stringify({ size: 'S' })
          }
        }),
        prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: `${product.sku}-M`,
            name: 'Medium',
            priceCents: product.priceCents,
            stockQuantity: 15,
            attributes: JSON.stringify({ size: 'M' })
          }
        }),
        prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: `${product.sku}-L`,
            name: 'Large',
            priceCents: product.priceCents,
            stockQuantity: 12,
            attributes: JSON.stringify({ size: 'L' })
          }
        })
      ]);
    }
  }
  console.log(`✅ ${products.length} products created with variants and attributes\n`);

  // Create customers
  console.log('Creating 100 customers...');
  const customers = [];
  const firstNames = ['Jan', 'Peter', 'Marie', 'Sophie', 'Lucas', 'Emma', 'Lars', 'Anna', 'Tom', 'Lisa'];
  const lastNames = ['Jansen', 'De Vries', 'Van Dijk', 'Bakker', 'Visser', 'Smit', 'Meijer', 'De Boer', 'Mulder', 'De Groot'];
  const cities = ['Amsterdam', 'Rotterdam', 'Utrecht', 'Den Haag', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere'];

  for (let i = 0; i < 100; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const customer = await prisma.customer.create({
      data: {
        websiteId: website.id,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        password: await bcrypt.hash('password123', 10),
        firstName,
        lastName,
        phone: `06${Math.floor(10000000 + Math.random() * 90000000)}`,
        company: i % 5 === 0 ? `${lastName} B.V.` : null,
        address: `${lastName}straat ${Math.floor(1 + Math.random() * 200)}`,
        city: cities[i % cities.length],
        postalCode: `${1000 + Math.floor(Math.random() * 9000)}AB`,
        country: 'Nederland',
        acceptsMarketing: i % 3 === 0,
        isActive: true
      }
    });
    customers.push(customer);

    // Add addresses for some customers
    if (i % 10 === 0) {
      await prisma.customerAddress.create({
        data: {
          customerId: customer.id,
          label: 'Work',
          firstName: customer.firstName,
          lastName: customer.lastName,
          address: `Office Park ${Math.floor(1 + Math.random() * 50)}`,
          city: cities[(i + 1) % cities.length],
          postalCode: `${2000 + Math.floor(Math.random() * 8000)}CD`,
          country: 'Nederland',
          isDefault: false
        }
      });
    }
  }
  console.log(`✅ ${customers.length} customers created\n`);

  // Create orders
  console.log('Creating 200 orders...');
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const paymentStatuses = ['unpaid', 'paid', 'paid', 'paid', 'unpaid'];
  const paymentMethods = ['mollie', 'stripe', 'ideal', 'creditcard'];

  for (let i = 0; i < 200; i++) {
    const customer = customers[i % customers.length];
    const status = statuses[i % statuses.length];
    const paymentStatus = paymentStatuses[i % paymentStatuses.length];
    const numItems = 1 + Math.floor(Math.random() * 4);
    
    // Calculate order totals
    const selectedProducts = [];
    let subtotal = 0;
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = 1 + Math.floor(Math.random() * 3);
      selectedProducts.push({ product, quantity });
      subtotal += product.priceCents * quantity;
    }
    
    const shipping = 595; // €5.95
    const tax = Math.floor(subtotal * 0.21); // 21% BTW
    const discount = i % 10 === 0 ? Math.floor(subtotal * 0.1) : 0; // 10% discount for some
    const total = subtotal + shipping + tax - discount;

    const orderDate = new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000);

    const order = await prisma.order.create({
      data: {
        websiteId: website.id,
        customerId: customer.id,
        orderNumber: `ORD-${10000 + i}`,
        status,
        paymentStatus,
        paymentMethod: paymentMethods[i % paymentMethods.length],
        subtotalCents: subtotal,
        shippingCents: shipping,
        taxCents: tax,
        discountCents: discount,
        totalCents: total,
        shippingFirstName: customer.firstName,
        shippingLastName: customer.lastName,
        shippingAddress: customer.address,
        shippingCity: customer.city,
        shippingPostal: customer.postalCode,
        shippingCountry: customer.country,
        shippingPhone: customer.phone,
        billingFirstName: customer.firstName,
        billingLastName: customer.lastName,
        billingAddress: customer.address,
        billingCity: customer.city,
        billingPostal: customer.postalCode,
        billingCountry: customer.country,
        billingEmail: customer.email,
        trackingNumber: status === 'shipped' || status === 'delivered' ? `TRACK-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null,
        shippedAt: status === 'shipped' || status === 'delivered' ? new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
        deliveredAt: status === 'delivered' ? new Date(orderDate.getTime() + 5 * 24 * 60 * 60 * 1000) : null,
        createdAt: orderDate,
        updatedAt: orderDate
      }
    });

    // Create order items
    for (const { product, quantity } of selectedProducts) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity,
          unitCents: product.priceCents,
          totalCents: product.priceCents * quantity,
          taxCents: Math.floor(product.priceCents * quantity * 0.21)
        }
      });
    }

    // Create payment transaction
    if (paymentStatus === 'paid') {
      await prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          paymentProvider: paymentMethods[i % paymentMethods.length],
          transactionId: `txn_${Math.random().toString(36).substr(2, 16)}`,
          status: 'completed',
          amountCents: total,
          paymentMethod: paymentMethods[i % paymentMethods.length],
          createdAt: orderDate
        }
      });
    }

    // Create order status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'pending',
        note: 'Order created',
        createdAt: orderDate
      }
    });

    if (status !== 'pending') {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'processing',
          note: 'Payment received, processing order',
          createdAt: new Date(orderDate.getTime() + 1 * 60 * 60 * 1000)
        }
      });
    }

    // Update customer stats
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        orderCount: { increment: 1 },
        totalSpent: { increment: total },
        lastOrderAt: orderDate
      }
    });
  }
  console.log('✅ 200 orders created with items and transactions\n');

  // Create reviews
  console.log('Creating product reviews...');
  for (let i = 0; i < 50; i++) {
    const product = products[i % products.length];
    const customer = customers[i % customers.length];
    await prisma.review.create({
      data: {
        productId: product.id,
        customerId: customer.id,
        rating: 3 + Math.floor(Math.random() * 3), // 3-5 stars
        title: ['Great product!', 'Highly recommended', 'Good value', 'Excellent quality', 'Very satisfied'][i % 5],
        comment: `This is a great product. I've been using it for ${1 + Math.floor(Math.random() * 6)} months and it works perfectly.`,
        isApproved: i % 10 !== 0, // 90% approved
        isVerifiedPurchase: i % 3 === 0
      }
    });
  }
  console.log('✅ 50 reviews created\n');

  // Create discount codes
  console.log('Creating discount codes...');
  await Promise.all([
    prisma.discountCode.create({
      data: {
        websiteId: website.id,
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minOrderCents: 5000,
        isActive: true
      }
    }),
    prisma.discountCode.create({
      data: {
        websiteId: website.id,
        code: 'SUMMER25',
        type: 'percentage',
        value: 25,
        minOrderCents: 10000,
        usageLimit: 100,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    }),
    prisma.discountCode.create({
      data: {
        websiteId: website.id,
        code: 'FREESHIP',
        type: 'free_shipping',
        value: 0,
        minOrderCents: 2500,
        isActive: true
      }
    }),
    prisma.discountCode.create({
      data: {
        websiteId: website.id,
        code: 'SAVE50',
        type: 'fixed_amount',
        value: 5000, // €50
        minOrderCents: 20000,
        isActive: true
      }
    })
  ]);
  console.log('✅ Discount codes created\n');

  // Create shipping methods
  console.log('Creating shipping methods...');
  const standardShipping = await prisma.shippingMethod.create({
    data: {
      websiteId: website.id,
      name: 'Standard Shipping',
      description: 'Delivery in 3-5 business days',
      priceCents: 595,
      freeAbove: 5000,
      minDays: 3,
      maxDays: 5,
      isActive: true
    }
  });

  const expressShipping = await prisma.shippingMethod.create({
    data: {
      websiteId: website.id,
      name: 'Express Shipping',
      description: 'Next day delivery',
      priceCents: 1295,
      minDays: 1,
      maxDays: 1,
      isActive: true
    }
  });

  // Add shipping zones
  await Promise.all([
    prisma.shippingZone.create({
      data: {
        shippingMethodId: standardShipping.id,
        country: 'NL',
        additionalCents: 0
      }
    }),
    prisma.shippingZone.create({
      data: {
        shippingMethodId: standardShipping.id,
        country: 'BE',
        additionalCents: 200
      }
    }),
    prisma.shippingZone.create({
      data: {
        shippingMethodId: standardShipping.id,
        country: 'DE',
        additionalCents: 300
      }
    }),
    prisma.shippingZone.create({
      data: {
        shippingMethodId: expressShipping.id,
        country: 'NL',
        additionalCents: 0
      }
    })
  ]);
  console.log('✅ Shipping methods and zones created\n');

  // Create tax rates
  console.log('Creating tax rates...');
  await Promise.all([
    prisma.taxRate.create({
      data: {
        websiteId: website.id,
        country: 'NL',
        name: 'BTW 21%',
        rate: 21.0,
        isActive: true
      }
    }),
    prisma.taxRate.create({
      data: {
        websiteId: website.id,
        country: 'NL',
        name: 'BTW 9%',
        rate: 9.0,
        isActive: true
      }
    }),
    prisma.taxRate.create({
      data: {
        websiteId: website.id,
        country: 'BE',
        name: 'VAT 21%',
        rate: 21.0,
        isActive: true
      }
    }),
    prisma.taxRate.create({
      data: {
        websiteId: website.id,
        country: 'DE',
        name: 'MwSt 19%',
        rate: 19.0,
        isActive: true
      }
    })
  ]);
  console.log('✅ Tax rates created\n');

  // Create settings
  console.log('Creating system settings...');
  await Promise.all([
    prisma.setting.create({
      data: {
        websiteId: website.id,
        key: 'store_name',
        value: 'Voltmover Shop',
        type: 'string'
      }
    }),
    prisma.setting.create({
      data: {
        websiteId: website.id,
        key: 'store_email',
        value: 'info@voltmover.nl',
        type: 'string'
      }
    }),
    prisma.setting.create({
      data: {
        websiteId: website.id,
        key: 'currency',
        value: 'EUR',
        type: 'string'
      }
    }),
    prisma.setting.create({
      data: {
        websiteId: website.id,
        key: 'tax_enabled',
        value: 'true',
        type: 'boolean'
      }
    }),
    prisma.setting.create({
      data: {
        websiteId: website.id,
        key: 'low_stock_threshold',
        value: '5',
        type: 'number'
      }
    })
  ]);
  console.log('✅ Settings created\n');

  // Create notifications
  console.log('Creating notifications...');
  for (let i = 0; i < 20; i++) {
    await prisma.notification.create({
      data: {
        websiteId: website.id,
        type: ['order_placed', 'low_stock', 'payment_received', 'new_customer'][i % 4],
        title: ['New Order Received', 'Low Stock Alert', 'Payment Received', 'New Customer Registered'][i % 4],
        message: `${['Order', 'Product', 'Payment', 'Customer'][i % 4]} #${1000 + i} requires attention`,
        isRead: i % 3 === 0,
        link: `/orders/${1000 + i}`,
        createdAt: new Date(Date.now() - i * 60 * 60 * 1000)
      }
    });
  }
  console.log('✅ 20 notifications created\n');

  console.log('🎉 Complete seed finished!\n');
  console.log('📊 Summary:');
  console.log(`- 1 Website`);
  console.log(`- 9 Categories (with hierarchy)`);
  console.log(`- 50 Products (with variants, attributes, images)`);
  console.log(`- 100 Customers (with addresses)`);
  console.log(`- 200 Orders (with items, payments, status history)`);
  console.log(`- 50 Reviews`);
  console.log(`- 4 Discount codes`);
  console.log(`- 2 Shipping methods (with zones)`);
  console.log(`- 4 Tax rates`);
  console.log(`- 5 Settings`);
  console.log(`- 20 Notifications`);
  console.log('\n✅ Database is fully populated and ready to use!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
