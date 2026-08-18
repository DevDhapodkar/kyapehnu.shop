import mongoose from 'mongoose';

/**
 * Atomic named counters for human-facing sequential numbers (invoice numbers,
 * order numbers). `findOneAndUpdate` with `$inc` and `upsert` is atomic at the
 * document level, so concurrent orders never collide on a number.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "invoice-2026"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

/** Return the next value in a named sequence, creating it at 1 on first use. */
export const nextSequence = async (name, session) => {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, ...(session ? { session } : {}) }
  );
  return doc.seq;
};

export default Counter;
