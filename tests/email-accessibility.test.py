import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch, MagicMock

spec = importlib.util.spec_from_file_location('catalog_monitor', Path(__file__).resolve().parents[1] / 'scripts/catalog-monitor.py')
monitor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor)

class AccessibleCatalogEmails(unittest.TestCase):
    def test_all_catalog_alert_types_include_readable_escaped_html_and_plain_text(self):
        events = [{'type': kind, 'detectedAt': '2026-10-22', 'items': ['/uploads/<photo>.png']} for kind in ['media-uploaded', 'media-deleted', 'media-restored', 'catalog-added', 'catalog-deleted', 'catalog-restored', 'monitor-error', 'test']]
        events.append({'type': 'catalog-added', 'items': {'id-1': 'Pillow & blanket'}})
        with patch.dict('os.environ', {'RESEND_API_KEY': 'test-only'}), patch.object(monitor.urllib.request, 'urlopen', return_value=MagicMock()) as send:
            monitor.send_email(events)
        payload = json.loads(send.call_args.args[0].data)
        self.assertIn('font-size:22px', payload['html'])
        self.assertIn('font-size:34px', payload['html'])
        self.assertIn('<strong>/uploads/&lt;photo&gt;.png</strong>', payload['html'])
        self.assertIn('Pillow &amp; blanket', payload['html'])
        self.assertIn('Files deleted', payload['html'])
        self.assertIn('Catalog monitoring check failed', payload['html'])
        self.assertIn('/uploads/<photo>.png', payload['text'])
        self.assertNotIn('<photo>', payload['html'])

if __name__ == '__main__':
    unittest.main()
