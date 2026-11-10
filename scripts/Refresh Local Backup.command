#!/bin/bash
# Run from the repository's scripts folder or the installed local backup folder.
script_directory="$(cd -- "$(dirname -- "$0")" && pwd)"
backup_destination="$HOME/Website Backups/pineneedledesigns.website"
backup_script="$script_directory/.backup-tools/backup-uploaded-media.py"
if [ ! -f "$backup_script" ]; then
  backup_script="$script_directory/backup-uploaded-media.py"
fi
printf 'Refreshing Pine Needle Designs local catalog and uploaded media backup…\n'
printf 'Keep this window open until the backup finishes.\n\n'
/usr/bin/python3 "$backup_script" --destination "$backup_destination"
backup_result=$?
if [ "$backup_result" -eq 0 ]; then
  printf '\nBackup command finished. Check backup-status.json for the latest completion time and missing-file report.\n'
  /usr/bin/open "$backup_destination"
else
  printf '\nBackup failed. Existing completed backups are retained. Check the error above and try again.\n'
fi
if [ -t 0 ]; then
  read -r -p 'Press Return to close this window. ' ignored_reply
fi
exit "$backup_result"
