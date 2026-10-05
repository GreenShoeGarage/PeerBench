# Third-party notices

PEERBENCH application code is Copyright (c) 2026 Green Shoe Garage / Michael Parks, licensed under GNU GPL version 3 only. See LICENSE. No warranty is provided.

The release redistributes these permissively licensed components in bundled form. Their original licenses are retained in vendor/:

| Component | Version | License | Use |
|---|---|---|---|
| Yjs | 13.6.33 | MIT | Collaborative data structures |
| lib0 | 0.2.119 | MIT | Yjs utilities |
| isomorphic.js | 0.2.5 | MIT | Yjs dependency |
| ws | 8.18.3 | MIT | WebSocket server |
| esbuild | 0.25.12 | MIT | Development-only bundler; not required to run |

The server also uses Node.js built-in modules, including node:sqlite. Node.js, Docker base images, and test browsers are not included in the downloadable ZIP.

Project source is provided in src/, server/server.mjs, scripts/, and tests/. Prebuilt app.js and server/peerbench.mjs can be regenerated using the included package-lock.json and npm run build.
