# Backend API for Kya Pehnu? — Express 5 on Node 22, built for Fly.io.
#
# The server is stateless (JWT/Firebase auth, uploads streamed to Cloudinary in
# memory, data in MongoDB Atlas), so the image needs no volumes and scales out
# horizontally just by running more machines.
#
# Dependencies are installed with Bun against the committed bun.lock — the single
# source of truth shared with local dev and the APK CI — so prod, dev, and CI
# resolve identical trees. The application itself still runs on the Node 22
# runtime; Bun is used only for the install step.
FROM oven/bun:1.4.2 AS bun

FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

# Copy the Bun binary from the official image for the install step only.
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

# Install production dependencies against the committed lockfile first, so this
# layer is cached until the lockfile actually changes.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production && rm -rf /root/.bun/install/cache

# Application source.
COPY . .

# Fly's proxy forwards to this port; server.js reads it from PORT (see fly.toml).
ENV PORT=8080
EXPOSE 8080

# Never run the app as root.
USER node

CMD ["node", "server.js"]
