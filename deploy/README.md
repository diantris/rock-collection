# Running the app on a Google Cloud VM (free tier)

The private app runs on one small **e2-micro** VM in Google Cloud's always-free tier. Only your home internet connection can reach it, so every device at home can use it and nothing else can.

## How it fits together

- **Updates are automatic.** When something is merged to `master`, GitHub Actions (`.github/workflows/ci.yml`) runs the tests. If they pass, it publishes two images to GitHub's container registry: `ghcr.io/diantris/rock-collection-api` and `ghcr.io/diantris/rock-collection-frontend`.
  - Every 5 minutes the VM runs `update.sh` (by cron), which pulls new images and changed files from this repo and restarts whatever changed.
  - A merge is live about 10 minutes later. The VM never builds anything.
- **Three containers** (`docker-compose.yml`):
  - **Postgres**;
  - **the API**;
  - **the frontend**: the app's files served by Caddy, which also passes `/api/…` to the API.
- **HTTPS and the address.** Caddy serves `https://<name>.duckdns.org` with a free Let's Encrypt certificate and renews it by itself.
  - The VM's free IP can change (only when the VM is stopped and started). **DuckDNS** gives it a fixed name, and `duckdns.sh` keeps that name pointing at the current IP.
- **The lock.** The **GCP firewall** lets only your home IP in.
  - Let's Encrypt can't get through it either, so Caddy proves it owns the name through a DNS record at DuckDNS instead.
- **Backups.** `backup.sh` dumps the database every night to a private Cloud Storage bucket, and the bucket deletes dumps older than 30 days. Photos aren't in the dump: they live in the Pages repo.
- **Secrets stay on the VM.** The GitHub token, the DuckDNS token and the database password live only in `deploy/.env` on the VM, never in git.

**Free tier limits that matter:**
- 1 e2-micro in **us-east1, us-central1 or us-west1**;
- a 30 GB standard disk;
- 200 GB of outbound traffic a month on the **Standard** network tier (only 1 GB on the default Premium tier, so the commands below choose Standard);
- 5 GB of Cloud Storage in those regions.

This app uses a small fraction of each.

## One-time setup

Nothing needs installing on your PC. The `gcloud` commands run in **Cloud Shell**, the `>_` button at the top right of the Google Cloud console, which opens a terminal in the browser. Paste each block, replacing the CAPITALS.

### 1. Make the images public

