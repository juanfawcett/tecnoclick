import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { all, get, run } from '../db/db.js';

export async function generateInvoice(db, orderId) {
  const order = await get(db, `SELECT * FROM orders WHERE id=$1`, [orderId]);
  const items = await all(db, `SELECT * FROM order_items WHERE order_id=$1`, [
    orderId,
  ]);
  const invoiceDir = path.join(process.cwd(), 'invoices');
  if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });
  const filename = path.join(invoiceDir, `Factura-${orderId}.pdf`);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filename);
  doc.pipe(stream);

  doc
    .fontSize(18)
    .text('TecnoClick - Factura electrónica (simulada)', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Orden: ${orderId}`);
  doc.text(`Fecha: ${new Date().toLocaleString()}`);
  doc.text(`Cliente: ${order.email || 'Invitado'}`);
  doc.moveDown();
  doc.text('Detalle:');
  items.forEach((it) => {
    doc.text(
      `- ${it.name_snapshot} x${it.qty} — ${formatCurrency(
        it.price_cents_snapshot
      )} c/u`
    );
  });
  doc.moveDown();
  doc.text(`Subtotal: ${formatCurrency(order.subtotal_cents)}`);
  doc.text(`Descuento: -${formatCurrency(order.discount_cents)}`);
  doc.text(`IVA (19%): ${formatCurrency(order.tax_cents)}`);
  doc.text(`TOTAL: ${formatCurrency(order.total_cents)}`);
  doc.moveDown();
  doc.text('** Documento simulado para fines de demo. **', { align: 'center' });

  doc.end();
  await new Promise((res) => stream.on('finish', res));

  await run(db, `INSERT INTO invoices (order_id, pdf_path) VALUES ($1,$2)`, [
    orderId,
    filename,
  ]);
  return filename;
}

function formatCurrency(cents) {
  return '$' + (cents / 100).toFixed(2);
}
