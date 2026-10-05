# PEERBENCH v1.0.0 verification

**Result: 25 named checks passed** across the model/server suite (6), browser workflow suite (16), and release/recovery suite (3). No uncaught browser JavaScript errors were observed in the complete workflow suite.

Verification completed October 4, 2026 (America/New_York; October 5 UTC).

## Environment

- Linux execution environment, Node.js 24.19.0.
- Headless Chromium 153 driven through Playwright 1.62.1.
- Real IndexedDB, service workers, WebSockets, Web Crypto, and RTCPeerConnection.
- Isolated browser contexts represent independent device storage.
- A local STUN responder supplies loopback candidates for WebRTC in the isolated network. Actual encrypted data channels were established; this was not a simulated peer API.
- Default configuration with no STUN also exercised the real encrypted WebSocket relay path.
- Desktop: 1440 × 1000. Mobile layout: 390 × 844.

## Model and server suite — 6 passed

1. Concurrent offline text edits converge with both contributions retained.
2. Different task-field edits merge; duplicate updates are idempotent.
3. Encryption round trip; incorrect key, incorrect room, and modified ciphertext are rejected.
4. Portable backup validation and state preservation; malformed/unsupported backups rejected.
5. Valid invitation parsing and malformed/unsafe server URL rejection.
6. Server relay, incorrect capability rejection, persisted replay after process restart, no plaintext content in the SQLite file, static-file allowlist, and Origin rejection.

## Browser workflow suite — 16 passed

1. Create a sample room and render all board stages.
2. Join through a private invitation and establish a real WebRTC data channel.
3. Concurrent notebook edits converge without losing either contribution.
4. Independent offline edits merge after explicit disconnection and reconnection.
5. Chat and task changes reach a second browser.
6. Task search, duplication, trash, and restoration.
7. Chunked peer attachment transfer with checksum verification; downloaded bytes match.
8. Complete JSON backup includes local attachment bytes and excludes invitation keys.
9. Light, dark, and high-contrast theme switching.
10. Mobile layout without horizontal page overflow; navigation opens and closes.
11. Document-style print view and a two-page A4 PDF rendered by Chromium.
12. A third device retrieves the encrypted archive with original peers disconnected.
13. Backup restoration into a separate room, including attachment bytes.
14. Offline app reload, offline editing, and persistence through another offline reload.
15. Fresh empty room, note creation, text-only undo/redo, deletion, and restoration.
16. No uncaught browser JavaScript errors across those workflows.

## Release and recovery suite — 3 passed

1. A copied standalone release runs from a clean temporary directory with no node_modules.
2. A 2 MiB encrypted relay file transfer is interrupted, the receiving browser reloads, and the transfer resumes; final bytes match exactly.
3. A saved snapshot restores earlier note text into a new room while retaining the original room.

## Visual review

Reviewed the welcome view, desktop board, mobile board, and dark theme. Corrected a mobile navigation overlap. Note undo was scoped to the active note’s text so typing undo does not remove a newly created note. Theme screenshots should be taken with animations disabled or after transitions finish.

## Reproduce

For data/server checks:

```sh
npm ci
npm test
```

For browser checks, install Playwright and its Chromium separately:

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/browser.cjs
node tests/recovery.cjs
```

An existing installation can be supplied through `PLAYWRIGHT_MODULE` and an existing browser executable through `CHROMIUM_PATH`. Test servers start on localhost ports 18787, 18789, and 18987. The browser suite starts a local test STUN responder on UDP 19303. Generated output is written under tests/out/ and is excluded from the release package.

## Limits of verification

No external deployment, user-account connection, real-world NAT traversal, configured external TURN service, Docker execution, 10-device load, Safari, Firefox, or physical iOS/Android device was tested. The included Docker and reverse-proxy configurations are deployment aids, not evidence of a deployed service. Browser storage eviction, hostile-room denial of service, cryptographic protocol review, and extended archival-scale operation need further validation before uses that require those guarantees.

This release is intended for small, trusted teams, with all members having equal editing access. See README for quotas, recovery boundaries, and data ownership details.
