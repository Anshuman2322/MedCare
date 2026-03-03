import { validationResult } from 'express-validator';
import Inquiry from '../models/Inquiry.js';

const ALLOWED_STATUSES = ['new', 'contacted', 'closed'];

export async function listAdminInquiries(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const status = (req.query.status || '').toLowerCase();
    const search = (req.query.search || '').trim().toLowerCase();
    const sortDirection = req.query.sort === 'asc' ? 1 : -1;

    const filter = {};
    if (ALLOWED_STATUSES.includes(status)) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Inquiry.countDocuments(filter);
    const inquiries = await Inquiry.find(filter)
      .sort({ createdAt: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit);

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
