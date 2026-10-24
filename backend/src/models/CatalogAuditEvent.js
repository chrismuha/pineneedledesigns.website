import mongoose from 'mongoose';

// Catalog identifiers only: never record request bodies, users, or customer data.
const schema = new mongoose.Schema({
  type: { type: String, enum: ['catalog-removed', 'media-removed'], required: true },
  targets: [{ _id: false, key: String, name: String }],
  reason: { type: String, required: true },
  startedAt: { type: Date, required: true },
  completedAt: Date,
  status: { type: String, enum: ['pending', 'completed', 'failed'], required: true },
});
export const CatalogAuditEvent = mongoose.model('CatalogAuditEvent', schema);
