import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

export const getCustomers = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { search, page = 1, limit = 50 } = req.query;

    const where = {
      websiteId,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          orders: {
            select: {
              id: true,
              orderNumber: true,
              totalCents: true,
              status: true,
              createdAt: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: { id: Number(id), websiteId },
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Klant niet gevonden' });
    }

    res.json(customer);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { email, firstName, lastName, phone, address, city, postalCode, country } = req.body;

    // Check if customer already exists
    const existing = await prisma.customer.findUnique({
      where: { websiteId_email: { websiteId, email } },
    });

    if (existing) {
      return res.status(400).json({ error: 'Klant met dit e-mailadres bestaat al' });
    }

    const customer = await prisma.customer.create({
      data: {
        websiteId,
        email,
        firstName,
        lastName,
        phone,
        address,
        city,
        postalCode,
        country: country || 'Nederland',
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;
    const { email, firstName, lastName, phone, address, city, postalCode, country } = req.body;

    const customer = await prisma.customer.findFirst({
      where: { id: Number(id), websiteId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Klant niet gevonden' });
    }

    const updated = await prisma.customer.update({
      where: { id: Number(id) },
      data: {
        email,
        firstName,
        lastName,
        phone,
        address,
        city,
        postalCode,
        country,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: { id: Number(id), websiteId },
      include: { orders: true },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Klant niet gevonden' });
    }

    if (customer.orders.length > 0) {
      return res.status(400).json({ 
        error: 'Kan klant niet verwijderen: er zijn nog bestellingen gekoppeld' 
      });
    }

    await prisma.customer.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Klant succesvol verwijderd' });
  } catch (error) {
    next(error);
  }
};

// Get customer comments
export const getCustomerComments = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: { id: Number(id), websiteId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Klant niet gevonden' });
    }

    const comments = await prisma.customerComment.findMany({
      where: { customerId: Number(id) },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ comments });
  } catch (error) {
    next(error);
  }
};

// Add customer comment
export const addCustomerComment = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;
    const { comment, author, isInternal = true } = req.body;

    const customer = await prisma.customer.findFirst({
      where: { id: Number(id), websiteId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Klant niet gevonden' });
    }

    const newComment = await prisma.customerComment.create({
      data: {
        customerId: Number(id),
        comment,
        author,
        isInternal,
      },
    });

    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

// Update customer comment
export const updateCustomerComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;

    const updated = await prisma.customerComment.update({
      where: { id: Number(commentId) },
      data: { comment },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Delete customer comment
export const deleteCustomerComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    await prisma.customerComment.delete({
      where: { id: Number(commentId) },
    });

    res.json({ message: 'Opmerking succesvol verwijderd' });
  } catch (error) {
    next(error);
  }
};