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
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

const MAX_FAILED_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS) || 5;
const LOCK_DURATION_MS = (Number(process.env.LOGIN_LOCKOUT_MINUTES) || 15) * 60 * 1000;

adminSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

adminSchema.methods.registerFailedLogin = async function registerFailedLogin() {
  if (this.lockUntil && this.lockUntil.getTime() <= Date.now()) {
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
  }

  this.failedLoginAttempts += 1;

  if (this.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }

  await this.save();
};

adminSchema.methods.registerSuccessfulLogin = async function registerSuccessfulLogin() {
  if (this.failedLoginAttempts > 0 || this.lockUntil) {
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
    await this.save();
  }
};

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

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const salt = await bcrypt.genSalt(saltRounds);
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
