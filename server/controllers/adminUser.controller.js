import { validationResult } from 'express-validator';
import Admin from '../models/Admin.js';

function forbidden(res) {
  return res.status(403).json({ error: 'Forbidden' });
}

const PASSWORD_RULES = [
  { test: (p) => p && p.length >= 8, message: 'Password must be at least 8 characters long' },
  { test: (p) => /[A-Z]/.test(p), message: 'Password must include at least one uppercase letter' },
  { test: (p) => /[a-z]/.test(p), message: 'Password must include at least one lowercase letter' },
  { test: (p) => /[0-9]/.test(p), message: 'Password must include at least one number' },
  { test: (p) => /[^A-Za-z0-9\s]/.test(p), message: 'Password must include at least one special character' },
  { test: (p) => /^\S+$/.test(p), message: 'Password cannot contain spaces' },
];

function validatePassword(password) {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return rule.message;
  }
  return null;
}

function getDefaultPermissions(role = 'admin') {
  const base = {
    dashboard: true,
    medicines: true,
    categories: true,
    inquiries: false,
    adminManagement: false,
  };
  if (role === 'super_admin') {
    return {
      dashboard: true,
      medicines: true,
      categories: true,
      inquiries: true,
      adminManagement: true,
    };
  }
  return base;
}

export async function listAdmins(_req, res, next) {
  try {
    const admins = await Admin.find().select('-password');
    res.json({ admins });
  } catch (error) {
    next(error);
  }
}

export async function createAdmin(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0]?.msg || 'Validation error' });
    }

    const { email = '', password = '' } = req.body || {};
    const normalizedEmail = email.toLowerCase().trim();

    const passwordError = validatePassword(password);
    if (!normalizedEmail || !password || passwordError) {
      return res.status(400).json({ error: passwordError || 'Email and password are required' });
    }

    const existing = await Admin.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: 'Unable to create admin' });
    }

    // Creation by super_admin only; force role to admin to avoid accidental super_admin duplication
    const admin = await Admin.create({ email: normalizedEmail, password, role: 'admin', permissions: getDefaultPermissions('admin') });
    res.status(201).json({ success: true, admin: { id: admin.id, email: admin.email, role: admin.role } });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const target = await Admin.findById(id);
    if (!target) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (target.role === 'super_admin') {
      return forbidden(res);
    }

    if (req.admin && req.admin.id === target.id) {
      return res.status(400).json({ error: 'Cannot delete the active super admin' });
    }

    await target.deleteOne();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function transferOwnership(req, res, next) {
  try {
    const { targetAdminId } = req.body || {};
    if (!targetAdminId) {
      return res.status(400).json({ error: 'Target admin is required' });
    }

    const target = await Admin.findById(targetAdminId);
    if (!target) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (target.id === req.admin.id) {
      return res.status(400).json({ error: 'Cannot transfer ownership to self' });
    }

    const session = await Admin.startSession();
    await session.withTransaction(async () => {
      await Admin.updateMany({ role: 'super_admin' }, { role: 'admin', permissions: getDefaultPermissions('admin') }, { session });
      await Admin.findByIdAndUpdate(targetAdminId, { role: 'super_admin', permissions: getDefaultPermissions('super_admin') }, { session });
    });
    session.endSession();

    res.json({ success: true, newOwner: { id: target.id, email: target.email, role: 'super_admin' } });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminRole(req, res, next) {
  try {
    const { id } = req.params;
    const target = await Admin.findById(id);
    if (!target) return res.status(404).json({ error: 'Admin not found' });

    const role = (req.body?.role || '').toLowerCase();
    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (target.id === req.admin.id && role !== 'super_admin') {
      return res.status(400).json({ error: 'Transfer ownership before demoting yourself.' });
    }

    if (role === 'super_admin') {
      const session = await Admin.startSession();
      await session.withTransaction(async () => {
        await Admin.updateMany({ role: 'super_admin' }, { role: 'admin', permissions: getDefaultPermissions('admin') }, { session });
        await Admin.findByIdAndUpdate(id, { role: 'super_admin', permissions: getDefaultPermissions('super_admin') }, { session });
      });
      session.endSession();
    } else {
      // role === 'admin'
      if (target.role === 'super_admin') {
        const superCount = await Admin.countDocuments({ role: 'super_admin' });
        if (superCount <= 1) {
          return res.status(400).json({ error: 'There must be at least one super admin.' });
        }
      }
      target.role = 'admin';
      target.permissions = getDefaultPermissions('admin');
      await target.save();
    }

    const updated = await Admin.findById(id).select('-password');
    res.json({ success: true, admin: updated });
  } catch (error) {
    next(error);
  }
}
