# Backend Dockerfile
FROM node:24-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN apt-get update && apt-get install -y default-mysql-client
COPY . .
RUN npm run build
CMD ["npm", "start"]
