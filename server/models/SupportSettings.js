import mongoose from 'mongoose';

// Live-chat settings the team controls from the admin Support Chat page. One
// document (key 'live-chat'); until it exists the defaults below apply.
export const LIVE_CHAT_DEFAULTS = {
  available: true,
  waitText: '5–10 minutes',
  agentName: '',
};

const KEY = 'live-chat';

const supportSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: KEY },
    // Online: customers asked to wait for an expert are told the usual wait.
    // Away: they're told the team will reply here and by email when back.
    available: { type: Boolean, default: LIVE_CHAT_DEFAULTS.available },
    // Shown to customers, e.g. "an expert will join within 5–10 minutes".
    waitText: { type: String, default: LIVE_CHAT_DEFAULTS.waitText, trim: true, maxlength: 40 },
    // Name shown above the team's replies; empty means "CureNeed Support".
    agentName: { type: String, default: LIVE_CHAT_DEFAULTS.agentName, trim: true, maxlength: 40 },
    // The starter quick replies are added once; deleting them all is respected.
    quickRepliesSeeded: { type: Boolean, default: false },
    updatedBy: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

supportSettingsSchema.statics.current = async function current() {
  const saved = await this.findOne({ key: KEY }).lean();
  return {
    available: saved?.available ?? LIVE_CHAT_DEFAULTS.available,
    waitText: saved?.waitText || LIVE_CHAT_DEFAULTS.waitText,
    agentName: saved?.agentName || LIVE_CHAT_DEFAULTS.agentName,
    quickRepliesSeeded: Boolean(saved?.quickRepliesSeeded),
    updatedAt: saved?.updatedAt || null,
  };
};

// True for exactly one caller, ever: the one that gets to add the starter
// quick replies. Two admin tabs loading at once can't both add them.
supportSettingsSchema.statics.claimQuickReplySeed = async function claimQuickReplySeed() {
  try {
    await this.findOneAndUpdate(
      { key: KEY, quickRepliesSeeded: { $ne: true } },
      { $set: { quickRepliesSeeded: true } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    return true;
  } catch (error) {
    // Already claimed: the upsert collides with the existing settings document.
    if (error?.code === 11000) return false;
    throw error;
  }
};

supportSettingsSchema.statics.change = function change(update) {
  return this.findOneAndUpdate({ key: KEY }, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
};

export default mongoose.model('SupportSettings', supportSettingsSchema);
