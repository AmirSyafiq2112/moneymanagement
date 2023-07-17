FROM node:16-alpine

COPY package-lock.json package.json ./
RUN npm install

EXPOSE 3000

CMD ["npm", "run", "dev"]  
# refer to package.json scripts

