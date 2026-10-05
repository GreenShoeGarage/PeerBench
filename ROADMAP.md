# PEERBENCH roadmap

## v1.0.0 — a useful shared workbench

Delivered as four implementation batches:

1. Local rooms, task board, notes, conversation, autosave, and blank/sample paths.
2. Authenticated room-capability exchange, encrypted signaling, WebRTC channels, relay fallback, and an optional durable encrypted archive.
3. Attachment transfer, integrity checks, partial-download recovery, snapshots, backup/restore, and printable output.
4. Responsive and theme review, end-to-end verification, standalone server bundling, and deployment documentation.

## v1.1 — long-lived rooms (implemented)

- Encrypted archive compaction with recovery from interrupted checkpoints.
- More informative scalar-field conflict review and selective version history.
- Operational room management and quota displays in the app.
- Ten-device protocol capacity verified. External TURN, physical mobile, Safari, Firefox, and Docker execution remain deployment validation tasks; unavailable in this environment.

## v1.2 — a richer shared surface (implemented)

- Sanitized preview, Quill/Yjs shared formatting, cursor awareness, material links, and formatted history.
- Shared shapes, connectors, sticky notes, sketches, raster images, inspector, pan/zoom, and SVG/PNG exports.
- Persistent transfer queues with pause/cancel/retry, chunk recovery, 50 MiB files, and optional encrypted attachment hosting.

## v2 candidates

- Verified identities, enforceable per-document roles, membership changes, and key rotation.
- Voice, video, and screen sharing with explicit media controls.
- A reusable collaboration module for other Field Instruments.

Each milestone is subject to use and review. Reliability and clear recovery take priority over adding new surfaces.
