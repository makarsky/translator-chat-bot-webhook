FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/index.js ./index.js
COPY --from=build /app/src ./src
COPY --from=build /app/public ./public

USER node

EXPOSE 3000

CMD ["npm", "start"]