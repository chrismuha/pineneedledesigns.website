# Investigation: 86 missing media references

Recorded (UTC): 2026-10-24T23:53:16.677799+00:00

## Assessment

October 7 deployment is the leading explanation; October 18 deletion is not confirmed.

Circumstantial evidence; exact deletion times and attribution of all 86 files remain unproven.

## Incident description

Suspected cause: Inadvertent removal of uploaded media during an automated security-maintenance deployment. A deployed change temporarily removed the Git ignore rule protecting uploaded media, leaving those files subject to deletion by the deployment cleanup command (git clean -fd).

The cleanup exposure is supported by the deployed revisions and a non-destructive reproduction. Attribution of all 86 missing files to that event, the security-maintenance characterization, and responsibility are not independently confirmed by the retained deletion records. The exact deletion times remain unknown.

## October 18 deployment review

October 18, 2026 was the date raised for review. The production server deployed `2f3f16c` at 7:33:03 p.m. Eastern that day. The uploads ignore rule was in place, and the isolated cleanup dry run preserved uploaded media under that revision. October 18 is therefore not established as the deletion event. October 7 remains the leading explanation; the exact historical cause and deletion times remain unconfirmed.

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
