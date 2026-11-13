"""Uploads each numbered folder's photos to its specimen, in waves.

Usage: python upload_photos.py MINUTES
Starts no new stone after MINUTES; skips stones that already have photos, so re-running continues where it stopped.
Photos go in file-name order (1-front is the cover). Env: PHOTOS_DIR (the folder of '{id}-name' folders), API_URL.
"""
import json, os, re, sys, time, urllib.error, urllib.request, uuid

ROOT = os.environ.get('PHOTOS_DIR', r'E:\vscode_dev\rock-collection-photos')
API = os.environ.get('API_URL', 'http://localhost:8080/api')
deadline = time.time() + float(sys.argv[1]) * 60


def natural_key(s):
    return [int(p) if p.isdigit() else p.lower() for p in re.split(r'(\d+)', s)]


def get(path):
    with urllib.request.urlopen(API + path, timeout=60) as r:
        return json.loads(r.read())


def upload(sid, files):
    boundary = uuid.uuid4().hex
    body = b''
    for f in files:
        ctype = 'image/png' if f.lower().endswith('.png') else 'image/jpeg'
        with open(f, 'rb') as fh:
            data = fh.read()
        body += (f'--{boundary}\r\nContent-Disposition: form-data; name="files"; filename="{os.path.basename(f)}"\r\n'
                 f'Content-Type: {ctype}\r\n\r\n').encode() + data + b'\r\n'
    body += f'--{boundary}--\r\n'.encode()
    req = urllib.request.Request(f'{API}/specimens/{sid}/photos', data=body, method='POST', headers={
        'Content-Type': f'multipart/form-data; boundary={boundary}', 'X-Rock-Collection': 'photo-upload'})
    with urllib.request.urlopen(req, timeout=900) as r:
        return len(json.loads(r.read()))


done = skipped = 0
for d in sorted(os.listdir(ROOT), key=natural_key):
    m = re.match(r'(\d+)-', d)
    if not m or not os.path.isdir(os.path.join(ROOT, d)):
        continue
    sid = int(m.group(1))
    if get(f'/specimens/{sid}/photos'):
        skipped += 1
        continue
    files = sorted((os.path.join(ROOT, d, f) for f in os.listdir(os.path.join(ROOT, d))
                    if f.lower().endswith(('.png', '.jpg', '.jpeg'))), key=lambda p: natural_key(os.path.basename(p)))
    if not files:
        continue
    while True:
        if time.time() > deadline:
            print(f'Time is up: stopped before #{sid}. Uploaded {done} stones this wave.', flush=True)
            sys.exit()
        try:
            n = upload(sid, files)
            done += 1
            print(time.strftime('%H:%M:%S'), f'#{sid} {d}: {n} photos', flush=True)
            break
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors='replace')
            if e.code == 503 and 'GITHUB_TOKEN' in msg:  # no token: every stone would fail the same way
                sys.exit(f'Stopped: {msg}')
            if e.code == 503:  # GitHub rate limit: wait and try the same stone again
                print(time.strftime('%H:%M:%S'), f'#{sid}: GitHub says wait ({msg}); retrying in 5 min', flush=True)
                time.sleep(300)
                continue
            print(time.strftime('%H:%M:%S'), f'#{sid} {d}: FAILED {e.code} {msg}', flush=True)
            break
print(f'All folders done. Uploaded {done} stones this wave, {skipped} already had photos.', flush=True)
