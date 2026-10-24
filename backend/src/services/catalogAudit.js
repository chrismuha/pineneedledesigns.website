import fs from 'node:fs/promises';
import path from 'node:path';
import { CatalogAuditEvent } from '../models/CatalogAuditEvent.js';
import { config } from '../config/index.js';

export const catalogTarget = (kind, record) => ({
  key: `${kind}:${record._id}`, name: String(record.name || 'Unnamed'),
});

export const auditedRemoval = async ({ type = 'catalog-removed', targets, reason }, action) => {
  // Save intent first. If auditing is unavailable, do not perform the removal.
  const event = await CatalogAuditEvent.create({ type, targets, reason, startedAt: new Date(), status: 'pending' });
  let result;
  try {
    result = await action();
  } catch (error) {
    await CatalogAuditEvent.updateOne({ _id: event._id }, { $set: { status: 'failed' } })
      .catch(() => console.error('Failed to record catalog removal failure; audit entry remains pending.'));
    throw error;
  }
  // A pending event is never presented as a confirmed deletion by the backup.
  await CatalogAuditEvent.updateOne({ _id: event._id }, {
    $set: { status: 'completed', completedAt: new Date() },
  });
  return result;
};

export const removeUploadedMedia = async (url, reason) => {
  const filename = path.basename(url);
  if (url !== `/uploads/${filename}` || filename === '.' || filename === '..' || filename.includes('\\')) {
    throw new Error('Invalid uploaded-media path');
  }
  return auditedRemoval({ type: 'media-removed', targets: [{ key: `media:${url}`, name: url }], reason },
    () => fs.unlink(path.join(config.uploadsDir, filename)));
};
