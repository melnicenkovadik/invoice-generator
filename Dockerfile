FROM node:22-alpine AS build
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build:all

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
ENV NODE_ENV=production PORT=3000 DATA_DIR=/app/data DIST_DIR=./dist
EXPOSE 3000
CMD ["node", "server.js"]
