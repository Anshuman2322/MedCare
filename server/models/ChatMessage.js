import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatConversation',
      required: true,
      index: true,
    },
    role: { type: String, enum: ['user', 'assistant', 'agent'], required: true },
    text: { type: String, default: '', trim: true },
    // Structured extras the widget renders alongside the text: medicine cards,
    // quick-action chips and inline form descriptors.
    payload: {
      cards: { type: Array, default: undefined },
      quickActions: { type: Array, default: undefined },
      form: { type: mongoose.Schema.Types.Mixed, default: undefined },
    },
    agentEmail: { type: String, default: '', trim: true },
    // Name shown to the visitor above a team reply (from the live-chat settings).
    agentName: { type: String, default: '', trim: true },
    // Set when a team reply was also emailed because the visitor had left.
    emailedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

chatMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
