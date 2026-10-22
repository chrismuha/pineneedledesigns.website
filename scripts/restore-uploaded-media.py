#!/usr/bin/python3
"""Preview or restore missing Pine Needle media and catalog records."""
import argparse
import hashlib
import json
from pathlib import Path
import shlex
import subprocess


REMOTE_RESTORE = r"""
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Collection } from './backend/src/models/Collection.js';
import { Subcollection } from './backend/src/models/Subcollection.js';
import { Product } from './backend/src/models/Product.js';
import { StoreSettings } from './backend/src/models/StoreSettings.js';
dotenv.config({ path: 'backend/.env', quiet: true });
let input = '';
for await (const chunk of process.stdin) input += chunk;
const { catalog, files, apply } = JSON.parse(input);
if (!process.env.MONGODB_URI) throw new Error('Database configuration missing');
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000, autoIndex: false, autoCreate: false });
try {
  const plan = [];
  // Validate everything before inserting anything. Schema casting restores BSON
  // ObjectIds and dates from the portable JSON backup.
  for (const [key, Model] of [['collections', Collection], ['subcollections', Subcollection], ['products', Product], ['storesettings', StoreSettings]]) {
    for (const record of catalog[key] || []) {
      if (!record._id || !mongoose.isObjectIdOrHexString(record._id)) throw new Error('Invalid backup record ID');
      const doc = new Model(record);
      await doc.validate();
      if (!await Model.collection.findOne({ _id: doc._id }, { projection: { _id: 1 } })) {
        plan.push({ Model, doc });
      }
    }
  }
  const missingMedia = [];
  for (const relative of files) {
    if (!relative.startsWith('uploads/') || relative.includes('\\') || relative.split('/').some(p => p === '..' || p === '.')) throw new Error('Invalid media path');
    try { await fs.lstat(path.join('backend', relative)); }
    catch (error) { if (error.code === 'ENOENT') missingMedia.push('/' + relative); else throw error; }
  }
  let inserted = 0;
  if (apply) {
    for (const { Model, doc } of plan) {
      try { await Model.collection.insertOne(doc.toObject()); inserted++; }
      catch (error) { if (error.code !== 11000) throw error; }
    }
  }
  console.log(JSON.stringify({ preview: !apply, missingRecords: plan.map(({ Model, doc }) => ({ type: Model.modelName, id: String(doc._id), name: doc.name || doc.key })), insertedRecords: inserted, missingMedia }));
} finally { await mongoose.disconnect(); }
"""


def verified_files(root, status):
    for relative, expected in status['files'].items():
        path = Path(relative)
        if not relative.startswith('uploads/') or '..' in path.parts or '\\' in relative:
            raise ValueError('Unsafe media path')
        file = root / 'site' / path
        if file.is_symlink() or not file.is_file():
            raise ValueError('Backup file is missing: ' + relative)
        digest = hashlib.sha256()
        with file.open('rb') as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                digest.update(chunk)
        if digest.hexdigest() != expected['sha256']:
            raise ValueError('Backup checksum mismatch: ' + relative)
    return list(status['files'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backup', type=Path, default=Path.home() / 'Website Backups/pineneedledesigns.website')
    parser.add_argument('--snapshot', type=Path)
    parser.add_argument('--host', default='root@192.34.58.246')
    parser.add_argument('--remote-root', default='/root/pineneedledesigns.website')
    parser.add_argument('--identity', type=Path, default=Path.home() / '.ssh/pineneedles_deploy')
    parser.add_argument('--apply', action='store_true', help='Restore missing files and records; existing data is preserved')
    args = parser.parse_args()
    root = args.backup.resolve()
    snapshot = args.snapshot or root / 'latest-catalog.json'
    if not snapshot.is_absolute():
        snapshot = root / snapshot
    catalog = json.loads(snapshot.read_text())
    status = json.loads((root / 'backup-status.json').read_text())
    files = verified_files(root, status)
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', '-i', str(args.identity)]

    def remote(apply):
        command = 'cd ' + shlex.quote(args.remote_root) + ' && node --input-type=module -e ' + shlex.quote(REMOTE_RESTORE)
        result = subprocess.run(ssh + [args.host, command],
                                input=json.dumps({'catalog': catalog, 'files': files, 'apply': apply}),
                                text=True, capture_output=True, check=True, timeout=180)
        return json.loads(result.stdout)

    plan = remote(False)
    print(json.dumps(plan, indent=2), flush=True)
    if not args.apply:
        print('Preview only. Nothing on the website was changed.')
        return
    if plan['missingMedia']:
        # Only send the verified backup files, never miscellaneous files in the directory.
        relative_files = [value.removeprefix('/uploads/') for value in plan['missingMedia']]
        transport = ' '.join(shlex.quote(part) for part in ssh)
        subprocess.run(['rsync', '-rt', '--ignore-existing', '--files-from=-', '-e', transport,
                        './', args.host + ':' + shlex.quote(args.remote_root + '/backend/uploads/')],
                       cwd=root / 'site/uploads', input='\n'.join(relative_files) + '\n',
                       text=True, check=True, timeout=1800)
    result = remote(True)
    print(json.dumps(result, indent=2))
    if result['missingMedia']:
        raise RuntimeError('Some media files remain missing after restore')


if __name__ == '__main__':
    main()
