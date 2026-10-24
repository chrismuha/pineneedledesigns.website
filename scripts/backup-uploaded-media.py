#!/usr/bin/python3
"""Pull production catalog records and uploads without propagating deletions."""
import argparse
import datetime
import fcntl
import hashlib
import json
import os
import re
from pathlib import Path, PurePosixPath
import shlex
import subprocess
import sys


REMOTE_CATALOG = r"""
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
dotenv.config({ path: 'backend/.env', quiet: true });
if (!process.env.MONGODB_URI) throw new Error('Server database configuration is missing');
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000, autoIndex: false });
try {
  const result = {};
  for (const name of ['products', 'collections', 'subcollections', 'storesettings']) {
    result[name] = await mongoose.connection.db.collection(name).find({}).toArray();
  }
  result._auditEvents = await mongoose.connection.db.collection('catalogauditevents').find({}, {
    projection: { _id: 1, type: 1, targets: 1, reason: 1, startedAt: 1, completedAt: 1, status: 1 }
  }).sort({ startedAt: 1 }).toArray();
  const mediaFiles = [];
  async function listFiles(directory, prefix = '/uploads') {
    let entries;
    try { entries = await fs.readdir(directory, { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of entries) {
      const url = prefix + '/' + entry.name;
      if (entry.isDirectory()) await listFiles(path.join(directory, entry.name), url);
      else if (entry.isFile()) mediaFiles.push(url);
    }
  }
  await listFiles('backend/uploads');
  result._mediaFiles = mediaFiles.sort();
  process.stdout.write(JSON.stringify(result));
} finally { await mongoose.disconnect(); }
"""


def media_paths(value):
    """Only map website upload URLs to safe relative backup paths."""
    found = set()
    if isinstance(value, dict):
        for key, item in value.items():
            if key not in ('_mediaFiles', '_auditEvents'):
                found.update(media_paths(item))
    elif isinstance(value, list):
        for item in value:
            found.update(media_paths(item))
    elif isinstance(value, str) and value.startswith('/uploads/'):
        if '\\' in value or any(part in ('.', '..') for part in value.split('/')):
            raise ValueError('Unsafe upload path in catalog')
        found.add(str(PurePosixPath(value.lstrip('/'))))
    return found


def write_json(destination, value):
    temporary = destination.with_name(destination.name + '.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n')
    os.replace(temporary, destination)


def catalog_changes(previous, catalog, include_uploads=False):
    """Compare live inventory, not retained backup files; remember past deletions."""
    files = set(catalog['_mediaFiles'])
    records = {kind + ':' + str(record['_id']): record.get('name', record.get('key', 'Unnamed'))
               for kind in ('products', 'collections', 'subcollections')
               for record in catalog.get(kind, [])}
    referenced = {'/' + relative for relative in media_paths(catalog)}
    if previous is None:
        return {'files': sorted(files), 'records': records,
                'missingFiles': sorted(referenced - files), 'missingRecords': {}}, []
    deleted_files = set(previous['files']) - files
    restored_files = files & set(previous['missingFiles'])
    deleted_records = {key: name for key, name in previous['records'].items() if key not in records}
    restored_records = {key: name for key, name in records.items() if key in previous['missingRecords']}
    missing_records = {**previous['missingRecords'], **deleted_records}
    for key in restored_records:
        missing_records.pop(key)
    events = []
    for event_type, items in [('media-deleted', sorted(deleted_files)),
                              ('media-restored', sorted(restored_files)),
                              ('catalog-deleted', deleted_records),
                              ('catalog-restored', restored_records)]:
        if items:
            events.append({'type': event_type, 'items': items})
    if include_uploads:
        new_files = sorted(files - set(previous['files']) - set(previous['missingFiles']))
        new_records = {key: name for key, name in records.items()
                       if key not in previous['records'] and key not in previous['missingRecords']}
        if new_files:
            events.append({'type': 'media-uploaded', 'items': new_files})
        if new_records:
            events.append({'type': 'catalog-added', 'items': new_records})
    state = {'files': sorted(files), 'records': records,
             'missingFiles': sorted((set(previous['missingFiles']) | deleted_files | referenced) - files),
             'missingRecords': missing_records}
    return state, events


