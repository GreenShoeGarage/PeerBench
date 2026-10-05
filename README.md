# PEERBENCH

**Make together. Keep your work.** A local-first collaboration room for makers, small teams, workshops, and project partners.

Version **1.2.0** · Green Shoe Garage · **GNU GPL v3 only**

**CREATE → INVITE → MAKE → KEEP**

![PEERBENCH shared workbench](docs/images/peerbench-desktop.png)

## Run it

Install **Node.js 24 or newer**, extract this ZIP, open a terminal in its folder, and run:

```sh
node server/peerbench.mjs
```

Open **http://localhost:8787**. This works on macOS, Windows, and Linux where Node 24 is available. No npm install, compilation, account, or external service is required to run the release. The prebuilt server and browser code are included.

Create a room, or choose **Explore a sample**. All rooms start local. Choose **Invite people → Save & connect**, then copy the invitation into a second browser profile or send it to a collaborator using your deployed HTTPS address.

`localhost` points to the person’s own computer: a localhost invitation will not connect a friend on another computer. For remote collaboration, deploy the app and server at a reachable HTTPS address as described below. Opening `index.html` with `file://` is not supported.

## What works

- Multiple rooms with editable names, local archive/reopen, storage usage, compaction, and private invitation links.
- Field-level task history, reviewable concurrent edits, named notebook revisions, comparisons, and selective restoration.
- Automatic reconnect with bounded exponential backoff; downloadable connection diagnostics exclude invitation keys, credentials, names, and IP addresses.
- Task boards with three stages, descriptions, assignees, dates, labels, priorities, search, filtering, sorting, duplication, and trash recovery. Move cards by dragging or by changing the stage in their editor.
- Shared notebook with Text, sanitized Markdown Preview, and Format modes. Quill + y-quill bind formatting to the existing Y.Text; encrypted ephemeral awareness carries collaborator cursors. Saved revisions include formatting. Material links open tasks, notes, and files within the room. Plain notes export Markdown; formatted notes export sanitized HTML.
- Shared whiteboard: sticky notes, rectangles, ellipses, anchored connectors, freehand sketches, and raster images from room files. Select/move, numeric inspector, keyboard movement, undo/redo, pan, zoom, fit, and SVG/PNG export. Limit: 500 visible objects, 1,500 points per stroke. Diagrams and formatted notes appear in the printable report.
- Persistent room conversation with display names and timestamps.
- WebRTC data channels, encrypted signaling, and encrypted WebSocket relay fallback. The UI reports actual connection state.
- Optional encrypted server archive for notes, cards, conversation, and file metadata. Later arrivals can catch up while other devices are closed.
- File attachments: up to 50 MiB each and 250 MiB per room including trash. Persistent sequential queues, pause/cancel/retry, chunk-level recovery after reload, SHA-256 verification, and optional encrypted attachment hosting. Downloads can use a connected holder or an archived copy.
- IndexedDB autosave with separate local-save, peer-receipt, and server-archive indicators.
- JSON backup/restore, local snapshots, recoverable task/note/file trash, and fresh empty rooms.
- A printable project report suitable for Save as PDF.
- Warm light, dark, and high-contrast appearances; collapsible navigation and conversation; persistent desktop conversation width; keyboard controls and responsive layouts.
- Service-worker caching for offline use after a successful first load. No CDN runtime dependencies, telemetry, or AI.

## What goes on a static host?

Copy these **eight files together**, preserving their names:

```text
index.html
app.js
app.css
notebook.css
sw.js
manifest.webmanifest
icon.svg
config.json
```

They can live at the root or under a route such as `/peerbench/`. They require no build step. Configure `config.json` with your companion server’s WebSocket address when the server runs elsewhere:

```json
{
  "signalingUrl": "wss://peerbench-server.example.com/connect",
  "iceServers": [],
  "persistByDefault": true
}
```

On the server, set `ALLOWED_ORIGINS` to the exact frontend origin, such as `https://mbparks.com` (no path or trailing slash). Multiple origins may be comma-separated. Restart the server after changing its environment. If the app and server share a hostname, the default same-host origin check is sufficient.

The static files provide offline individual use. Cross-device collaboration also needs the included server or a compatible deployment of it. Uploading only `index.html` is not enough.

## Host the complete app

The Node server serves the eight static files and `/connect` from one origin. Put it behind an HTTPS reverse proxy; an example Caddy configuration is in `docs/Caddyfile.example`.

```sh
# Node: configurable port and durable directory
PORT=8787 DATA_DIR=/path/to/peerbench-data node server/peerbench.mjs
```

For PowerShell:

```powershell
$env:PORT = "8787"
$env:DATA_DIR = "C:\peerbench-data"
node server/peerbench.mjs
```

Or use Docker Compose:

```sh
docker compose up -d --build
```

