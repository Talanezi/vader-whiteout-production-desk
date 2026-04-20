FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

COPY server/ /app/server/

RUN npm run build

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
