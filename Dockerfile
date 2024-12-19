# Stage 1: Build the application
FROM node:20-alpine AS builder

# Define the argument
ARG ENV

# Set the environment variable based on the branch
ENV NODE_ENV=$ENV


# Set the working directory
WORKDIR /build

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


FROM node:20-alpine AS runner

WORKDIR /build

COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package.json ./package.json
# COPY --from=builder /build/package-lock.json .
COPY --from=builder /build/dist/ ./dist
COPY --from=builder /build/config ./config

# Expose the port the app runs on
EXPOSE 3005

# Command to run the application
CMD ["yarn", "start"]