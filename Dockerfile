# Stage 1: Build the application
FROM node:20-alpine AS build

# Define the argument
ARG ENV

# Set the environment variable based on the branch
ENV NODE_ENV=$ENV

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY ["package.json", "./"]

# Install dependencies using yarn
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run tsc

# Stage 2: Create the runtime image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app /app

ARG ENV

ENV NODE_ENV=$ENV

# Expose the port the app runs on
EXPOSE 3005

# Command to run the application
CMD ["npm", "start"]