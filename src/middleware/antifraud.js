
// Estrategia antifraude muy básica: suma puntos y decide si requiere revisión manual
export function riskScore(order) {
  let score = 0;
  const total = order.total_cents || 0;
  if (total > 5000000) score += 30;      // > $50,000 COP
  if (total > 10000000) score += 60;     // > $100,000 COP
  if (!order.user_id) score += 10;       // invitado
  if (order.billing && order.shipping && order.billing.country && order.shipping.country && order.billing.country !== order.shipping.country) {
    score += 20;
  }
  if (order.items) {
    const highQty = order.items.some(i => i.qty > 3);
    if (highQty) score += 10;
  }
  return score;
}

export function antifraudCheck(req, res, next) {
  const orderDraft = req.body || {};
  const score = riskScore(orderDraft);
  req.antifraud = { score, decision: score >= 60 ? 'reject' : score >= 40 ? 'review' : 'accept' };
  next();
}