Compose binds only to `127.0.0.1:8787` by default; expose it through your HTTPS reverse proxy. The named volume holds encrypted room records. Do not remove that volume during upgrades. Docker downloads a Node image on the first build; the app itself does not compile during this step.

For Railway or a similar Node/container service: deploy the included Dockerfile, attach a persistent volume at `/app/data`, and enable HTTPS. The process reads `PORT`. Configure origin allowlisting if the frontend is elsewhere. This package has not been deployed to any user account automatically.

### Server configuration

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8787` | Listening port |
| `HOST` | `0.0.0.0` | Listening interface |
| `DATA_DIR` | `./data` | Directory for the SQLite archive |
| `ALLOWED_ORIGINS` | Same host | Comma-separated exact allowed frontend origins |
| `MAX_ROOM_MB` | `64` | Encrypted archive quota per room |
| `MAX_ROOMS` | `200` | Maximum distinct room capabilities on this server |

Each room supports up to **10 concurrent device connections**. This is a conservative first-release ceiling, not a paid tier. A browser tab counts as a device connection. The tested collaboration scenarios use two or three isolated browser contexts; 10-device load and real-world mobile-network tests remain to be performed.

## Direct connections, relay, and TURN

The app attempts a WebRTC connection between room participants. Network changes, firewalls, NAT, and browser behavior can prevent this. While connected to the companion server, encrypted WebSocket relay carries the same room updates and requested attachments as a fallback.

No public STUN or TURN service is used automatically. Configure your own in `config.json` or **Invite people → Connection settings → Advanced**:

```json
[
  { "urls": "stun:turn.example.com:3478" },
  {
    "urls": ["turn:turn.example.com:3478?transport=udp", "turns:turn.example.com:5349?transport=tcp"],
    "username": "YOUR_TURN_USERNAME",
    "credential": "YOUR_TURN_CREDENTIAL"
  }
]
```

Use a properly configured TURN service such as coturn, appropriate firewall rules, TLS certificates where applicable, and short-lived credentials where possible. TURN deployment is operator-managed and was not exercised against an external network during this build. Per-room ICE configuration is local and excluded from invitation links. Credentials in a public `config.json` are visible to anyone who loads the app; do not put privileged secrets there.

## Where data lives

| Data | Browser | Companion server |
|---|---|---|
| Shared records | Plaintext IndexedDB, available offline | AES-256-GCM encrypted updates when archive is enabled |
| Invitation key | Local room record; invitation URL fragment until accepted | Never sent to the server |
| Authentication capability | Derived from room key | SHA-256 derived capability used for room access |
| File metadata | Shared with room members | Encrypted with shared records |
| File bytes | On devices that added or received them; partial downloads stored as chunks | Relayed as ciphertext; archived only when hosting is enabled and a member explicitly uploads a copy |
| Snapshots | Local to the device | Not separately uploaded |
| Exported backup | A plaintext download | Not uploaded automatically |

The service can see room IDs, timing, message sizes, IP addresses, and the room access capability. It cannot decrypt content without the invitation key. The HTTPS host delivers executable app code, so users must trust the host to serve the intended application. This is a trusted-team collaboration tool; it has not undergone an independent cryptographic audit.

Everyone with an invitation has full read/write access. Names are self-selected, not verified identities. There are no enforced read-only roles, member revocation, key rotation, or authenticated audit trail in v1.2. To exclude a former collaborator, restore/export into a new room and share its new invitation only with current members; prior copies cannot be recalled.

The archive option is applied by each connected device. Turning it off stops that device uploading new archive entries; it does not erase entries already stored, prevent another member from archiving, or remove copies on other devices.

## Saving, backups, and recovery

- **Saved on this device** means an IndexedDB write completed.
- **Peer receipt confirmed** means a peer acknowledged the latest outgoing update; it is not a guarantee that every collaborator has it or has written it to disk.
- **Encrypted server copy saved** means the server acknowledged the pending archive writes from this session.
- When offline, continue working. Use Save & connect again, or enable automatic reconnection. Devices exchange full CRDT state on reconnection.
- **Backup** exports shared records and file bytes currently held on this device. Files listed but never downloaded are represented by metadata only. Invitations/keys are excluded.
- **Restore a backup** creates an independent local room with a new invitation. It does not merge into or replace a live room.
- **Snapshots & trash** restores deleted tasks, notes, and file metadata. A snapshot restoration opens an independent room and copies any corresponding files available locally.
- **Fresh start** creates a blank room while keeping current work.
- **Remove room from this device** deletes that local room, its snapshots, and local attachment bytes. It does not delete remote copies.
- Browser site-data clearing removes local rooms and their keys. Browser storage may also be evicted. Request persistent storage in Preferences and retain regular backups and invitation links in a safe place.

Back up server data using `node server/admin.mjs backup /absolute/path/backup.sqlite` while the server is running, or stop the server before copying its complete data directory. The archive cannot recover the invitation key. Operator tools are described in `docs/OPERATIONS.md`.

## Boundaries and roadmap

This release is for small, trusted groups. Rich text preserves the existing text CRDT and stores formatting attributes alongside it. Text mode shows the underlying text; editing an unchanged span retains its attributes. Markdown preview interprets unformatted notes; formatted notes preview their rich content. Raw HTML, embedded scripts, remote images, and unsafe link schemes are not rendered. A notebook link is scoped to its current room. Concurrent edits to different task fields merge; simultaneous changes to a task field retain reviewable candidate values in shared history. Choose one in History & recovery → Shared history & conflicts. Old v1.0 clients do not record history; changes made in those clients cannot be reconstructed. Save notebook revisions explicitly; keystrokes are not individually audited.

Peer file transfer requires a connected holder. Archived copies can be downloaded without that holder online. Files are capped at 50 MiB and the room attachment total at 250 MiB; backup imports are capped at 400 MiB. Files transfer and persist in 32 KiB chunks. SHA-256 verification reads one complete file into memory; JSON backup/export also buffers the backup. This is bounded larger-file support, not an unbounded streaming media store. Mobile browsers with little free memory should use smaller rooms. The shared-state encrypted envelope remains limited to 8 MiB; long histories eventually need a new room. Compaction reduces duplication, not total content.

The encrypted archive has a 64 MiB default per-room quota. Use Room actions → Storage & archive to compact it. A client replays the stored updates, encrypts a full checkpoint, and the server atomically replaces only the covered records. Updates arriving during compaction survive. Interrupted or expired checkpoints leave the old archive intact. Compaction retains content and revision history; it is not a history purge. Local compaction merges IndexedDB records within one transaction, including writes from other tabs. At quota, local work remains available; compact or export/restore to a new room.

Next: deployment validation on external TURN, Safari/Firefox, physical mobile networks, and Docker; v2 candidates include authenticated identities, key rotation, enforceable access controls, and optional media sessions. See `ROADMAP.md`.

## Optional encrypted attachment hosting

Hosting is **off by default**. Set `ENABLE_ATTACHMENT_ARCHIVE=1` on the companion server, then restart it. `MAX_ATTACHMENT_MB` defaults to **256 MiB of encrypted storage per room**; encryption and encoding use more space than the original files. These limits are separate from the record archive.

Use **Files → Archive encrypted copy** for each file. No attachment is uploaded automatically. Use **Get from archive** on another device. Upload and download queues pause, retry, and recover their position after reload; a queued transfer restored after a reload starts paused. Cancel discards local partial-download bytes. Canceling an upload preserves already uploaded chunks for a future retry; use **Remove archive copy** after completing the upload, or the local operator’s room deletion, to erase hosted bytes. Server operators can inspect attachment usage with the admin tool. Removing an archive copy does not remove downloaded device copies. Turning hosting off blocks new uploads while allowing existing downloads and removal.

The server stores only encrypted chunks and opaque room/file/chunk identifiers. The room key encrypts each chunk with fresh AES-GCM nonces. The recipient verifies the complete file’s SHA-256 against encrypted shared metadata. The host can still observe sizes, timing, IDs, and access capabilities. Names, content, and hashes are in encrypted messages. Shared metadata may advertise a copy that an operator has since removed; a failed retrieval offers retry or peer download.

## Upgrade from v1.0 / v1.1

1. Export browser backups and make a consistent SQLite backup.
2. Replace the static files and prebuilt server, retaining the data directory and config. The server adds an attachment table without rewriting existing records.
3. Close existing app tabs, then reopen so the waiting service worker activates. The database name and schema-1 backups remain compatible.

New releases read old rooms and backups. Old clients retain unknown CRDT maps but do not display whiteboards or preserve full rich-text behavior in their UI, do not record task history, and retain their 10 MiB file limit. Use v1.2 on all active devices for the new workflows. Restored backups create a new room and clear hosted-copy flags because the new room has a different archive. Local snapshots remain device-local; portable backups include only complete attachments held on the exporting device.

## Develop and verify

The editable source is included under `src/` and `server/server.mjs`. Prebuilt outputs are checked into the package.

```sh
npm ci
npm run build
npm test
```

The build bundles the notebook libraries, sanitizer, and Yjs into `app.js` and ws into `server/peerbench.mjs`. Node built-ins remain external. Browser integration tests are in `tests/browser.cjs`; install Playwright separately to run them, as described in `TEST-REPORT.md`.

See `TEST-REPORT.md` for checks performed and their limits. Application code is GPL-3.0-only; dependency notices are retained in `THIRD-PARTY-NOTICES.md` and `vendor/`.
