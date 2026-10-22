#!/usr/bin/python3
"""Install the local five-minute media backup as a macOS LaunchAgent."""
import os
from pathlib import Path
import plistlib
import shutil
import subprocess

repo = Path(__file__).resolve().parents[1]
destination = Path.home() / 'Website Backups/pineneedledesigns.website'
destination.mkdir(parents=True, exist_ok=True)
runtime = Path.home() / 'Library/Application Support/Muha Computer Repair/Media Backup'
runtime.mkdir(parents=True, exist_ok=True)
script = runtime / 'backup-uploaded-media.py'
shutil.copy2(repo / 'scripts/backup-uploaded-media.py', script)
shutil.copy2(repo / 'scripts/restore-uploaded-media.py', destination / 'restore-uploaded-media.py')
label = 'com.muhacomputerrepair.pineneedledesigns.media-backup'
plist = Path.home() / 'Library/LaunchAgents' / (label + '.plist')
plist.parent.mkdir(parents=True, exist_ok=True)
job = {
    'Label': label,
    'ProgramArguments': ['/usr/bin/python3', str(script),
                         '--destination', str(destination),
                         '--repository-copy', str(repo / 'backups/pineneedledesigns.website')],
    'WorkingDirectory': str(runtime),
    'RunAtLoad': True,
    'StartInterval': 300,
    'ProcessType': 'Background',
    'LowPriorityIO': True,
    'StandardOutPath': str(destination / 'backup.log'),
    'StandardErrorPath': str(destination / 'backup-error.log'),
}
domain = 'gui/' + str(os.getuid())
subprocess.run(['launchctl', 'bootout', domain + '/' + label], capture_output=True)
with plist.open('wb') as stream:
    plistlib.dump(job, stream)
subprocess.run(['launchctl', 'bootstrap', domain, str(plist)], check=True)
print('Installed five-minute media backup: ' + str(plist))