This only needs doing once, after the first merge with this folder.
1. Wait until the **CI** run on `master` is green (the repo's *Actions* tab).
2. On GitHub, open your profile → *Packages*. For each of `rock-collection-api` and `rock-collection-frontend`: *Package settings* → *Change visibility* → **Public**.

This lets the VM download them without a login. They hold only the app's code, which is public anyway; secrets are never in images.

### 2. Google Cloud account and project

1. Sign in at <https://console.cloud.google.com> and accept the free trial / free tier. Google asks for a card, but the free-tier VM isn't charged.
2. **A budget alert**, so anything that isn't free shows up straight away: *Billing* → *Budgets & alerts* → *Create budget*, e.g. $1, with email alerts.
3. **A project:** the project picker at the top → *New project* → name it `rock-collection`. Select it.
4. In Cloud Shell, run:
   ```sh
   gcloud config set project PROJECT_ID          # shown in the project picker, e.g. rock-collection-123456
   gcloud services enable compute.googleapis.com
   ```

### 3. Your home IP

Open <https://ifconfig.me> **in a browser at home**. Don't use Cloud Shell for this: there, `curl ifconfig.me` shows Google's address, not yours. The number it shows is `HOME_IP` below.

### 4. The VM and its firewall

```sh
gcloud compute instances create rock-collection --zone=us-east1-b --machine-type=e2-micro \
  --image-family=debian-12 --image-project=debian-cloud \
  --boot-disk-size=30GB --boot-disk-type=pd-standard \
  --tags=rock-collection --scopes=default,storage-rw --network-tier=STANDARD

# The app (HTTP and HTTPS) from home only
gcloud compute firewall-rules create rock-collection-web --allow=tcp:80,tcp:443 \
  --source-ranges=HOME_IP/32 --target-tags=rock-collection
# SSH from home and from Google's range for the console's "SSH" button, instead of from anywhere
gcloud compute firewall-rules update default-allow-ssh --source-ranges=HOME_IP/32,35.235.240.0/20
# Remote desktop is for Windows VMs: not needed
gcloud compute firewall-rules delete default-allow-rdp --quiet
```
If you create the VM in the console instead, **don't** tick "Allow HTTP/HTTPS traffic": that opens the app to everyone.

### 5. The backup bucket

Bucket names are shared by everyone on Google Cloud, so add something of your own, e.g. `rock-collection-backups-7f3k`.

```sh
gcloud storage buckets create gs://BUCKET --location=us-east1 --uniform-bucket-level-access --public-access-prevention
echo '{"rule":[{"action":{"type":"Delete"},"condition":{"age":30}}]}' > lifecycle.json
gcloud storage buckets update gs://BUCKET --lifecycle-file=lifecycle.json
```
The dumps contain everything, including prices and private notes, so the bucket must stay private (the flags above make sure of that).

### 6. DuckDNS

1. Sign in at <https://www.duckdns.org>.
2. Create a subdomain, e.g. `NAME` for `NAME.duckdns.org`. Choose something that doesn't give your name away.
3. Note the **token** shown at the top of the page.

You don't need to enter an IP; the VM fills it in.

### 7. A GitHub token for the VM

On GitHub: *Settings* → *Developer settings* → *Fine-grained tokens* → *Generate new token*.
- **Repository access:** only `diantris/rock-collection-page`.
- **Permissions:** *Contents: Read and write*.

Make a new one rather than reusing the PC's, so either can be revoked on its own. Keep the page open; you'll paste the token in step 8.

### 8. Set up the VM

In the console: *Compute Engine* → *VM instances* → **SSH** next to `rock-collection`. A terminal opens in a new window.

```sh
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/diantris/rock-collection.git
cd rock-collection/deploy
sudo sh setup-vm.sh
nano .env
```
In `nano`, fill in `DUCKDNS_DOMAIN` (just `NAME`), `DUCKDNS_TOKEN`, `GITHUB_TOKEN` and `BACKUP_BUCKET` (just the name, without `gs://`). Leave the generated `POSTGRES_PASSWORD` alone.

Save with **Ctrl+O, Enter**, quit with **Ctrl+X**. Then close the SSH window and open a new one, so Docker works without `sudo`.

```sh
cd ~/rock-collection/deploy
sh duckdns.sh && sh update.sh
```
The first run downloads everything, which takes a few minutes. After that, cron keeps it running.

### 9. Move your collection over

**On your PC**, in PowerShell (the app's containers must be running):
```powershell
docker exec rockcollection-db pg_dump -U rockuser -Fc -f /tmp/rockdb.dump rockdb
docker cp rockcollection-db:/tmp/rockdb.dump $HOME\Desktop\rockdb.dump
```
Use `docker cp` exactly as above, not `>` to save the file. PowerShell would quietly damage the dump.

**Upload the dump:** in the VM's SSH window, use *Upload file* (the button at the top) and choose `rockdb.dump` from your Desktop. It lands in the home folder.

**On the VM:**
```sh
cd ~/rock-collection/deploy
docker compose stop api
docker compose cp ~/rockdb.dump db:/tmp/rockdb.dump
docker compose exec -T db pg_restore -U rockuser -d rockdb --clean --if-exists --no-owner /tmp/rockdb.dump
docker compose exec -T db psql -U rockuser -d rockdb -tAc "select count(*) from specimen"
docker compose start api
rm ~/rockdb.dump
```
The count should match your collection (363 as of Day 13). Delete `rockdb.dump` from your Desktop too: it contains your private notes and prices.

### 10. Open it

Go to `https://NAME.duckdns.org`. The very first visit can take a minute or two while Caddy gets the certificate (`docker compose logs frontend` shows the progress).

Bookmark it on every device at home.

### 11. Retire the PC's copy for publishing

From now on **the VM is the real app**. If you edit or publish from the PC's app, the two copies drift apart, and a publish from the PC would overwrite the public site with old data.

Remove the token from the PC: delete the value after `GITHUB_TOKEN=` in the repo's root `.env`, then restart the API (`docker compose up -d api`). The PC's app can then no longer publish by accident and stays useful for trying things out.

## Day to day

- **New version:** merge to `master`. Within about 10 minutes it's live. The API is down for ~30 seconds while it restarts, and Flyway updates the database.
  - To deploy straight away: `sh ~/rock-collection/deploy/update.sh`.
  - What was deployed: `journalctl -t rock-collection`.
- **The app suddenly doesn't load at home:** your internet provider probably gave you a new IP. Check <https://ifconfig.me>, then in Cloud Shell:
  ```sh
  gcloud compute firewall-rules update rock-collection-web --source-ranges=NEW_IP/32
  gcloud compute firewall-rules update default-allow-ssh --source-ranges=NEW_IP/32,35.235.240.0/20
  ```
- **Publishing says the token is wrong or expired:** fine-grained tokens expire. Make a new one (step 7) and put it in `.env` on the VM (`nano ~/rock-collection/deploy/.env`). It applies within 5 minutes.
- **Logs:**
  - `docker compose logs -f api` (from `~/rock-collection/deploy`);
  - the cron jobs: `journalctl -t rock-collection`.

## Backups

- List them: `gcloud storage ls gs://BUCKET`.
- Restore one: `gcloud storage cp gs://BUCKET/rockdb-YYYY-MM-DD.dump ~/rockdb.dump` on the VM, then the VM part of step 9.

## Updating Postgres

`update.sh` updates only the app, never the database, so it can't restart by surprise.

- **Patch releases** (18.x):
  ```sh
  docker compose pull db && docker compose up -d db
  ```
- **A new major version** (19) needs a dump and restore. Don't just change the image tag.
