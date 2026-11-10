#!/usr/bin/python3
"""Install a double-click local backup refresher without enabling a schedule."""
from pathlib import Path
import shutil

scripts = Path(__file__).resolve().parent
destination = Path.home() / 'Website Backups/pineneedledesigns.website'
tools = destination / '.backup-tools'
tools.mkdir(parents=True, exist_ok=True)
shutil.copy2(scripts / 'backup-uploaded-media.py', tools / 'backup-uploaded-media.py')
shortcut = destination / 'Refresh Local Backup.command'
shutil.copy2(scripts / shortcut.name, shortcut)
shortcut.chmod(0o700)
print('Installed: ' + str(shortcut))
