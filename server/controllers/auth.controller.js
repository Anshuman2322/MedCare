import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Admin from '../models/Admin.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function parseDurationMs(value, fallback = ONE_DAY_MS) {
  if (!value) return fallback;
  const match = /^([0-9]+)([smhd])$/i.exec(value.trim());
  if (!match) return fallback;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const map = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * (map[unit] || 1) || fallback;
}

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = parseDurationMs(process.env.JWT_EXPIRES, ONE_DAY_MS);

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge,
    path: '/',
  };
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0]?.msg || 'Validation error' });
  }
  return null;
}

function signToken(id, role) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES || '1d';
  if (!secret) {
    throw new Error('JWT_SECRET missing in environment');
  }
  return jwt.sign({ id, role }, secret, { expiresIn });
}

function getFallbackAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@cureneed.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';

  return {
    id: email,
    email,
    password,
    role: 'super_admin',
  };
}

async function matchesFallbackPassword(candidate, expected) {
  if (!expected) return false;

  if (expected.startsWith('$2a$') || expected.startsWith('$2b$')) {
    return bcrypt.compare(candidate, expected);
  }

  return candidate === expected;
}

export async function registerAdmin(req, res, next) {
  try {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const totalAdmins = await Admin.countDocuments();
    const token = req.cookies?.token;
    let requester = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        requester = await Admin.findById(decoded.id).select('-password');
      } catch (_err) {
        requester = null;
      }
    }

    if (totalAdmins > 0) {
      if (!requester || requester.role !== 'super_admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const email = req.body.email.toLowerCase().trim();
    const { password } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Unable to register admin' });
    }

    const role = totalAdmins === 0 ? 'super_admin' : 'admin';
    await Admin.create({ email, password, role });

    res.status(201).json({ success: true, message: 'Admin registered successfully' });
  } catch (error) {
    next(error);
  }
}

export async function loginAdmin(req, res, next) {
  try {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const email = req.body.email.toLowerCase().trim();
    const { password } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const fallbackAdmin = getFallbackAdmin();
      if (email !== fallbackAdmin.email) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isMatch = await matchesFallbackPassword(password, fallbackAdmin.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = signToken(fallbackAdmin.id, fallbackAdmin.role);
      res.cookie('token', token, cookieOptions());

      return res.json({
        success: true,
        admin: {
          id: fallbackAdmin.id,
          email: fallbackAdmin.email,
          role: fallbackAdmin.role,
        },
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(admin.id, admin.role);
    res.cookie('token', token, cookieOptions());

    res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

export function logoutAdmin(_req, res) {
  res.clearCookie('token', cookieOptions());
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function getCurrentAdmin(req, res) {
  if (!req.admin) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  res.json({
    success: true,
    admin: {
      id: req.admin.id,
      email: req.admin.email,
      role: req.admin.role,
    },
  });
}

export async function bootstrapSuperAdmin(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.status(403).json({ error: 'Super admin already initialized' });
    }

    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'super_admin',
    });

    return res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      admin: { id: admin._id, email: admin.email, role: admin.role },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}
