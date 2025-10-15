import { all, get } from '../db/db.js';

export async function applyQuantityDiscounts(db, items) {
  // items: [{product_id, qty, price_cents}]
  const result = [];
  for (const it of items) {
    const discounts = await all(
      db,
      `SELECT * FROM product_discounts WHERE product_id=$1 AND active=TRUE`,
      [it.product_id]
    );
    let price = it.price_cents;
    for (const d of discounts) {
      if (it.qty >= d.min_qty) {
        price = Math.round(price * (1 - d.percent / 100));
      }
    }
    result.push({ ...it, discounted_price_cents: price });
  }
  return result;
}

export function totalsWithCoupon(items, coupon) {
  // items: [{discounted_price_cents, qty}]
  const subtotal = items.reduce(
    (s, it) => s + it.discounted_price_cents * it.qty,
    0
  );
  let discount = 0;
  if (coupon) {
    if (coupon.kind === 'percent') {
      discount = Math.floor(subtotal * (coupon.value / 100));
    } else if (coupon.kind === 'fixed') {
      discount = Math.min(subtotal, coupon.value);
    }
  }
  const taxable = subtotal - discount;
  const tax = Math.floor(taxable * 0.19); // IVA 19% (demo)
  const total = taxable + tax;
  return { subtotal, discount, tax, total };
}
