FROM node:slim

RUN apt-get update && apt-get install -y iproute2 iputils-ping && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["node", "dist/server/server.js"]