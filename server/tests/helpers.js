import Admin from '../models/Admin.js';
import Medicine from '../models/Medicine.js';

export async function createTestAdmin({ email = 'admin@test.local', password = 'Passw0rd!23', role = 'super_admin' } = {}) {
  return Admin.create({ email, password, role });
}

export async function createTestMedicine(overrides = {}) {
  return Medicine.create({
    slug: overrides.slug || 'test-medicine',
    name: overrides.name || 'Test Medicine 100mg',
    category: overrides.category || 'Pain Relief',
    variants: overrides.variants || [
      { strength: '100 mg', form: 'Tablet', packSize: '1 x 10 tablets', packagingType: 'strip', price: 10, sku: 'T-1', stock: 5 },
    ],
    ...overrides,
  });
}
