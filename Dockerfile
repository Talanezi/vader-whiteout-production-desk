FROM node:18-bookworm-slim AS builder

WORKDIR /app

COPY server/package.json server/package-lock.json ./server/
COPY server/tsconfig.json server/tsconfig.build.json server/nest-cli.json ./server/

WORKDIR /app/server
RUN npm install

COPY server/src ./src
RUN npm run build

FROM node:18-bookworm-slim AS runner

WORKDIR /app/server

RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    lmodern \
    ghostscript \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/package-lock.json ./package-lock.json
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/dist ./dist

RUN printf '%s\n' \
'#!/bin/sh' \
'set -e' \
'if [ "$#" -gt 0 ]; then' \
'  exec /bin/sh -lc "$*"' \
'fi' \
'exec npm run start' \
> /entrypoint.sh && chmod +x /entrypoint.sh

ENV NODE_ENV=production

ENTRYPOINT ["/entrypoint.sh"]
CMD []
