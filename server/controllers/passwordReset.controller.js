import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import PasswordReset from '../models/PasswordReset.js';
import { logger } from '../config/logger.js';
import { isEmailConfigured, sendEmailTo } from '../utils/sendEmail.js';
import { passwordChangedEmail, resetCodeEmail } from '../utils/passwordResetEmails.js';
import { clearSessionCookie, handleValidation } from './auth.controller.js';

const OTP_TTL_SECONDS = 10 * 60;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const RESET_TOKEN_TTL_SECONDS = 10 * 60;
const DELIVERY_FAILURE_HOLD_MS = 2 * 60 * 1000;

// The server enforces slightly less than the cooldown it advertises, so a
// client that waits out its full timer is never silently throttled by latency.
const ENFORCED_COOLDOWN_MS = (RESEND_COOLDOWN_SECONDS - 5) * 1000;

const GENERIC_REQUEST_MESSAGE = 'If an admin account exists for that email, a verification code has been sent.';
const INVALID_CODE_MESSAGE = 'That code is incorrect or has expired.';
const SESSION_EXPIRED = {
  error: 'Your reset session has expired. Please request a new code.',
  code: 'RESET_SESSION_EXPIRED',
};

// Each request is answered before its email is attempted, so the request that
// discovers an outage can't be told. Later ones can: for a short while after a
// failure, every email gets an honest 503 instead of "a code has been sent".
let lastDeliveryFailureAt = 0;

function isDeliveryImpaired() {
  return Date.now() - lastDeliveryFailureAt < DELIVERY_FAILURE_HOLD_MS;
}

function serviceUnavailable(res) {
  return res.status(503).json({ error: 'Password reset is temporarily unavailable. Please try again shortly.' });
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

// HMAC rather than bcrypt: a 6-digit code has too little entropy for slow
// hashing to help, whereas a server-side key makes a leaked database row useless
// for brute-forcing it offline. The email is bound in so a hash can't be moved
// between accounts.
function hashOtp(email, otp) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(`password-reset-otp:${email}:${otp}`).digest('hex');
}

function otpMatches(storedHash, email, otp) {
  const stored = Buffer.from(storedHash, 'hex');
  const candidate = Buffer.from(hashOtp(email, otp), 'hex');
  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
}

// A reset token is 256 bits of randomness, so a plain fast hash is sufficient.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueResetCode(email) {
  const admin = await Admin.findOne({ email }).select('_id email');
  if (!admin) return;

  const now = Date.now();
  const otp = generateOtp();
  const otpHash = hashOtp(email, otp);

  await PasswordReset.updateOne(
    { email, sendWindowStartedAt: { $lte: new Date(now - SEND_WINDOW_MS) } },
    { $set: { sendCount: 0, sendWindowStartedAt: new Date(now) } }
  );

  try {
    // Throttle check and write are one atomic operation so concurrent requests
    // can't slip past the quota. When a row exists but the throttle filter
    // doesn't match it, the upsert collides on the unique email: that's the
    // "throttled" signal.
    await PasswordReset.findOneAndUpdate(
      {
        email,
        lastSentAt: { $lte: new Date(now - ENFORCED_COOLDOWN_MS) },
        sendCount: { $lt: MAX_SENDS_PER_WINDOW },
      },
      {
        $set: {
          admin: admin._id,
          otpHash,
          otpExpiresAt: new Date(now + OTP_TTL_SECONDS * 1000),
          attempts: 0,
          lastSentAt: new Date(now),
          resetTokenHash: null,
          resetTokenExpiresAt: null,
          purgeAt: new Date(now + SEND_WINDOW_MS),
        },
        $inc: { sendCount: 1 },
        $setOnInsert: { sendWindowStartedAt: new Date(now) },
      },
      { upsert: true }
    );
  } catch (error) {
    if (error.code === 11000) {
      logger.info({ adminId: admin.id }, '[PasswordReset] Code request throttled');
      return;
    }
    throw error;
  }

  try {
    await sendEmailTo({
      to: admin.email,
      ...resetCodeEmail({ otp, expiresInMinutes: OTP_TTL_SECONDS / 60 }),
    });
  } catch (error) {
    // The code reached nobody: withdraw it and hand back the quota, so an outage
    // or unfinished DNS setup can't use up the account's hourly limit.
    await PasswordReset.updateOne(
      { email, otpHash },
      { $set: { otpHash: null, otpExpiresAt: null, lastSentAt: new Date(0) }, $inc: { sendCount: -1 } }
    );
    throw error;
  }
  // Accepted by the provider, which is not the same as delivered to the inbox.
  logger.info({ adminId: admin.id }, '[PasswordReset] Code accepted by email provider');
}

