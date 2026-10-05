# PEERBENCH v1.2.0 verification

**45 named checks passed:** model/server (10), original browser workflows (18), standalone/recovery (3), HTTPS reconnect (1), and v1.2 workflows (13). No uncaught JavaScript errors were observed in either complete browser workflow suite. Completed October 5, 2026 UTC.

## Environment

- Linux, Node.js 24.19.0; headless Chromium 153 through Playwright 1.62.1.
- Real IndexedDB, service workers, Web Crypto, WebSockets, and RTCPeerConnection in isolated browser contexts.
- The original browser suite uses a local test STUN responder to obtain loopback WebRTC candidates. It establishes actual encrypted data channels. Recovery and v1.2 suites also exercise encrypted WebSocket relay without STUN.
- Desktop 1440 × 1000; mobile layout 390 × 844. Viewport emulation is not a physical mobile device test.
- Local self-signed TLS proxy verifies HTTPS/WSS and secure-context behavior. The test browser explicitly trusts that local certificate; no public deployment or certificate was provisioned.

## Model and server — 10 checks

Concurrent offline text convergence; independent task-field merging; duplicate update idempotence; encryption round trip and rejection of wrong key/room/tampering; schema-1 backup and invitation validation; scalar conflict retention and resolution; selective note restore preserving earlier text and unrelated fields; relay/authentication/durable replay/static-file/Origin boundaries; checkpoint recovery and capacity; optional attachment hosting.

The capacity/checkpoint test joins ten authenticated device sockets and rejects an eleventh. It interrupts one checkpoint, commits another while a new tail update arrives, rejects a reused token, and restarts the process to verify checkpoint and tail survival. It tests protocol capacity, not a ten-browser WebRTC mesh.

Attachment checks cover disabled-by-default hosting, idempotent chunk replacement, quota rejection, persisted encrypted bytes after restart, resume frontier reporting, deletion, and absence of known plaintext attachment content in SQLite.

## Existing browser workflows — 18 checks

Create/sample; real WebRTC invitation; simultaneous notebook edits; offline edits and reconnect; chat/tasks; search/duplicate/trash/restore; peer attachment transfer with exact byte comparison; shared note revision comparison and restore; local and encrypted server compaction; backup with local attachment bytes and without invitation keys; three themes; mobile navigation without overflow; printable project report; late arrival from archive; independent backup restore; offline reload/edit/reload; empty-room note undo/redo and recovery; no uncaught page errors.

## Standalone and recovery — 3 checks

The prebuilt release runs after being copied to a clean directory without node_modules. A 2 MiB relay transfer is interrupted, the receiving browser reloads, and resumed output matches every byte. A snapshot restores prior note text into a separate room.

## HTTPS recovery — 1 check

The browser connects over HTTPS/WSS through a local TLS proxy. The backend stops, a note is edited, and automatic retry reconnects after restart. The latest text survives and receives an encrypted-archive acknowledgement.

## v1.2 workflows — 13 checks

1. Markdown preview renders headings/formatting while removing scripts, event handlers, images, and unsafe link schemes.
2. Rich-text formatting and edits synchronize across browsers, with a visible remote caret and collaborator name available on its flag.
3. Material links open a referenced task.
4. Shared shapes, notes, connector, sketch, undo/redo, zoom/fit, and SVG/PNG exports.
5. A 12 MiB attachment exceeds the previous limit; encrypted hosting pauses and resumes.
6. Download pauses, reloads, resumes from persisted chunks, verifies SHA-256, and matches source bytes.
7. Whiteboard images reuse room attachments and embed bytes in SVG export.
8. Notebook and whiteboard fit a 390-pixel viewport without page overflow.
9. A late browser restores rich content, drawing objects, and archived file bytes with original holders offline.
10. Cancel clears a pending transfer; removing a hosted copy keeps local downloaded bytes.
11. Print/PDF report includes formatted notes and a vector whiteboard.
12. Backup restoration and offline reload preserve formatted text, drawing objects, and complete attachments.
13. No uncaught page errors throughout these workflows.

## Review and fixes

Reviewed desktop and mobile notebook/whiteboard screenshots, existing board themes, and printable output. Corrected event delegation that disabled the rich editor when an ancestor matched a note selector. File progress updates now retain buttons and focus instead of replacing controls every chunk. A fresh queue job has its own identity so an immediate retry cannot revive an old paused operation. Whiteboard inspectors save only changed fields to avoid overwriting concurrent unrelated edits.

Dependency review upgraded ws to 8.22.0 and DOMPurify to 3.4.16. The recorded production audit reports no high, critical, or moderate findings, and one low Quill 2.0.3 HTML-export advisory. PEERBENCH sanitizes every Quill HTML preview, report, and export with DOMPurify; it never inserts or downloads raw getSemanticHTML output. This mitigation does not substitute for an independent security review.

## Reproduce

```sh
npm ci
npm run build
npm test
npm install --no-save playwright
npx playwright install chromium
node tests/browser.cjs
node tests/recovery.cjs
node tests/https.cjs
node tests/v12.cjs
```

An existing installation can be supplied via PLAYWRIGHT_MODULE and CHROMIUM_PATH. HTTPS verification also requires OpenSSL. Test servers use localhost ports 18787, 18789, 18791, 18793/18794, and 18987; test STUN uses UDP 19303. Tests create disposable data directories. Generated output under tests/out is excluded from releases. The runtime application needs neither Playwright nor npm installation.

## Remaining validation

External deployment, real-world NAT/TURN, Docker execution, Safari, Firefox, ten-browser WebRTC mesh performance, physical iOS/Android devices, long-duration archival load, browser eviction, and hostile-room denial of service remain unverified. The environment had no Docker, Firefox, or Safari available. Supplied deployment files are aids, not evidence of a live deployment. The app is intended for small trusted teams with equal editing access; see README for storage, memory, and recovery boundaries.
