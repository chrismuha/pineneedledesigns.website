import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 100000,
  },
});

export const OrderCounter = mongoose.model('OrderCounter', counterSchema);

export const getNextOrderNumber = async () => {
  const counter = await OrderCounter.findOneAndUpdate(
    { _id: 'orders' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  return counter.seq;
};
