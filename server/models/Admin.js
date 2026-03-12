import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin'],
      default: 'admin',
      trim: true,
    },
    permissions: {
      dashboard: { type: Boolean, default: true },
      medicines: { type: Boolean, default: true },
      categories: { type: Boolean, default: true },
      inquiries: { type: Boolean, default: false },
      adminManagement: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

adminSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    this.email = this.email?.toLowerCase().trim();

    // Avoid double-hashing if a hashed password is provided explicitly
    if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

adminSchema.pre('save', function enforcePermissions(next) {
  if (this.role === 'super_admin') {
    this.permissions = {
      dashboard: true,
      medicines: true,
      categories: true,
      inquiries: true,
      adminManagement: true,
    };
  }
  return next();
});

adminSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
