FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=8787 DATA_DIR=/app/data
WORKDIR /app
COPY --chown=node:node index.html app.js app.css sw.js manifest.webmanifest icon.svg config.json ./
COPY --chown=node:node server/peerbench.mjs server/admin.mjs ./server/
RUN mkdir -p /app/data && chown node:node /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD node -e "fetch('http://localhost:8787/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/peerbench.mjs"]
