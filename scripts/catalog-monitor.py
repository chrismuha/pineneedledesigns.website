#!/usr/bin/env python3
"""Monitor production catalog and media from GitHub, independently of Macs."""
import datetime
import importlib.util
import json
import os
from pathlib import Path
import shlex
import subprocess
import urllib.request

spec = importlib.util.spec_from_file_location('backup', Path(__file__).with_name('backup-uploaded-media.py'))
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


def send_email(events):
    labels = {'media-uploaded': 'Files uploaded', 'media-deleted': 'Files deleted',
              'media-restored': 'Files restored', 'catalog-added': 'Catalog records added',
              'catalog-deleted': 'Catalog records deleted', 'catalog-restored': 'Catalog records restored',
              'test': 'GitHub catalog monitor enabled', 'monitor-error': 'Catalog monitoring check failed'}
    text = ['Pine Needle Designs catalog and uploaded-media monitoring', '']
    for event in events:
        items = event['items']
        text.extend([f'{labels[event["type"]]} ({len(items)})', 'Detected: ' + event.get('detectedAt', '')])
        text.extend((f'- {name} ({key})' for key, name in items.items()) if isinstance(items, dict)
                    else ('- ' + value for value in items))
        text.append('')
    text.append('Checks run on GitHub every six hours, independently of both Macs. Changes between checks can be missed. GitHub may delay scheduled runs. The monitor sends alerts; it does not automatically restore or back up files.')
    payload = {'from': 'Pine Needle Designs <notifications@notifications.pineneedledesigns.store>',
               'to': ['muhachris297@gmail.com'],
               'subject': 'Pine Needle: catalog and file activity alert', 'text': '\n'.join(text)}
    request = urllib.request.Request('https://api.resend.com/emails', data=json.dumps(payload).encode(),
                                     headers={'Authorization': 'Bearer ' + os.environ['RESEND_API_KEY'],
                                              'Content-Type': 'application/json',
                                              'User-Agent': 'PineNeedleCatalogMonitor/1.0'})
    with urllib.request.urlopen(request, timeout=30) as response:
        response.read()


def collect():
    host = os.environ['DO_HOST']
    user = os.environ['DO_USER']
    if host.startswith('-') or any(c in host + user for c in '\n\r \t'):
        raise ValueError('Invalid SSH target')
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15',
           '-o', 'StrictHostKeyChecking=yes', '-o', 'HostKeyAlias=pineneedles-production',
           '-o', 'UserKnownHostsFile=' + str(Path(__file__).with_name('catalog-monitor.known_hosts').resolve()),
           '-i', os.environ['MONITOR_IDENTITY'], user + '@' + host,
           'cd ~/pineneedledesigns.website && node --input-type=module']
    result = subprocess.run(ssh, input=backup.REMOTE_CATALOG, text=True,
                            capture_output=True, check=True, timeout=120)
    catalog = json.loads(result.stdout)
    for key in ['products', 'collections', 'subcollections', '_mediaFiles']:
        if not isinstance(catalog.get(key), list):
            raise ValueError('Incomplete inventory; refusing to infer deletions')
    return catalog


def main():
    root = Path('.catalog-monitor-state')
    root.mkdir(exist_ok=True)
    # Reuse the last known Mac baseline on the first GitHub run, without alerting
    # about already missing originals. Later runs use the independent cached state.
    if not (root / 'monitor-state.json').exists():
        seed = Path(__file__).with_name('catalog-monitor-baseline.json')
        if seed.exists():
            backup.write_json(root / 'monitor-state.json', json.loads(seed.read_text()))
    stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    error_state = root / 'scan-error.json'
    try:
        catalog = collect()
    except Exception:
        # Connection/database failures must never be interpreted as mass deletion.
        if not error_state.exists():
            send_email([{'type': 'monitor-error', 'detectedAt': stamp,
                         'items': ['Cannot read server files or database. No deletions were inferred. Check the GitHub workflow and external uptime monitor.']}])
            backup.write_json(error_state, {'notifiedAt': stamp})
        raise RuntimeError('Catalog scan failed; previous inventory retained') from None
    error_state.unlink(missing_ok=True)
    backup.monitor_catalog(root, catalog, stamp, include_uploads=True)
    pending_file = root / 'pending-alerts.json'
    pending = json.loads(pending_file.read_text()) if pending_file.exists() else []
    if pending:
        send_email(pending)
        backup.write_json(pending_file, [])
    if os.environ.get('SEND_TEST_EMAIL') == 'true':
        send_email([{'type': 'test', 'detectedAt': stamp,
                     'items': [f'Watching {len(catalog["_mediaFiles"])} uploaded files and {len(catalog["products"])} products. Upload, deletion, addition and restoration emails now run independently of both Macs.']}])
    print(json.dumps({'files': len(catalog['_mediaFiles']), 'products': len(catalog['products']),
                      'eventsSent': len(pending), 'checkedAt': stamp}))


if __name__ == '__main__':
    main()