def monitor_catalog(root, catalog, stamp, include_uploads=False):
    state_file = root / 'monitor-state.json'
    previous = json.loads(state_file.read_text()) if state_file.exists() else None
    state, events = catalog_changes(previous, catalog, include_uploads=include_uploads)
    pending_file = root / 'pending-alerts.json'
    pending = json.loads(pending_file.read_text()) if pending_file.exists() else []
    for event in events:
        event['detectedAt'] = stamp
    if events:
        with (root / 'activity.jsonl').open('a') as log:
            for event in events:
                log.write(json.dumps(event) + '\n')
        write_json(pending_file, pending + events)
    write_json(state_file, state)


def deliver_mac_alerts(root):
    pending_file = root / 'pending-alerts.json'
    pending = json.loads(pending_file.read_text()) if pending_file.exists() else []
    if not pending:
        return
    labels = {'media-deleted': 'media files deleted', 'media-restored': 'media files restored',
              'catalog-deleted': 'catalog records deleted', 'catalog-restored': 'catalog records restored'}
    summary = '; '.join(f'{len(event["items"])} {labels[event["type"]]}' for event in pending)
    # Pass text as arguments so catalog text can never become AppleScript code.
    script = 'on run argv\n display notification (item 1 of argv) with title "Pine Needle website alert"\nend run'
    subprocess.run(['/usr/bin/osascript', '-e', script, summary + '. Details in activity.jsonl.'],
                   check=True, capture_output=True, timeout=20)
    write_json(pending_file, [])


def email_alert(events, args):
    labels = {'media-deleted': 'Media files deleted', 'media-restored': 'Media files restored',
              'catalog-deleted': 'Catalog records deleted', 'catalog-restored': 'Catalog records restored',
              'test': 'Alert test'}
    details = ['Pine Needle Designs backup monitoring', '']
    for event in events:
        items = event['items']
        details.extend([labels[event['type']] + f' ({len(items)})',
                        'Detected: ' + event.get('detectedAt', 'test')])
        if isinstance(items, dict):
            details.extend(f'- {name} ({identifier})' for identifier, name in items.items())
        else:
            details.extend('- ' + item for item in items)
        details.append('')
    details.append('Checks run every six hours while Chris\'s Mac is awake and online. Existing missing files do not generate repeated alerts. The monitor reports changes; it does not automatically restore deleted files.')
    subject = 'Pine Needle: ' + ('backup alert test' if events[0]['type'] == 'test' else 'website deletion/restoration alert')
    code = r"""
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env', quiet: true });
process.env.NODE_ENV = 'production';
// This is the verified Resend subdomain. The root domain configured by PM2
// is unverified, so use the verified sender for backup alerts explicitly.
process.env.RESEND_FROM = 'notifications@notifications.pineneedledesigns.store';
const { sendEmail } = await import('./backend/src/services/mailer.js');
let input = '';
for await (const chunk of process.stdin) input += chunk;
const message = JSON.parse(input);
await sendEmail({ to: message.to, subject: message.subject, text: message.text });
"""
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', '-i', str(args.identity)]
    command = 'cd ' + shlex.quote(args.remote_root) + ' && node --input-type=module -e ' + shlex.quote(code)
    subprocess.run(ssh + [args.host, command],
                   input=json.dumps({'to': args.alert_email, 'subject': subject, 'text': '\n'.join(details)}),
                   text=True, capture_output=True, check=True, timeout=90)


def deliver_email_alerts(root, args):
    pending_file = root / 'pending-alerts.json'
    pending = json.loads(pending_file.read_text()) if pending_file.exists() else []
    if pending:
        email_alert(pending, args)
        write_json(pending_file, [])


