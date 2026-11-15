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

## Message box (`message-box/Code.gs`)

Not run here: it's a Google Apps Script that lives in the owner's Google Sheet. It's the back end of the message box on the public site's specimen pages. A visitor types up to 300 characters and clicks Send, and the script adds a row to the sheet's **Messages** tab: when, the specimen number, the stone's name and the message. Nothing is published, and nobody needs an account.

The script checks everything again, because anyone can send it anything:
- It cuts messages to 300 characters.
- It replaces every link with `[link removed]`, unless the link goes to mindat.org. Email addresses are kept, so people can ask for a reply.
- It stops text from running as a spreadsheet formula.
- It quietly drops anything that filled in a hidden trap field, which only bots do.
- **Spam limits.** Google doesn't tell the script who sent a message, so these go by what's already in the sheet. A message identical to one already saved for the same stone isn't saved again (ignoring case and spacing). At most **5 messages an hour per stone** and **100 an hour in all** are saved. The sender always sees the same thank-you, so bots learn nothing. The numbers are `PER_STONE_PER_HOUR` and `PER_HOUR` at the top of the script.

The page adds one more limit: a browser that has sent 3 messages about a stone gets "Thank you, I'm still reviewing your previous messages about this stone." on the next try, and nothing is sent. The count is kept per stone in that browser (`localStorage`), so it doesn't stop anyone writing about other stones.

### Set-up (about 10 minutes, once)

1. **Create the sheet and paste the script.**
   1. In Google Drive, create a new Google Sheet, e.g. "Rock collection messages".
   2. Choose **Extensions → Apps Script**.
   3. Replace the editor's contents with all of `message-box/Code.gs`, then save (Ctrl+S).
2. **Deploy it as a web app.**
   1. Choose **Deploy → New deployment**, and click the cog next to "Select type" → **Web app**.
   2. Set **Execute as:** *Me*, and **Who has access:** *Anyone*. *Anyone* means visitors can send messages. Only you can read the sheet.
   3. Click **Deploy**, then **Authorize access** and pick your account.
   4. Google warns that it "hasn't verified this app", because it's your own script. Choose **Advanced → Go to … (unsafe)**, then **Allow**. The script can only use this spreadsheet.
3. **Check it and connect it to the site.**
   1. Copy the **Web app URL** (it ends in `/exec`). Opening it in a browser should say "The message box is working."
   2. In the app, open **Publish**, paste the address into **Message box address**, and click outside the field. It saves itself.
   3. Click **Publish**. Every specimen page then gets the box.

To remove the box, empty the address and publish again.

**Updating the script later:** paste the new code, then choose **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. That keeps the same address. A *new* deployment would get a new address, which would have to go into the Publish dialog.

**If spam ever gets through:** delete the rows. If it keeps coming, empty the address and publish to switch the box off, then ask for a CAPTCHA to be added.
