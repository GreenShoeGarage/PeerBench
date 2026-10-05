# Operating PEERBENCH

The server is intentionally small: one Node 24 process, one SQLite database, WebSocket signaling/relay, and a static-file allowlist. It has no user-facing administrative endpoint.

## Local operator tools

Run these in the application directory with the same `DATA_DIR` as the server:

```sh
node server/admin.mjs list
node server/admin.mjs backup /safe/location/peerbench-backup.sqlite
```

The SQLite backup API creates a consistent copy while the server runs. Back up invitation keys separately: encrypted archive bytes are unusable without them.

To retire a room archive, first coordinate with its collaborators and export any desired records. Stop the server, then run:

```sh
node server/admin.mjs delete ROOM_UUID --confirm
```

Restart the server afterward. Connected devices hold their own copies; reconnecting them can recreate the old archive. Operator deletion is not member revocation.

## Updates

Keep the `data/` directory or attached volume. Replace the seven static files and the prebuilt server together. Restart Node. Close all existing tabs once to allow the new service worker to activate, then reopen the app. Client storage and JSON backups use schema 1. No migration is required for this initial release.

## Resource limits

Default: 200 room IDs, 10 live devices per room, 64 MiB encrypted archive per room, 9 MiB maximum WebSocket frame. The per-IP socket cap is 40; messages are limited per socket. These are coarse operational bounds, not a substitute for a reverse proxy or appropriate private-server access controls. Quotas can be adjusted with the documented environment variables where supported.

Plain HTTP on localhost works because browsers treat localhost as a secure context. Network-facing use requires HTTPS. Forward WebSocket upgrades at `/connect`; Caddy does this automatically with the provided reverse_proxy example.

## Connection diagnosis

1. Check `GET /health` returns version 1.0.0.
2. Confirm the app points to the correct `wss://HOST/connect` address.
3. Confirm the frontend Origin is accepted; cross-host use requires ALLOWED_ORIGINS.
4. Check the connection dialog for server status and each peer’s route.
5. If WebRTC cannot connect, server relay should still synchronize records. Configure TURN for networks that need it.
6. Files need a holder online. Resume partial transfers from Files → Resume transfer.
7. If the archive is full, export a backup and restore into a new room; automatic log compaction is not in this release.

The service does not contact public STUN, TURN, or signaling hosts by default. A served config.json is public. Do not embed privileged permanent credentials in it.