def folder_name(record):
    name = re.sub(r'[\x00-\x1f/\\:*?"<>|]', '-', str(record.get('name') or 'Unnamed')).strip(' .')[:100] or 'Unnamed'
    identifier = str(record.get('_id', ''))
    suffix = re.sub(r'[^A-Za-z0-9_-]', '', identifier) or hashlib.sha256(json.dumps(record, sort_keys=True).encode()).hexdigest()[:12]
    return f'{name} [{suffix}]'


def organize_catalog(root, catalog):
    """Build browsable folders without removing previously backed-up items."""
    collections_root = root / 'collections'
    collections_root.mkdir(exist_ok=True)
    folders = {}
    index = []

    def record_folder(parent, record, filename):
        folder = parent / folder_name(record)
        folder.mkdir(parents=True, exist_ok=True)
        write_json(folder / filename, record)
        return folder

    def attach_media(folder, record):
        media = []
        for number, relative in enumerate(sorted(media_paths(record)), 1):
            source = root / 'site' / relative
            destination = folder / 'media' / f'{number:02d}-{Path(relative).name}'
            available = source.is_file() and not source.is_symlink()
            if available:
                destination.parent.mkdir(exist_ok=True)
                # Hard links are real browsable files without duplicating large videos.
                # rsync replaces files by rename, so earlier hard links stay intact.
                temporary = destination.with_name(destination.name + '.tmp')
                temporary.unlink(missing_ok=True)
                os.link(source, temporary)
                os.replace(temporary, destination)
            media.append({'websiteUrl': '/' + relative, 'available': available,
                          'localFile': destination.relative_to(folder).as_posix() if available else None})
        write_json(folder / 'media.json', media)
        return media

    for collection in catalog.get('collections', []):
        folder = record_folder(collections_root, collection, 'collection.json')
        folders[str(collection['_id'])] = folder
        attach_media(folder, collection)
        index.append({'id': collection['_id'], 'name': collection.get('name'),
                      'folder': folder.relative_to(root).as_posix()})
    subfolders = {}
    for subcollection in catalog.get('subcollections', []):
        parent = folders.get(str(subcollection.get('collectionId')), collections_root / 'Unassigned')
        subfolders[str(subcollection['_id'])] = record_folder(parent / 'subcollections', subcollection, 'subcollection.json')
    products = []
    for product in catalog.get('products', []):
        collection = folders.get(str(product.get('collectionId')), collections_root / 'Unassigned')
        parent = subfolders.get(str(product.get('subCollectionId')), collection)
        folder = record_folder(parent / 'products', product, 'product.json')
        media = attach_media(folder, product)
        details = [f'# {product.get("name", "Unnamed")}', '',
                   'Full restore data: product.json. Original website media paths: media.json.', '']
        for key in ['description', 'price', 'quantity', 'color', 'size', 'sweatshirtSize',
                    'shoeSize', 'beltSize', 'filters', 'tags', 'bagTypes', 'shoeTypes',
                    'customProperties', 'comfortColors', 'maker', 'meta']:
            if product.get(key) not in (None, '', []):
                value = product[key]
                details.extend([f'{key}: {json.dumps(value, ensure_ascii=False) if isinstance(value, (list, dict)) else value}', ''])
        details.append(f'Media available: {sum(item["available"] for item in media)} of {len(media)}')
        (folder / 'item-details.md').write_text('\n'.join(line.rstrip() for line in '\n'.join(details).splitlines()) + '\n')
        products.append({'id': product['_id'], 'name': product.get('name'),
                         'folder': folder.relative_to(root).as_posix()})
    write_json(collections_root / 'index.json', {'collections': index, 'products': products})
    (root / 'RESTORE.md').write_text(
        '# Restoring Pine Needle Designs\n\n'
        'Browse collections/ by collection, subcollection, and product name. Each product has '
        'item-details.md, its complete product.json record (including filters/tags, options, prices, '
        'and database IDs), media.json with original URLs, and available files in media/. '
        'IDs in folder names keep items with the same name separate.\n\n'
        'collections/index.json lists the current catalog. Older item folders are retained. '
        'catalog-snapshots/ preserves earlier catalog states. site/uploads/ preserves original website paths. '
        'replaced-files/ preserves replaced media. Missing originals are listed in missing-files.txt and backup-status.json. '
        'removed-items.md categorizes removals and retained recovery paths; removal-history.jsonl preserves detected removals and restorations.\n\n'
        'Preview a restore: /usr/bin/python3 restore-uploaded-media.py\n'
        'Restore missing files and catalog records: /usr/bin/python3 restore-uploaded-media.py --apply\n'
        'Use --snapshot catalog-snapshots/FILE.json to select an earlier catalog state. '
        'Existing website files and records are never overwritten. Restore does not remove website data. '
        'For older versions of existing records, use the saved JSON for a deliberate manual rollback.\n')


