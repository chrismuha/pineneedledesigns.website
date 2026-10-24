# Investigation: 86 missing media references

Recorded (UTC): 2026-10-24T23:53:16.677799+00:00

## Assessment

October 7 deployment is the leading explanation; October 18 deletion is not confirmed.

Circumstantial evidence; exact deletion times and attribution of all 86 files remain unproven.

## Evidence

- October 7, 2026, **8:15:15 p.m. Eastern** (October 8, 00:15:15 UTC): the production server deployed `fe821c5`. This revision removed `backend/uploads/*` from `.gitignore`, while deployment still ran `git clean -fd`.
- October 7, **8:26:33 p.m. Eastern** (October 8, 00:26:33 UTC): production deployed `8f6e7ab`, restoring uploaded-media ignore rules.
- October 18, **7:33:03 p.m. Eastern** (23:33:03 UTC): production deployed `2f3f16c`; uploaded media was protected by the restored ignore rule.
- An isolated, non-destructive `git clean -nd` reproduction would remove a sample upload with the October 7 unprotected rules, but preserve it under the restored rules and the October 18 revision.
- 85 of the 86 missing filenames encode upload dates from July 10 through September 21, 2026. These dates do not establish deletion times.
- No original missing filenames matched historical object paths in the available Git history. This does not rule out renamed copies or external backups.
- Historical GitHub deployment logs for October 18 were unavailable in the queried run history. Server Git reflog entries confirm the deployments independently.

## Source revisions

- [Ignore rule removed: fe821c5](https://github.com/chrismuha/pineneedledesigns.website/commit/fe821c5)
- [Ignore rule restored: 8f6e7ab](https://github.com/chrismuha/pineneedledesigns.website/commit/8f6e7ab)
- [October 18 revision: 2f3f16c](https://github.com/chrismuha/pineneedledesigns.website/commit/2f3f16c)

## Limits

The files were already missing by the October 21 backup. No retained deletion log or earlier complete media inventory establishes exactly when each file disappeared. Do not treat October 7 as a confirmed deletion date, or rewrite the unknown dates in the missing-item records. This entry is an investigation note, not a new successful backup run.
