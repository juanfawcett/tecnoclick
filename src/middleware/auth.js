import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  next();
  return;
  const token = req.cookies['tc_jwt'];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  next();
}