def sync_uploads(source, destination, history, transport=None):
    # Apple's openrsync mishandles absolute backup paths containing spaces.
    # Relative paths also keep the remote rsync command free of local paths.
    command = ['rsync', '-rtc', '--backup', '--backup-dir=' + os.path.relpath(history, destination)]
    if transport:
        command += ['-e', transport]
    # Intentionally no --delete: removing a website photo must not erase a backup.
    subprocess.run(command + [source, destination.name + '/'], cwd=destination.parent,
                   check=True, timeout=1800)


def copy_to_repository(root, destination):
    destination.mkdir(parents=True, exist_ok=True)
    subprocess.run(['rsync', '-rt', '--exclude=.backup.lock', '--exclude=backup.log',
                    '--exclude=backup-error.log', './', str(destination) + '/'],
                   cwd=root, check=True, timeout=1800)


def track_removals(root, catalog, stamp):
    """Track observed removals independently from retained recovery files."""
    def iso(value):
        if not value:
            return None
        if 'T' in value and '-' not in value:
            return datetime.datetime.strptime(value, '%Y%m%dT%H%M%S%fZ').replace(tzinfo=datetime.timezone.utc).isoformat()
        return value

    checked = iso(stamp)
    state_file = root / 'removal-state.json'
    previous = json.loads(state_file.read_text()) if state_file.exists() else None
    # Migrate from the last successful backup, never from retained files on disk.
    if previous is None and (root / 'latest-catalog.json').exists():
        old = json.loads((root / 'latest-catalog.json').read_text())
        status = json.loads((root / 'backup-status.json').read_text())
        previous = {'checkedAt': iso(status['completedAt']), 'items': inventory(old)}
        for item in previous['items'].values():
            item['lastSeenAt'] = previous['checkedAt']
            item['status'] = 'present'
    items = previous['items'] if previous else {}
    current = inventory(catalog)
    audit = catalog.get('_auditEvents', [])
    events = []
    for key, item in current.items():
        old = items.get(key, {})
        if old.get('status') in ('removed', 'missing-at-baseline'):
            events.append({'event': 'restored', 'key': key, 'detectedAt': checked,
                           'previousMissingAt': old.get('firstDetectedMissingAt')})
        items[key] = {**item, 'status': 'present', 'lastSeenAt': checked}
    for key, item in items.items():
        if key in current:
            continue
        if item.get('status') == 'present':
            item.update(status='removed', firstDetectedMissingAt=checked)
            events.append({'event': 'removed', 'key': key, 'name': item.get('name'),
                           'lastSeenAt': item.get('lastSeenAt'), 'detectedAt': checked})
    # References already broken when first observed are not invented deletion events.
    for relative in sorted(media_paths(catalog)):
        key = 'media:/' + relative
        if key not in items:
            items[key] = {'kind': 'media', 'name': '/' + relative, 'websitePath': '/' + relative,
                          'status': 'missing-at-baseline', 'lastSeenAt': None,
                          'firstDetectedMissingAt': checked}
    # Audit also catches items created and deleted entirely between daily checks.
    for event in audit:
        if event.get('status') != 'completed':
            continue
        for target in event.get('targets', []):
            key = target['key']
            if key in items:
                continue
            kind, identifier = key.split(':', 1)
            if kind not in ('media', 'products', 'collections', 'subcollections'):
                continue
            item = {'kind': kind, 'name': target.get('name', identifier),
                    'status': 'removed', 'lastSeenAt': None, 'firstDetectedMissingAt': checked}
            item['websitePath' if kind == 'media' else 'id'] = identifier
            items[key] = item
            events.append({'event': 'removed', 'key': key, 'name': item['name'],
                           'lastSeenAt': None, 'detectedAt': checked})
    for key, item in items.items():
        if item['status'] == 'present':
            continue
        matches = [event for event in audit if event.get('status') == 'completed'
                   and any(target.get('key') == key for target in event.get('targets', []))
                   and event.get('completedAt')
                   and (not item.get('lastSeenAt') or
                        datetime.datetime.fromisoformat(event['completedAt'].replace('Z', '+00:00')) >=
                        datetime.datetime.fromisoformat(item['lastSeenAt'].replace('Z', '+00:00')))]
        if matches:
            event = max(matches, key=lambda value: datetime.datetime.fromisoformat(value['completedAt'].replace('Z', '+00:00')))
            if item['status'] == 'missing-at-baseline':
                item['status'] = 'removed'
                events.append({'event': 'removed', 'key': key, 'name': item.get('name'),
                               'lastSeenAt': None, 'detectedAt': checked})
            item['websiteDeletionStartedAt'] = event.get('startedAt')
            item['websiteDeletionCompletedAt'] = event.get('completedAt')
            item['reason'] = event.get('reason')
        if matches:
            item['reason'] = item.get('reason') or 'Website removal recorded without a detailed reason.'
            item['reasonSource'] = 'website-audit'
        else:
            item['reason'] = ('Cause unknown: file was already missing when first observed; no completed website deletion audit matches.'
                              if item['status'] == 'missing-at-baseline' else
                              'Cause unknown: item disappeared between checks; no completed website deletion audit matches. Direct server, deployment, or database changes are possible but unconfirmed.')
            item['reasonSource'] = 'backup-observation'
        if item['kind'] == 'media':
            relative = item['websitePath'].lstrip('/')
            item['backupPath'] = 'site/' + relative if (root / 'site' / relative).is_file() else None
        else:
            filename = {'products': 'product.json', 'collections': 'collection.json',
                        'subcollections': 'subcollection.json'}[item['kind']]
            # Old folders are deliberately retained even after moves and renames.
            candidates = list((root / 'collections').rglob(filename))
            item['backupPath'] = next((str(path.relative_to(root)) for path in candidates
                                      if str(json.loads(path.read_text()).get('_id')) == item['id']), None)
        item['category'] = ('Removed from website — backup retained' if item['status'] == 'removed' and item['backupPath']
                            else 'Removed from website — no backup available' if item['status'] == 'removed'
                            else 'Already missing when first observed')
    removed = {key: item for key, item in items.items() if item['status'] != 'present'}
    write_json(state_file, {'checkedAt': checked, 'items': items})
    write_json(root / 'removed-items.json', {'checkedAt': checked, 'items': removed})
    write_json(root / 'website-deletion-audit.json', audit)
    if events:
        with (root / 'removal-history.jsonl').open('a') as history:
            for event in events:
                if event['event'] == 'removed':
                    event.update({key: items[event['key']].get(key) for key in (
                        'websiteDeletionStartedAt', 'websiteDeletionCompletedAt', 'backupPath', 'category', 'reason', 'reasonSource')})
                history.write(json.dumps(event, sort_keys=True) + '\n')
    lines = ['# Removed and missing items', '', 'Checked (UTC): ' + checked, '',
             'Last seen / first detected missing bounds an observed removal; it is not an exact deletion time.',
             'Website deletion times are recorded only for audited application actions after deployment.',
             'Direct database or disk changes are detected at backup time. Restoration means seen again, not proof of how it returned.', '']
    for key, item in sorted(removed.items()):
        lines.extend([f'## {item["name"]}', '', 'Category: ' + item['category'],
                      'Reason: ' + item['reason'],
                      'Reason source: ' + item['reasonSource'],
                      'Last seen (UTC): ' + str(item.get('lastSeenAt') or 'Unknown'),
                      'First detected missing (UTC): ' + item['firstDetectedMissingAt'],
                      'Website deletion started (UTC): ' + str(item.get('websiteDeletionStartedAt') or 'Unknown'),
                      'Website deletion completed (UTC): ' + str(item.get('websiteDeletionCompletedAt') or 'Unknown'),
                      'Retained backup: ' + str(item.get('backupPath') or 'None'), ''])
    if not removed:
        lines.append('No removed or missing items.')
    (root / 'removed-items.md').write_text('\n'.join(lines) + '\n')


