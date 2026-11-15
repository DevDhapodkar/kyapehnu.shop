import mongoose from 'mongoose';

const whatsappInboundSchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true, unique: true, index: true },
    waId: { type: String, required: true },
    type: { type: String, default: 'text' },
    payload: { type: mongoose.Schema.Types.Mixed },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Expire deduplication log after 7 days
whatsappInboundSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 86400 });

export default mongoose.model('WhatsappInbound', whatsappInboundSchema);
