# Scripts

Small helper scripts run by hand against the local app, kept so they can be reused, or written up later. They are not part of the app and aren't built or deployed.

They talk to the API over HTTP like the app does, so they send the `X-Rock-Collection` header, and they need the stack running (`docker compose up`). They use only the Python standard library.

| Script | What it does | Run it again? |
|---|---|---|
| [`import_folders.py`](import_folders.py) | The Day 11 bulk import. It turned each photo folder (`agate-moss-2`, `opal-boulder-koroit-australia-1`, …) into a specimen and renamed the folder to `{id:03d}-{old name}`. Name, nature, country/locality and tentative components come from a hand-written reading of each folder name. `--go` imports; without it, it only prints the plan. It writes `_import-log.csv` (id, old folder, new folder, name) into the photo folder. | No. It stops as soon as any folder is numbered, so nothing is imported twice. Kept as a record of how the collection was seeded. |
| [`upload_photos.py`](upload_photos.py) | Uploads each numbered folder's photos to its specimen, in file-name order (`1-front` becomes the cover). `python upload_photos.py 80` starts no new stone after 80 minutes. It skips specimens that already have photos, so running it again carries on where it stopped. On a GitHub rate limit (503) it waits 5 minutes and retries. Without a GitHub token it stops at once. | Yes, for new stones: add the specimen in the app, name its folder `{id}-name…`, run the script. |

Both read `PHOTOS_DIR` (default `E:\vscode_dev\rock-collection-photos`) and `API_URL` (default `http://localhost:8080/api`).

**Photos are public as soon as they're uploaded.** They're pushed to the public Pages repo straight away, before you publish. Upload only real photos. Don't run these scripts against the owner's database to try them out either: they create specimens and use up public numbers. Use a throwaway stack, as for the e2e tests in `CLAUDE.md`.

For the record: on Day 11 the upload of all 363 stones (727 photos) took 36 minutes, about 5 seconds a stone, and never hit GitHub's rate limit.
