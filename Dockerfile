FROM node:18-alpine AS builder

WORKDIR /app

COPY server/package.json server/package-lock.json ./server/
COPY server/tsconfig.json server/tsconfig.build.json server/nest-cli.json ./server/

WORKDIR /app/server
RUN npm install

COPY server/src ./src

RUN npm run build


FROM node:18-alpine AS runner

WORKDIR /app/server

COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/package-lock.json ./package-lock.json
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/dist ./dist

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
