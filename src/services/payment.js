export function initMockPayment({ order_id, amount_cents, method }) {
  const base = process.env.FRONT_URL || 'http://localhost:5173';
  const url = `${base}/mockpay/index.html?order_id=${encodeURIComponent(
    order_id
  )}&amount=${amount_cents}&method=${encodeURIComponent(method)}`;
  return { redirect_url: url };
}
