# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy the rest of the project files
COPY . .

# Expose the webhook port
EXPOSE 9999

# Start the webhook server
CMD ["npm", "start"]
