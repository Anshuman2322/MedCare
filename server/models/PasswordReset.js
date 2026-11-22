import mongoose from 'mongoose';

// One row per admin with a password reset in flight. Kept out of the Admin
// document so OTP and token hashes can't leak through an admin query, and so
// abandoned resets clean themselves up via the TTL index below.
const passwordResetSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },

    otpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },

    // Per-account send throttling.
    lastSentAt: { type: Date },
    sendCount: { type: Number },
    sendWindowStartedAt: { type: Date },

    // Issued once the OTP is verified; authorises exactly one password change.
    resetTokenHash: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },

    // MongoDB deletes the row at this time. Always later than the throttle
    // window, so waiting for cleanup can't be used to reset the send quota early.
    purgeAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);
export default PasswordReset;
