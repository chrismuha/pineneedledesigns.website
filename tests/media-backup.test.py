"""Exercise backup retention with real rsync and temporary files."""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('backup', Path(__file__).resolve().parents[1] / 'scripts/backup-uploaded-media.py')
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)
restore_spec = importlib.util.spec_from_file_location('restore', Path(__file__).resolve().parents[1] / 'scripts/restore-uploaded-media.py')
restore = importlib.util.module_from_spec(restore_spec)
restore_spec.loader.exec_module(restore)


class MediaBackupTests(unittest.TestCase):
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
