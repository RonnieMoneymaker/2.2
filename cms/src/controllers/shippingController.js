import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

// Get all shipping rates
export const getShippingRates = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { carrier, country, isActive } = req.query;

    const where = {
      websiteId,
      ...(carrier && { carrier }),
      ...(country && { country }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    const rates = await prisma.shippingRate.findMany({
      where,
      orderBy: [{ carrier: 'asc' }, { country: 'asc' }],
    });

    res.json({ rates });
  } catch (error) {
    next(error);
  }
};

// Calculate shipping cost
export const calculateShipping = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { country, weightGrams, carrier } = req.body;

    if (!country || !weightGrams) {
      return res.status(400).json({ error: 'Land en gewicht zijn verplicht' });
    }

    const where = {
      websiteId,
      country,
      isActive: true,
      ...(carrier && { carrier }),
    };

    // Find matching rates
    const rates = await prisma.shippingRate.findMany({
      where: {
        ...where,
        OR: [
          {
            AND: [
              { minWeightGrams: { lte: weightGrams } },
              { maxWeightGrams: { gte: weightGrams } },
            ],
          },
          {
            AND: [
              { minWeightGrams: { lte: weightGrams } },
              { maxWeightGrams: null },
            ],
          },
          {
            AND: [
              { minWeightGrams: null },
              { maxWeightGrams: { gte: weightGrams } },
            ],
          },
          {
            AND: [
              { minWeightGrams: null },
              { maxWeightGrams: null },
            ],
          },
        ],
      },
      orderBy: { priceCents: 'asc' },
    });

    if (rates.length === 0) {
      return res.status(404).json({ 
        error: 'Geen verzendoptie gevonden voor deze bestemming en gewicht' 
      });
    }

    // Calculate shipping costs
    const options = rates.map(rate => {
      const weightKg = weightGrams / 1000;
      const basePrice = rate.priceCents;
      const weightPrice = rate.pricePerKgCents * weightKg;
      const totalPrice = Math.ceil(basePrice + weightPrice);

      return {
        id: rate.id,
        carrier: rate.carrier,
        serviceName: rate.serviceName,
        priceCents: totalPrice,
        deliveryDays: rate.deliveryDays,
      };
    });

    res.json({ options });
  } catch (error) {
    next(error);
  }
};

// Create shipping rate
export const createShippingRate = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const data = req.body;

    const rate = await prisma.shippingRate.create({
      data: {
        ...data,
        websiteId,
      },
    });

    res.status(201).json(rate);
  } catch (error) {
    next(error);
  }
};

// Update shipping rate
export const updateShippingRate = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;
    const data = req.body;

    const rate = await prisma.shippingRate.findFirst({
      where: { id: Number(id), websiteId },
    });

    if (!rate) {
      return res.status(404).json({ error: 'Verzendtarief niet gevonden' });
    }

    const updated = await prisma.shippingRate.update({
      where: { id: Number(id) },
      data,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Delete shipping rate
export const deleteShippingRate = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;

    const rate = await prisma.shippingRate.findFirst({
      where: { id: Number(id), websiteId },
    });

    if (!rate) {
      return res.status(404).json({ error: 'Verzendtarief niet gevonden' });
    }

    await prisma.shippingRate.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Verzendtarief succesvol verwijderd' });
  } catch (error) {
    next(error);
  }
};

// Get supported carriers
export const getCarriers = async (req, res, next) => {
  try {
    const carriers = [
      { code: 'postnl', name: 'PostNL', countries: ['NL', 'BE', 'DE'] },
      { code: 'dhl', name: 'DHL', countries: ['*'] },
      { code: 'dpd', name: 'DPD', countries: ['*'] },
      { code: 'ups', name: 'UPS', countries: ['*'] },
      { code: 'fedex', name: 'FedEx', countries: ['*'] },
      { code: 'gls', name: 'GLS', countries: ['NL', 'BE', 'DE'] },
    ];

    res.json({ carriers });
  } catch (error) {
    next(error);
  }
};
