
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { getDb, all, get, run } from '../db/db.js';
import { applyQuantityDiscounts, totalsWithCoupon } from '../services/pricing.js';
import { validateCoupon } from '../services/coupons.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const db = getDb();
  try {
    const cartId = req.cookies['tc_cart'];
    const { email, coupon_code } = req.body;
    const items = await all(db, `SELECT ci.*, p.name, p.price_cents FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE cart_id=?`, [cartId]);
    const withDiscounts = await applyQuantityDiscounts(db, items.map(it => ({ product_id: it.product_id, qty: it.qty, price_cents: it.price_cents })));
    const merged = items.map((it, idx) => ({ ...it, discounted_price_cents: withDiscounts[idx].discounted_price_cents }));
    const coupon = await validateCoupon(db, coupon_code);
    const totals = totalsWithCoupon(merged, coupon);
    if (merged.length===0) return res.status(400).json({ error:'Carrito vacío' });
    const quoteId = uuidv4();
    const dir = path.join(process.cwd(), 'quotes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `Cotizacion-${quoteId}.pdf`);

    const doc = new PDFDocument({ size:'A4', margin:50 });
    const stream = fs.createWriteStream(file);
    doc.pipe(stream);
    doc.fontSize(18).text('TecnoClick - Cotización', { align:'center' });
    doc.moveDown().fontSize(12).text(`ID Cotización: ${quoteId}`);
    doc.text(`Fecha: ${new Date().toLocaleString()}`);
    doc.text(`Email: ${email}`);
    doc.moveDown().text('Items:');
    merged.forEach(it => {
      doc.text(`- ${it.name} x${it.qty} — ${formatCurrency(it.discounted_price_cents)} c/u`);
    });
    doc.moveDown();
    doc.text(`Subtotal: ${formatCurrency(totals.subtotal)}`);
    doc.text(`Descuento: -${formatCurrency(totals.discount)}`);
    doc.text(`IVA: ${formatCurrency(totals.tax)}`);
    doc.text(`TOTAL: ${formatCurrency(totals.total)}`);
    doc.moveDown().text('Válido por 7 días.');
    doc.end();
    await new Promise(resv => stream.on('finish', resv));

    const expiresAt = new Date(Date.now() + 7*24*3600*1000).toISOString();
    await run(db, `INSERT INTO quotes (id,cart_id,user_id,email,pdf_path,expires_at) VALUES (?,?,?,?,?,?)`,
      [quoteId, cartId, null, email, file, expiresAt]);
    res.json({ id: quoteId, pdf: file, expires_at: expiresAt });
  } catch(e) {
    res.status(500).json({ error:'Error' });
  } finally {
    db.close();
  }
});

function formatCurrency(cents) { return '$' + (cents/100).toFixed(2); }

export default router;
