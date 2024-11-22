# Stage 1: Build the application
FROM node:20

# Define the argument
ARG ENV

# Set the environment variable based on the branch
ENV NODE_ENV=$ENV


# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY ["package.json", "yarn.lock", "./"]

# Install dependencies using yarn
# RUN npm install
# RUN yarn set version stable
RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN yarn tsc

# Expose the port the app runs on
EXPOSE 3005

# Command to run the application
CMD ["yarn", "start"]