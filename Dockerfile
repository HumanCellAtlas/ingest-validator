FROM node:carbon

# Create app directory
RUN mkdir /app
WORKDIR /app

ADD src ./src
ADD config ./config
COPY package*.json ./
COPY tsconfig.json ./

RUN npm install
RUN npm run build-ts
CMD ["node", "./dist/app.js"]