export async function forgotPassword(req, res) {
  if (handleValidation(req, res)) return;

  // These two checks don't depend on the submitted email, so failing here
  // reveals nothing about which accounts exist.
  if (!isDatabaseReady() || isDeliveryImpaired()) return serviceUnavailable(res);
  if (!isEmailConfigured()) {
    logger.error('[PasswordReset] RESEND_API_KEY is not configured; cannot send reset codes');
    return serviceUnavailable(res);
  }

  // Respond before doing any account-dependent work: the same body and the same
  // timing for every email means this endpoint can't be used to discover admins.
  res.json({
    success: true,
    message: GENERIC_REQUEST_MESSAGE,
    expiresInSeconds: OTP_TTL_SECONDS,
    resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
  });

  const email = req.body.email.toLowerCase().trim();
  issueResetCode(email).catch((error) => {
    lastDeliveryFailureAt = Date.now();
    logger.error({ err: error }, '[PasswordReset] Failed to issue reset code');
  });
}

export async function verifyResetOtp(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    if (!isDatabaseReady()) return serviceUnavailable(res);

    const email = req.body.email.toLowerCase().trim();
    const { otp } = req.body;
    const now = Date.now();

    // Spend an attempt atomically before comparing, so parallel guesses can't
    // exceed the limit. Failures are deliberately indistinguishable: wrong code,
    // expired code, exhausted attempts and unknown email all look the same.
    const record = await PasswordReset.findOneAndUpdate(
      {
        email,
        otpHash: { $ne: null },
        otpExpiresAt: { $gt: new Date(now) },
        attempts: { $lt: MAX_OTP_ATTEMPTS },
      },
      { $inc: { attempts: 1 } },
      { new: true }
    );

    if (!record || !otpMatches(record.otpHash, email, otp)) {
      return res.status(400).json({ error: INVALID_CODE_MESSAGE });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    // Filtering on the hash makes the code single-use even under concurrent submits.
    const consumed = await PasswordReset.findOneAndUpdate(
      { _id: record._id, otpHash: record.otpHash },
      {
        $set: {
          otpHash: null,
          otpExpiresAt: null,
          resetTokenHash: hashToken(resetToken),
          resetTokenExpiresAt: new Date(now + RESET_TOKEN_TTL_SECONDS * 1000),
        },
      }
    );

    if (!consumed) {
      return res.status(400).json({ error: INVALID_CODE_MESSAGE });
    }

    return res.json({ success: true, resetToken, expiresInSeconds: RESET_TOKEN_TTL_SECONDS });
  } catch (error) {
    return next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    if (!isDatabaseReady()) return serviceUnavailable(res);

    const { resetToken, password } = req.body;
    const tokenHash = hashToken(resetToken);

    const record = await PasswordReset.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { $gt: new Date() },
    });
    if (!record) return res.status(400).json(SESSION_EXPIRED);

    const admin = await Admin.findById(record.admin);
    if (!admin) {
      await record.deleteOne();
      return res.status(400).json(SESSION_EXPIRED);
    }

    // Checked before the token is consumed so the user can simply pick another.
    if (await bcrypt.compare(password, admin.password)) {
      return res.status(400).json({ error: 'New password must be different from your current password.' });
    }

    const consumed = await PasswordReset.findOneAndDelete({ _id: record._id, resetTokenHash: tokenHash });
    if (!consumed) return res.status(400).json(SESSION_EXPIRED);

    admin.password = password;
    admin.tokenVersion = (admin.tokenVersion || 0) + 1; // signs out every existing session
    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;
    await admin.save();

    logger.info({ adminId: admin.id }, '[PasswordReset] Password changed');

    clearSessionCookie(res);
    res.json({ success: true, message: 'Your password has been updated.' });

    sendEmailTo({ to: admin.email, ...passwordChangedEmail({ changedAt: new Date() }) }).catch((error) => {
      logger.error({ err: error }, '[PasswordReset] Failed to send password-changed notice');
    });
    return undefined;
  } catch (error) {
    return next(error);
  }
}
