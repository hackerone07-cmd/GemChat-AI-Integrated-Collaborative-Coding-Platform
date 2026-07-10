FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 4000

ENV NODE_ENV=production \
    PORT=4000

CMD ["npm", "start"]
