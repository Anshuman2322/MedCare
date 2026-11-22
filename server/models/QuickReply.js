import mongoose from 'mongoose';

// Saved replies the team inserts into a support chat with one click.
// Placeholders {name}, {email} and {product} are filled in by the admin panel
// from the conversation before the reply is sent.
const quickReplySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 40 },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    order: { type: Number, default: 0 },
    createdBy: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

quickReplySchema.index({ order: 1, createdAt: 1 });

export const STARTER_QUICK_REPLIES = [
  { title: 'Welcome', text: "Hi {name}, thanks for waiting! I'm from the CureNeed team. How can I help you today?" },
  {
    title: 'Quantity & country',
    text: "Sure! How many packs do you need, and which country should we deliver to? I'll prepare your quote right away.",
  },
  { title: 'One moment', text: 'Thanks, {name}. Give me a moment while I check availability and the best price for you.' },
  {
    title: 'Quote sent',
    text: "I've sent your quote to {email}. Please check your inbox (and the spam folder, just in case) and let me know if you have any questions.",
  },
  {
    title: 'Prescription',
    text: 'This medicine needs a valid prescription. Once you confirm the quote, our team will guide you on how to share it for verification.',
  },
  {
    title: 'Payment',
    text: "Once you confirm the quote, I'll share the payment options available for your country. You only pay after you've confirmed.",
  },
  { title: 'Anything else?', text: 'Is there anything else I can help you with today?' },
  {
    title: 'Closing',
    text: 'Thank you for chatting with CureNeed, {name}! If you need anything else, just message us here anytime.',
  },
];

export default mongoose.model('QuickReply', quickReplySchema);
