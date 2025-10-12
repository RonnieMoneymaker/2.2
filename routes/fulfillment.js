const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const dhlService = require('../services/dhlService');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Create DHL shipping label for single order
router.post('/orders/:orderId/create-label', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const orderId = req.params.orderId;
    const options = req.body;

    const result = await dhlService.createShippingLabel(orderId, options);

    res.json({
      success: true,
      message: 'DHL label succesvol aangemaakt en klant geïnformeerd',
      tracking_number: result.trackingNumber,
      label_url: result.labelUrl,
      estimated_delivery: result.estimatedDelivery
    });
  } catch (error) {
    console.error('Error creating DHL label:', error);
    res.status(500).json({
      success: false,
      error: 'DHL label aanmaken mislukt',
      message: error.message
    });
  }
});

// Backward-compatibility alias used by tests
router.post('/create-dhl-label', async (req, res) => {
  try {
    const { order_id, ...options } = req.body || {};
    if (!order_id) return res.status(400).json({ error: 'order_id is verplicht' });
    const result = await dhlService.createShippingLabel(order_id, options);
    res.json({ success: true, tracking_number: result.trackingNumber, label_url: result.labelUrl });
  } catch (error) {
    res.status(500).json({ error: 'DHL label aanmaken mislukt', message: error.message });
  }
});
// Create bulk DHL shipping labels
router.post('/orders/bulk/create-labels', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { order_ids, ...options } = req.body;

    const results = await dhlService.createBulkShippingLabels(order_ids, options);

    res.json({
      success: true,
      message: `Bulk labels verwerkt: ${results.successful.length} succesvol, ${results.failed.length} mislukt`,
      results
    });
  } catch (error) {
    console.error('Error creating bulk DHL labels:', error);
    res.status(500).json({
      success: false,
      error: 'Bulk DHL labels aanmaken mislukt',
      message: error.message
    });
  }
});

// Generate packing slip data for order (JSON)
router.get('/orders/:orderId/packing-slip', async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Get order with items
    db.get(`
      SELECT o.*, c.first_name, c.last_name, c.email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [orderId], (err, order) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout' });
      }

      if (!order) {
        return res.status(404).json({ error: 'Bestelling niet gevonden' });
      }

      // Get order items
      db.all(`
        SELECT * FROM order_items WHERE order_id = ?
      `, [orderId], (err, items) => {
        if (err) {
          return res.status(500).json({ error: 'Database fout bij ophalen items' });
        }

        // Generate packing slip data
        const packingSlipData = dhlService.generatePackingSlip(order, items);

        res.json({
          success: true,
          packing_slip: packingSlipData
        });
      });
    });
  } catch (error) {
    console.error('Error generating packing slip:', error);
    res.status(500).json({
      success: false,
      error: 'Pakbon genereren mislukt',
      message: error.message
    });
  }
});

// Generate bulk packing slips PDF
router.post('/orders/bulk/packing-slips', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { order_ids } = req.body;
    
    // Create PDF document
    const doc = new PDFDocument();
    const filename = `pakbonnen_${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '../temp', filename);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(filepath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    doc.pipe(fs.createWriteStream(filepath));

    // Process each order
    for (let i = 0; i < order_ids.length; i++) {
      const orderId = order_ids[i];
      
      try {
        const order = await new Promise((resolve, reject) => {
          db.get(`
            SELECT o.*, c.first_name, c.last_name, c.email
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
          `, [orderId], (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });

        const items = await new Promise((resolve, reject) => {
          db.all(`
            SELECT * FROM order_items WHERE order_id = ?
          `, [orderId], (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });

        if (order) {
          // Add page break for subsequent orders
          if (i > 0) {
            doc.addPage();
          }

          // Generate packing slip content
          generatePackingSlipPDF(doc, order, items);
        }
      } catch (error) {
        console.error(`Error processing order ${orderId}:`, error);
      }
    }

    doc.end();

    // Wait for PDF to be written
    doc.on('end', () => {
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ error: 'Download mislukt' });
        }
        
        // Clean up temp file after download
        setTimeout(() => {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }, 5000);
      });
    });

  } catch (error) {
    console.error('Error generating bulk packing slips:', error);
    res.status(500).json({
      success: false,
      error: 'Bulk pakbonnen genereren mislukt',
      message: error.message
    });
  }
});