def inventory(catalog):
    result = {'media:' + url: {'kind': 'media', 'name': url, 'websitePath': url}
              for url in catalog.get('_mediaFiles', [])}
    for kind in ('products', 'collections', 'subcollections'):
        for record in catalog.get(kind, []):
            result[kind + ':' + str(record['_id'])] = {
                'kind': kind, 'id': str(record['_id']), 'name': record.get('name', 'Unnamed')}
    return result


def record_backup_result(root, report):
    """Record every completed backup, even when catalog and media are unchanged."""
    write_json(root / 'backup-status.json', report)
    missing = report['missingFiles']
    lines = [
        'Pine Needle Designs — missing media reference',
        'Checked (UTC): ' + report['completedAt'],
        'Missing referenced files: ' + str(len(missing)),
        '',
        'These catalog references have no file in the retained backup.',
        'Existing missing originals cannot be recovered by refreshing the backup.',
        '',
    ]
    lines.extend(missing if missing else ['None. All referenced media is present in the backup.'])
    (root / 'missing-files.txt').write_text('\n'.join(lines) + '\n')
    entry = {key: report[key] for key in ('completedAt', 'filesBackedUp', 'referencedFiles')}
    entry['missingFileCount'] = len(missing)
    entry['result'] = 'completed-with-missing-media' if missing else 'completed'
    with (root / 'backup-history.jsonl').open('a') as history:
        history.write(json.dumps(entry, sort_keys=True) + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host', default='root@192.34.58.246')
    parser.add_argument('--remote-root', default='/root/pineneedledesigns.website')
    parser.add_argument('--identity', type=Path, default=Path.home() / '.ssh/pineneedles_deploy')
    parser.add_argument('--destination', type=Path, default=Path.home() / 'Website Backups/pineneedledesigns.website')
    parser.add_argument('--organize-only', action='store_true', help='Organize the last successful backup without accessing production')
    parser.add_argument('--repository-copy', type=Path, help='Keep an additional private copy inside the repository')
    parser.add_argument('--mirror-only', action='store_true', help='Copy the existing backup to the repository without accessing production')
    parser.add_argument('--alerts', choices=['off', 'mac', 'email'], default='off')
    parser.add_argument('--alert-email', default='')
    parser.add_argument('--test-alert', action='store_true')
    args = parser.parse_args()
    if args.alerts == 'email' and not re.fullmatch(r'[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+', args.alert_email):
        parser.error('--alerts email requires one valid --alert-email address')
    if args.test_alert:
        if args.alerts != 'email':
            parser.error('--test-alert requires --alerts email')
        email_alert([{'type': 'test', 'items': ['Email alerts are enabled for deleted and restored media and catalog records.']}], args)
        print('Test alert accepted by the email service for ' + args.alert_email)
        return
    if args.repository_copy:
        args.repository_copy = args.repository_copy.resolve()
    os.umask(0o077)
    root = args.destination.resolve()
    root.mkdir(parents=True, exist_ok=True)
    with (root / '.backup.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print('Another backup is already running.')
            return
        if args.organize_only:
            organize_catalog(root, json.loads((root / 'latest-catalog.json').read_text()))
            print('Organized existing catalog backup by collection and product.')
            return
        if args.mirror_only:
            if not args.repository_copy:
                parser.error('--mirror-only requires --repository-copy')
            copy_to_repository(root, args.repository_copy)
            print('Copied backup into ' + str(args.repository_copy))
            return
        stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15',
               '-o', 'ServerAliveInterval=30', '-o', 'ServerAliveCountMax=3',
               '-i', str(args.identity)]
        remote = 'cd ' + shlex.quote(args.remote_root) + ' && node --input-type=module'
        result = subprocess.run(ssh + [args.host, remote], input=REMOTE_CATALOG,
                                text=True, capture_output=True, check=True, timeout=90)
        catalog = json.loads(result.stdout)
        if args.alerts != 'off':
            monitor_catalog(root, catalog, stamp)
            try:
                if args.alerts == 'email':
                    deliver_email_alerts(root, args)
                else:
                    deliver_mac_alerts(root)
            except (OSError, subprocess.SubprocessError):
                print('Notification delivery failed; alert is queued for the next run.', flush=True)
        references = media_paths(catalog)
        snapshots = root / 'catalog-snapshots'
        snapshots.mkdir(exist_ok=True)
        write_json(snapshots / (stamp + '.json'), catalog)
        uploads = root / 'site/uploads'
        uploads.mkdir(parents=True, exist_ok=True)
        sync_uploads(args.host + ':' + shlex.quote(args.remote_root + '/backend/uploads/'),
                     uploads, root / 'replaced-files' / stamp,
                     ' '.join(shlex.quote(part) for part in ssh))
        files = {}
        for file in sorted(uploads.rglob('*')):
            if file.is_symlink():
                raise ValueError('Unexpected symlink in backup')
            if not file.is_file():
                continue
            digest = hashlib.sha256()
            with file.open('rb') as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                    digest.update(chunk)
            files[file.relative_to(root / 'site').as_posix()] = {
                'bytes': file.stat().st_size, 'sha256': digest.hexdigest(),
            }
        missing = sorted(references - files.keys())
        organize_catalog(root, catalog)
        report = {'completedAt': stamp, 'filesBackedUp': len(files),
                  'referencedFiles': len(references), 'missingFiles': missing, 'files': files}
        track_removals(root, catalog, stamp)
        write_json(root / 'latest-catalog.json', catalog)
        record_backup_result(root, report)
        if args.repository_copy:
            try:
                copy_to_repository(root, args.repository_copy)
                write_json(root / 'repository-copy-status.json', {'completedAt': stamp, 'destination': str(args.repository_copy), 'success': True})
            except (OSError, subprocess.SubprocessError):
                write_json(root / 'repository-copy-status.json', {'attemptedAt': stamp, 'destination': str(args.repository_copy), 'success': False})
                print('Local backup succeeded; repository copy failed. Check macOS Full Disk Access for the scheduled Python executable.', flush=True)
        print(f'{stamp}: Backed up {len(files)} files; {len(missing)} catalog files are missing. See backup-status.json.', flush=True)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Do not print subprocess output or connection strings containing credentials.
        print('Media backup failed (' + type(error).__name__ + '); previous backups were retained.', file=sys.stderr, flush=True)
        sys.exit(1)
