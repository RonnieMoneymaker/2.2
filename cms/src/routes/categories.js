import { Router } from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();
const router = Router();

// List categories
router.get('/', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const categories = await prisma.category.findMany({
      where: { websiteId },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }]
    });
    res.json({ categories });
  } catch (e) {
    next(e);
  }
});

// Create category
router.post('/', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { name, slug, parentId } = req.body;
    const category = await prisma.category.create({
      data: { websiteId, name, slug, parentId: parentId ?? null }
    });
    res.status(201).json({ category });
  } catch (e) {
    next(e);
  }
});

// Update category
router.put('/:id', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id, 10);
    const exists = await prisma.category.findFirst({ where: { id, websiteId } });
    if (!exists) return res.status(404).json({ error: 'Categorie niet gevonden' });
    const category = await prisma.category.update({ where: { id }, data: req.body });
    res.json({ category });
  } catch (e) {
    next(e);
  }
});

// Delete category
router.delete('/:id', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id, 10);
    const exists = await prisma.category.findFirst({ where: { id, websiteId } });
    if (!exists) return res.status(404).json({ error: 'Categorie niet gevonden' });
    await prisma.category.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;


