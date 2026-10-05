# v1.2.0 — 2026-10-05

- Batch A: safe Markdown preview, Quill/Yjs rich-text binding, encrypted ephemeral cursors, material links, formatted revisions and exports.
- Batch B: collaborative vector whiteboard, keyboard inspector, shapes/connectors/notes/sketches/images, pan/zoom, SVG/PNG and printable output.
- Batch C: persistent transfer queues, pause/cancel/retry, 50 MiB files, chunk recovery, optional encrypted attachment archive and quotas.
- Fixed rich-editor event delegation and stable file controls during progress; kept schema-1 backups and older rooms readable.
- Updated ws to 8.22.0 and DOMPurify to 3.4.16 after dependency review.

# v1.1.0 — 2026-10-05

- Batches A–B: reconnect backoff, diagnostics, archive usage, atomic encrypted checkpoints and local compaction.
- Batches C–D: task-field history and conflict candidates; selective restore; saved note revisions; storage, partial-download cleanup, and local room archive/reopen.
- Preserve schema-1 backups, room keys, and existing SQLite/IndexedDB records. No automatic deployment.

# Changelog

## 1.0.0 — 2026-10-04

- First complete collaboration workbench with local rooms, boards, notebooks, conversation, and attachments.
- Added encrypted room invitations/signaling, WebRTC data channels, WebSocket relay fallback, and optional encrypted server archive.
- Added local autosave, portable backups, snapshots, trash, fresh start, and printable reports.
- Added responsive desktop/mobile interfaces, keyboard operation, three themes, and offline app caching.
- Included prebuilt static files, a standalone Node 24 server, Docker packaging, source, tests, documentation, and GPL v3 licensing.
