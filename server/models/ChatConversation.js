import mongoose from 'mongoose';

const chatConversationSchema = new mongoose.Schema(
  {
    // Opaque per-visitor secret. The public chat endpoints authorise on this
    // alone, so it is never returned in admin payloads.
    sessionToken: { type: String, required: true, unique: true, index: true, select: false },
    status: { type: String, enum: ['active', 'waiting', 'closed'], default: 'active', index: true },
    visitor: {
      name: { type: String, default: '', trim: true },
      email: { type: String, default: '', trim: true, lowercase: true },
      phone: { type: String, default: '', trim: true },
    },
    productContext: {
      slug: { type: String, default: '', trim: true },
      name: { type: String, default: '', trim: true },
    },
    inquiryRefs: [{ type: String, trim: true }],
    handoffRequested: { type: Boolean, default: false, index: true },
    // Live-chat timing: when the visitor asked for the team, when the team
    // first replied, and when the "still waiting" reassurance was sent.
    handoffAt: { type: Date, default: null },
    firstAgentReplyAt: { type: Date, default: null },
    waitUpdateAt: { type: Date, default: null },
    // Last time the visitor's widget was in touch (any request). A team reply
    // to a visitor who has left the site is also emailed to them.
    visitorSeenAt: { type: Date, default: null },
    unreadForAdmin: { type: Number, default: 0, min: 0 },
    lastMessagePreview: { type: String, default: '', trim: true },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    // Free-text slot the assistant is waiting to fill, e.g. 'medicine_name'.
    awaiting: { type: String, default: '', trim: true },
    // The assistant's short-term memory: the product being discussed, what a
    // bare "yes" would accept (offer.kind: 'quote' | 'handoff'), how many
    // replies in a row missed, and the turn count (varies the wording).
    context: {
      lastMedicineSlug: { type: String, default: '', trim: true },
      offer: {
        kind: { type: String, default: '' },
        slug: { type: String, default: '' },
        // A quantity the visitor mentioned ("50 boxes"), carried into the quote form.
        quantity: { type: Number, default: 0 },
      },
      misses: { type: Number, default: 0 },
      turns: { type: Number, default: 0 },
      // Products last shown as a list, so "what's the price?" can ask "which one?".
      options: [{ type: String }],
    },
  },
  { timestamps: true }
);

// Admin queue filters by status and always sorts by most recent activity.
chatConversationSchema.index({ status: 1, lastMessageAt: -1 });

export default mongoose.model('ChatConversation', chatConversationSchema);
