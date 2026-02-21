import Order from '../models/Order.js';
import Medicine from '../models/Medicine.js';

export async function createOrder(req, res, next) {
  try {
    const { medicineId, customerName, customerEmail, customerPhone, quantity, notes } = req.body;
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

    const order = await Order.create({
      medicineId,
      customerName,
      customerEmail,
      customerPhone,
      quantity,
      notes,
    });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

export async function listOrders(_req, res, next) {
  try {
    const orders = await Order.find()
      .populate('medicineId', 'name category')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}
