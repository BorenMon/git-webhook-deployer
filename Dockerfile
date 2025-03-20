# Base image
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json .
RUN npm install

# Bundle app source
COPY server.js ./

# Command to switch between dev and prod
CMD [ "npm", "run", "dev" ]
