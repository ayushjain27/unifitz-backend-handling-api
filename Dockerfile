# Use the official Node.js image as the base image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY ["package.json", "yarn.lock", "./"]

# Install dependencies using yarn
RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN yarn tsc

# Expose the port the app runs on
EXPOSE 3005

# Command to run the application
CMD ["yarn", "start"]