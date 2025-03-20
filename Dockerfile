# 1. Base Image
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --only=production

# 2. Development Stage
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Use Nodemon in development mode
CMD ["npm", "run", "dev"]

# 3. Production Stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy dependencies from base image
COPY --from=base /app/node_modules ./node_modules

# Copy source files
COPY . .

# Expose the application's port
EXPOSE ${PORT}

# Start the application in production mode
CMD ["npm", "run", "start"]
