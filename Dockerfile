FROM node:18-alpine

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install

COPY server/ ./

RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
