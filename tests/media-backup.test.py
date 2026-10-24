"""Exercise backup retention with real rsync and temporary files."""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace

spec = importlib.util.spec_from_file_location('backup', Path(__file__).resolve().parents[1] / 'scripts/backup-uploaded-media.py')
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)
restore_spec = importlib.util.spec_from_file_location('restore', Path(__file__).resolve().parents[1] / 'scripts/restore-uploaded-media.py')
restore = importlib.util.module_from_spec(restore_spec)
restore_spec.loader.exec_module(restore)


class MediaBackupTests(unittest.TestCase):
    def test_audit_catches_between_backup_removal_without_fake_media_references(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            catalog = {'_mediaFiles': [], '_auditEvents': [
                {'status': 'completed', 'startedAt': '2026-10-25T12:00:00Z',
                 'completedAt': '2026-10-25T12:00:01Z', 'reason': 'Product deleted',
                 'targets': [{'key': 'media:/uploads/gone.webp', 'name': '/uploads/gone.webp'}]},
                {'status': 'failed', 'targets': [{'key': 'products:failed', 'name': 'Failed'}]}]}
            self.assertEqual(backup.media_paths(catalog), set())
            backup.track_removals(root, catalog, '20261026T060000000000Z')
            state = json.loads((root / 'removed-items.json').read_text())['items']
            self.assertEqual(list(state), ['media:/uploads/gone.webp'])
            self.assertIsNone(state['media:/uploads/gone.webp']['lastSeenAt'])
            self.assertIsNone(state['media:/uploads/gone.webp']['backupPath'])
            event = json.loads((root / 'removal-history.jsonl').read_text())
            self.assertEqual(event['websiteDeletionCompletedAt'], '2026-10-25T12:00:01Z')

    def test_removal_tracking_distinguishes_retained_missing_and_restored(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'site/uploads').mkdir(parents=True)
            (root / 'site/uploads/a.webp').write_bytes(b'original')
            (root / 'collections').mkdir()
            catalog = {'products': [{'_id': 'one', 'name': 'One', 'photos': ['/uploads/a.webp', '/uploads/old.webp']}],
                       'collections': [], 'subcollections': [], '_mediaFiles': ['/uploads/a.webp']}
            backup.organize_catalog(root, catalog)
            backup.track_removals(root, catalog, '20261025T060000000000Z')
            first = json.loads((root / 'removed-items.json').read_text())['items']
            self.assertEqual(first['media:/uploads/old.webp']['status'], 'missing-at-baseline')
            self.assertIn('Cause unknown', first['media:/uploads/old.webp']['reason'])
            self.assertFalse((root / 'removal-history.jsonl').exists())
            removed = {**catalog, 'products': [], '_mediaFiles': [], '_auditEvents': [
                {'status': 'completed', 'startedAt': '2026-10-25T12:00:00+00:00',
                 'completedAt': '2026-10-25T12:00:01+00:00', 'reason': 'Product deleted',
                 'targets': [{'key': 'products:one'}]}]}
            backup.track_removals(root, removed, '20261026T060000000000Z')
            state = json.loads((root / 'removed-items.json').read_text())['items']
            self.assertEqual(state['media:/uploads/a.webp']['backupPath'], 'site/uploads/a.webp')
            self.assertEqual(state['media:/uploads/a.webp']['lastSeenAt'], '2026-10-25T06:00:00+00:00')
            self.assertEqual(state['products:one']['websiteDeletionCompletedAt'], '2026-10-25T12:00:01+00:00')
            self.assertIsNotNone(state['products:one']['backupPath'])
            self.assertEqual(state['products:one']['reason'], 'Product deleted')
            self.assertEqual(state['products:one']['reasonSource'], 'website-audit')
            self.assertIn('Cause unknown', state['media:/uploads/a.webp']['reason'])
            self.assertIn('Reason:', (root / 'removed-items.md').read_text())
            count = len((root / 'removal-history.jsonl').read_text().splitlines())
            backup.track_removals(root, removed, '20261027T060000000000Z')
            self.assertEqual(len((root / 'removal-history.jsonl').read_text().splitlines()), count)
            backup.track_removals(root, catalog, '20261028T060000000000Z')
            restored = [json.loads(line) for line in (root / 'removal-history.jsonl').read_text().splitlines()]
            self.assertEqual(sum(event['event'] == 'restored' for event in restored), 2)
            self.assertEqual(len(json.loads((root / 'removed-items.json').read_text())['items']), 1)

    def test_unchanged_backups_append_history_and_refresh_missing_reference(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            report = {'completedAt': '20261025T060000Z', 'filesBackedUp': 1,
                      'referencedFiles': 2, 'missingFiles': ['uploads/missing.webp'],
                      'files': {'uploads/present.webp': {'bytes': 1, 'sha256': 'test'}}}
            backup.record_backup_result(root, report)
            report['completedAt'] = '20261026T060000Z'
            backup.record_backup_result(root, report)
            history = [json.loads(line) for line in (root / 'backup-history.jsonl').read_text().splitlines()]
            self.assertEqual(len(history), 2)
            self.assertEqual(history[0]['completedAt'], '20261025T060000Z')
            self.assertEqual(history[1]['completedAt'], '20261026T060000Z')
            self.assertEqual(history[1]['missingFileCount'], 1)
            reference = (root / 'missing-files.txt').read_text()
            self.assertIn('uploads/missing.webp', reference)
            self.assertIn('20261026T060000Z', reference)
            report['missingFiles'] = []
            backup.record_backup_result(root, report)
            self.assertNotIn('uploads/missing.webp', (root / 'missing-files.txt').read_text())
            self.assertIn('None.', (root / 'missing-files.txt').read_text())
            self.assertEqual(json.loads((root / 'backup-status.json').read_text())['missingFiles'], [])

    def test_external_monitor_reports_new_uploads_and_records_separately_from_restorations(self):
        before = {'products': [{'_id': 'old', 'name': 'Old', 'photos': ['/uploads/missing.webp']}],
                  '_mediaFiles': ['/uploads/existing.webp']}
        state, _ = backup.catalog_changes(None, before, include_uploads=True)
        after = {'products': before['products'] + [{'_id': 'new', 'name': 'New'}],
                 '_mediaFiles': ['/uploads/existing.webp', '/uploads/new.webp', '/uploads/missing.webp']}
        state, events = backup.catalog_changes(state, after, include_uploads=True)
        by_type = {event['type']: event['items'] for event in events}
        self.assertEqual(by_type['media-uploaded'], ['/uploads/new.webp'])
        self.assertEqual(by_type['media-restored'], ['/uploads/missing.webp'])
        self.assertEqual(by_type['catalog-added'], {'products:new': 'New'})
        self.assertEqual(backup.catalog_changes(state, after, include_uploads=True)[1], [])

    def test_email_alert_preserves_queue_on_failure_and_clears_after_acceptance(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            events = [{'type': 'media-deleted', 'items': ['/uploads/photo.webp']}]
            backup.write_json(root / 'pending-alerts.json', events)
            with patch.object(backup, 'email_alert', side_effect=OSError('offline')):
                with self.assertRaises(OSError):
                    backup.deliver_email_alerts(root, None)
            self.assertEqual(json.loads((root / 'pending-alerts.json').read_text()), events)
            with patch.object(backup, 'email_alert') as sender:
                backup.deliver_email_alerts(root, None)
                sender.assert_called_once_with(events, None)
            self.assertEqual(json.loads((root / 'pending-alerts.json').read_text()), [])

    def test_email_is_addressed_only_to_selected_recipient(self):
        args = SimpleNamespace(identity=Path('/tmp/test-key'), remote_root='/server',
                               host='example', alert_email='muhachris297@gmail.com')
        with patch.object(backup.subprocess, 'run') as run:
            backup.email_alert([{'type': 'media-restored', 'items': ['/uploads/a.webp']}], args)
        message = json.loads(run.call_args.kwargs['input'])
        self.assertEqual(message['to'], 'muhachris297@gmail.com')
        self.assertIn('Media files restored', message['text'])
        self.assertNotIn('cc', message)

    def test_alerts_baseline_deletions_restorations_and_no_repeat(self):
        catalog = {'products': [{'_id': 'p1', 'name': 'Bag', 'photos': ['/uploads/old.webp']}],
                   '_mediaFiles': ['/uploads/present.webp']}
        baseline, events = backup.catalog_changes(None, catalog)
        self.assertEqual(events, [])  # Pre-existing damage is a baseline, not a new incident.
        deleted = {'products': [], '_mediaFiles': []}
        state, events = backup.catalog_changes(baseline, deleted)
        self.assertEqual({e['type'] for e in events}, {'media-deleted', 'catalog-deleted'})
        repeated, events = backup.catalog_changes(state, deleted)
        self.assertEqual(events, [])
        catalog['_mediaFiles'] = ['/uploads/present.webp', '/uploads/old.webp', '/uploads/new.webp']
        restored, events = backup.catalog_changes(repeated, catalog)
        self.assertEqual({e['type'] for e in events}, {'media-restored', 'catalog-restored'})
        self.assertEqual(next(e['items'] for e in events if e['type'] == 'media-restored'),
                         ['/uploads/old.webp', '/uploads/present.webp'])
        self.assertEqual(backup.catalog_changes(restored, catalog)[1], [])

    def test_repository_copy_keeps_removed_files(self):
        with tempfile.TemporaryDirectory(prefix='repository backup ') as directory:
            root = Path(directory)
            source, target = root / 'source', root / 'repository/backups'
            source.mkdir()
            (source / 'photo.webp').write_bytes(b'photo')
            (source / '.backup.lock').touch()
            backup.copy_to_repository(source, target)
            (source / 'photo.webp').unlink()
            backup.copy_to_repository(source, target)
            self.assertEqual((target / 'photo.webp').read_bytes(), b'photo')
            self.assertFalse((target / '.backup.lock').exists())

    def test_collection_folders_keep_full_metadata_and_duplicate_names_separate(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'site/uploads').mkdir(parents=True)
            (root / 'site/uploads/photo.webp').write_bytes(b'photo')
            catalog = {'collections': [{'_id': 'c1', 'name': 'Denim / Lace'}],
                       'subcollections': [{'_id': 's1', 'name': 'Jackets', 'collectionId': 'c1'}],
                       'products': [{'_id': 'p1', 'name': 'Favorite', 'collectionId': 'c1',
                                     'subCollectionId': 's1', 'filters': ['Boho', 'One of a kind'],
                                     'photos': ['/uploads/photo.webp', '/uploads/missing.webp']},
                                    {'_id': 'p2', 'name': 'Favorite', 'collectionId': 'c1'}]}
            backup.organize_catalog(root, catalog)
            index = json.loads((root / 'collections/index.json').read_text())
            folders = [root / item['folder'] for item in index['products']]
            self.assertNotEqual(folders[0], folders[1])
            self.assertIn('subcollections/Jackets [s1]/products/', str(folders[0]))
            self.assertEqual(json.loads((folders[0] / 'product.json').read_text()), catalog['products'][0])
            self.assertIn('Boho', (folders[0] / 'item-details.md').read_text())
            media = json.loads((folders[0] / 'media.json').read_text())
            available = [item for item in media if item['available']]
            self.assertEqual(len(available), 1)
            self.assertEqual((folders[0] / available[0]['localFile']).read_bytes(), b'photo')
            # Deleting a website product does not remove its browsable backup.
            catalog['products'] = []
            backup.organize_catalog(root, catalog)
            self.assertTrue((folders[0] / 'product.json').exists())
            self.assertEqual(json.loads((root / 'collections/index.json').read_text())['products'], [])

    def test_restore_refuses_corrupted_backup_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'site/uploads').mkdir(parents=True)
            (root / 'site/uploads/photo.webp').write_bytes(b'corrupt')
            with self.assertRaises(ValueError):
                restore.verified_files(root, {'files': {'uploads/photo.webp': {'sha256': 'wrong'}}})

    def test_paths_cover_nested_catalog_and_reject_traversal(self):
        self.assertEqual(backup.media_paths({'products': [{'photos': ['/uploads/a.webp'], 'videos': ['/uploads/v.webm']}], 'collections': [{'cardImage': '/uploads/a.webp'}]}), {'uploads/a.webp', 'uploads/v.webm'})
        for path in ['/uploads/../../secret', '/uploads/a/../secret', '/uploads/a\\secret']:
            with self.assertRaises(ValueError):
                backup.media_paths(path)

    def test_deleted_files_are_retained_and_replacements_are_versioned(self):
        with tempfile.TemporaryDirectory(prefix='media backup with spaces ') as directory:
            root = Path(directory)
            source, target, history = (root / name for name in ('source', 'target', 'history'))
            source.mkdir()
            target.mkdir()
            (source / 'photo.webp').write_bytes(b'original')
            backup.sync_uploads(str(source) + '/', target, history / 'first')
            (source / 'photo.webp').unlink()
            backup.sync_uploads(str(source) + '/', target, history / 'second')
            self.assertEqual((target / 'photo.webp').read_bytes(), b'original')
            (source / 'photo.webp').write_bytes(b'replacement-photo')
            backup.sync_uploads(str(source) + '/', target, history / 'third')
            self.assertEqual((target / 'photo.webp').read_bytes(), b'replacement-photo')
            self.assertEqual((history / 'third/photo.webp').read_bytes(), b'original')
            old_stat = (source / 'photo.webp').stat()
            (source / 'photo.webp').write_bytes(b'same-length-photo')
            os.utime(source / 'photo.webp', (old_stat.st_atime, old_stat.st_mtime))
            backup.sync_uploads(str(source) + '/', target, history / 'fourth')
            self.assertEqual((target / 'photo.webp').read_bytes(), b'same-length-photo')
            self.assertEqual((history / 'fourth/photo.webp').read_bytes(), b'replacement-photo')


if __name__ == '__main__':
    unittest.main()
