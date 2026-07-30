import { validationResult } from 'express-validator';
import Inquiry from '../models/Inquiry.js';
import mongoose from 'mongoose';
import { escapeRegex } from '../utils/sanitize.js';

const ALLOWED_STATUSES = ['new', 'contacted', 'closed'];

export async function listAdminInquiries(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ items: [], total: 0, page: 1, limit: 10, hasMore: false });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const status = (req.query.status || '').toLowerCase();
    const search = (req.query.search || '').trim().toLowerCase();
    const name = (req.query.name || '').trim();
    const email = (req.query.email || '').trim();
    const sortDirection = req.query.sort === 'asc' ? 1 : -1;

    const filter = {};
    if (ALLOWED_STATUSES.includes(status)) {
      filter.status = status;
    }

    if (search) {
      const pattern = escapeRegex(search);
      filter.$or = [
        { email: { $regex: pattern, $options: 'i' } },
        { customerName: { $regex: pattern, $options: 'i' } },
        { firstName: { $regex: pattern, $options: 'i' } },
        { lastName: { $regex: pattern, $options: 'i' } },
      ];
    }

    if (name) {
      const pattern = escapeRegex(name);
      filter.$or = filter.$or || [];
      filter.$or.push(
        { customerName: { $regex: pattern, $options: 'i' } },
        { firstName: { $regex: pattern, $options: 'i' } },
        { lastName: { $regex: pattern, $options: 'i' } }
      );
    }

    if (email) {
      filter.email = { $regex: escapeRegex(email), $options: 'i' };
    }

    const total = await Inquiry.countDocuments(filter);
    const inquiries = await Inquiry.find(filter)
      .sort({ createdAt: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ items: inquiries, total, page, limit, hasMore: page * limit < total });
  } catch (error) {
    next(error);
  }
}

export async function updateInquiryStatus(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const status = (req.body.status || '').toLowerCase();
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    inquiry.status = status;
    await inquiry.save();

    res.json({
      success: true,
      inquiry,
    });
  } catch (error) {
    next(error);
  }
}
