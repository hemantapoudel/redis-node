# Use the official Node.js image as the base image
FROM node:20-alpine3.17

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

RUN npx prisma generate

# Expose the port the application runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "index.js"]