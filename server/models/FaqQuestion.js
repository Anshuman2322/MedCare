import mongoose from 'mongoose';

// What visitors asked the chat (or typed into the FAQ search) and how the FAQ
// handled it. One document per distinct wording, with a counter, so the team
// can see which questions come up most and which ones have no answer yet.
const faqQuestionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    text: { type: String, required: true, trim: true, maxlength: 300 },
    source: { type: String, enum: ['chat', 'page'], default: 'chat' },
    // answered: a FAQ answered it; escalated: answered, and the FAQ says a person is needed;
    // suggested: only close matches were offered; unanswered: nothing verified to say.
    outcome: { type: String, enum: ['answered', 'escalated', 'suggested', 'unanswered'], required: true, index: true },
    faqId: { type: String, default: '' },
    faqQuestion: { type: String, default: '' },
    count: { type: Number, default: 1, min: 1 },
    firstAskedAt: { type: Date, default: Date.now },
    lastAskedAt: { type: Date, default: Date.now, index: true },
    // The latest few chats it came from, so the team can open the conversation.
    conversations: [
      {
        _id: false,
        conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatConversation' },
        visitorName: { type: String, default: '' },
        at: { type: Date, default: Date.now },
      },
    ],
    status: { type: String, enum: ['new', 'resolved', 'ignored'], default: 'new', index: true },
    note: { type: String, default: '', trim: true, maxlength: 500 },
    resolvedFaqId: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.FaqQuestion || mongoose.model('FaqQuestion', faqQuestionSchema);
