import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

function unauthorized(res) {
  return res.status(401).json({ error: 'Not authorized' });
}

export async function protectAdmin(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return unauthorized(res);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return unauthorized(res);
    }

    req.admin = admin;
    next();
  } catch (_err) {
    return unauthorized(res);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

export function requirePermission(permissionKey) {
  return (req, res, next) => {
    if (!req.admin) return res.status(401).json({ error: 'Not authorized' });
    if (req.admin.role === 'super_admin') return next();
    if (!req.admin.permissions || req.admin.permissions[permissionKey] !== true) {
      return res.status(403).json({ error: 'Access denied' });
    }
    return next();
  };
}
