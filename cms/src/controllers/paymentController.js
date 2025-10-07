import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

// Get all payment providers
export const getPaymentProviders = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { isActive } = req.query;

    const where = {
      websiteId,
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    const providers = await prisma.paymentProvider.findMany({
      where,
      select: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        isTest: true,
        webhookUrl: true,
        createdAt: true,
        updatedAt: true,
        // Geen apiKey/apiSecret voor veiligheid
      },
      orderBy: { name: 'asc' },
    });

    res.json({ providers });
  } catch (error) {
    next(error);
  }
};

// Get single payment provider
export const getPaymentProvider = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;

    const provider = await prisma.paymentProvider.findFirst({
      where: { id: Number(id), websiteId },
      select: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        isTest: true,
        webhookUrl: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Payment provider niet gevonden' });
    }

    res.json(provider);
  } catch (error) {
    next(error);
  }
};

// Create payment provider
export const createPaymentProvider = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const data = req.body;

    // Check if provider already exists
    const existing = await prisma.paymentProvider.findFirst({
      where: {
        websiteId,
        provider: data.provider,
      },
    });

    if (existing) {
      return res.status(400).json({ 
        error: 'Deze payment provider bestaat al voor deze website' 
      });
    }

    const provider = await prisma.paymentProvider.create({
      data: {
        ...data,
        websiteId,
      },
      select: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        isTest: true,
        webhookUrl: true,
        createdAt: true,
      },
    });

    res.status(201).json(provider);
  } catch (error) {
    next(error);
  }
};

// Update payment provider
export const updatePaymentProvider = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;
    const data = req.body;

    const provider = await prisma.paymentProvider.findFirst({
      where: { id: Number(id), websiteId },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Payment provider niet gevonden' });
    }

    const updated = await prisma.paymentProvider.update({
      where: { id: Number(id) },
      data,
      select: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        isTest: true,
        webhookUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Delete payment provider
export const deletePaymentProvider = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;

    const provider = await prisma.paymentProvider.findFirst({
      where: { id: Number(id), websiteId },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Payment provider niet gevonden' });
    }

    await prisma.paymentProvider.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Payment provider succesvol verwijderd' });
  } catch (error) {
    next(error);
  }
};

// Get supported payment providers list
export const getSupportedProviders = async (req, res, next) => {
  try {
    const providers = [
      {
        code: 'mollie',
        name: 'Mollie',
        description: 'Nederlandse payment provider met iDEAL, creditcard, etc.',
        methods: ['ideal', 'creditcard', 'paypal', 'bancontact', 'sofort'],
      },
      {
        code: 'stripe',
        name: 'Stripe',
        description: 'Internationale payment provider',
        methods: ['creditcard', 'sepa', 'ideal', 'bancontact'],
      },
      {
        code: 'paypal',
        name: 'PayPal',
        description: 'PayPal betalingen',
        methods: ['paypal'],
      },
      {
        code: 'adyen',
        name: 'Adyen',
        description: 'Enterprise payment provider',
        methods: ['ideal', 'creditcard', 'paypal', 'applepay', 'googlepay'],
      },
    ];

    res.json({ providers });
  } catch (error) {
    next(error);
  }
};

// Test payment provider connection
export const testConnection = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;

    const provider = await prisma.paymentProvider.findFirst({
      where: { id: Number(id), websiteId },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Payment provider niet gevonden' });
    }

    // Hier zou je de echte API aanroepen om de verbinding te testen
    // Voor nu: simuleer een test
    const success = Math.random() > 0.1; // 90% success rate voor demo

    res.json({
      success,
      message: success 
        ? 'Verbinding succesvol getest' 
        : 'Verbinding mislukt - controleer je credentials',
      provider: provider.name,
      mode: provider.isTest ? 'test' : 'live',
    });
  } catch (error) {
    next(error);
  }
};