// Helper function to generate PDF content for packing slip
function generatePackingSlipPDF(doc, order, items) {
  const pageWidth = doc.page.width;
  const margin = 50;
  
  // Header
  doc.fontSize(20).text('PAKBON', margin, margin);
  doc.fontSize(12).text(`Bestelnummer: ${order.order_number}`, margin, margin + 40);
  doc.text(`Datum: ${new Date(order.order_date).toLocaleDateString('nl-NL')}`, margin, margin + 60);

  // Customer info
  doc.fontSize(14).text('Verzendadres:', margin, margin + 100);
  doc.fontSize(12).text(`${order.first_name} ${order.last_name}`, margin, margin + 120);
  doc.text(`${order.shipping_address}`, margin, margin + 140);

  // Items table
  let yPos = margin + 180;
  doc.fontSize(14).text('Bestelde items:', margin, yPos);
  yPos += 30;

  // Table headers
  doc.fontSize(10);
  doc.text('Product', margin, yPos);
  doc.text('SKU', margin + 200, yPos);
  doc.text('Aantal', margin + 300, yPos);
  doc.text('Prijs', margin + 350, yPos);
  doc.text('Totaal', margin + 400, yPos);
  
  yPos += 20;
  doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).stroke();
  yPos += 10;

  // Items
  items.forEach(item => {
    doc.text(item.product_name, margin, yPos);
    doc.text(item.product_sku || '-', margin + 200, yPos);
    doc.text(item.quantity.toString(), margin + 300, yPos);
    doc.text(`€${item.unit_price.toFixed(2)}`, margin + 350, yPos);
    doc.text(`€${item.total_price.toFixed(2)}`, margin + 400, yPos);
    yPos += 15;
  });

  // Totals
  yPos += 20;
  doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).stroke();
  yPos += 15;
  
  doc.fontSize(12);
  doc.text(`Subtotaal: €${order.total_amount.toFixed(2)}`, margin + 300, yPos);
  yPos += 15;
  doc.text(`BTW (21%): €${(order.total_amount * 0.21).toFixed(2)}`, margin + 300, yPos);
  yPos += 15;
  doc.text(`Verzendkosten: €5.95`, margin + 300, yPos);
  yPos += 15;
  doc.fontSize(14).text(`TOTAAL: €${(order.total_amount + (order.total_amount * 0.21) + 5.95).toFixed(2)}`, margin + 300, yPos);

  // Footer
  yPos += 50;
  doc.fontSize(10).text('Bedankt voor je bestelling!', margin, yPos);
  doc.text(`Gegenereerd op: ${new Date().toLocaleString('nl-NL')}`, margin, yPos + 20);
}

// Generate single packing slip PDF (download)
router.get('/orders/:orderId/packing-slip.pdf', async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Fetch order and items
    const order = await new Promise((resolve, reject) => {
      db.get(`
        SELECT o.*, c.first_name, c.last_name, c.email
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
      `, [orderId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (!order) {
      return res.status(404).json({ error: 'Bestelling niet gevonden' });
    }

    const items = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM order_items WHERE order_id = ?
      `, [orderId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const doc = new PDFDocument();
    const filename = `pakbon_${order.order_number || orderId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
    generatePackingSlipPDF(doc, order, items);
    doc.end();
  } catch (error) {
    console.error('Error generating single packing slip PDF:', error);
    res.status(500).json({ error: 'Pakbon PDF genereren mislukt' });
  }
});

// Get tracking information
router.get('/tracking/:trackingNumber', async (req, res) => {
  try {
    const trackingNumber = req.params.trackingNumber;
    const trackingInfo = await dhlService.getTrackingInfo(trackingNumber);

    res.json({
      success: true,
      tracking: trackingInfo
    });
  } catch (error) {
    console.error('Error getting tracking info:', error);
    res.status(500).json({
      success: false,
      error: 'Tracking info ophalen mislukt',
      message: error.message
    });
  }
});

// Get all shipping labels for order
router.get('/orders/:orderId/shipping-info', (req, res) => {
  const orderId = req.params.orderId;

  db.all(`
    SELECT * FROM shipping_tracking 
    WHERE order_id = ? 
    ORDER BY created_at DESC
  `, [orderId], (err, trackingInfo) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout' });
    }

    res.json({
      success: true,
      shipping_info: trackingInfo
    });
  });
});

module.exports = router;
