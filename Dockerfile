FROM node:20-alpine
RUN mkdir -p /home/node/app/node_modules && chmod +x /home/node/app/node_modules/
WORKDIR /home/node/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD [ "node", "goblin.js" ]