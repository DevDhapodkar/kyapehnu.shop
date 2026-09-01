# Backend API for Kya Pehnu? — Express 5 on Node 22, built for Fly.io.
#
# The server is stateless (JWT/Firebase auth, uploads streamed to Cloudinary in
# memory, data in MongoDB Atlas), so the image needs no volumes and scales out
# horizontally just by running more machines.
FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies against the committed lockfile first, so this
# layer is cached until the lockfile actually changes.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Application source.
COPY . .

# Fly's proxy forwards to this port; server.js reads it from PORT (see fly.toml).
ENV PORT=8080
EXPOSE 8080

# Never run the app as root.
USER node

CMD ["node", "server.js"]
