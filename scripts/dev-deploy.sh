#!/bin/bash

# Variables
REGION="ap-south-1"
PROFILE="jitin-serviceplug"
REPOSITORY_URL="771470636147.dkr.ecr.${REGION}.amazonaws.com"
IMAGE_NAME="serviceplug/serviceplug-dev-api:latest"
KEY_PATH="keys/serviceplug-dev-api.pem"
EC2_USER="ec2-user"
EC2_HOST="ec2-65-0-188-147.${REGION}.compute.amazonaws.com"
LOCAL_PORT=8000
CONTAINER_PORT=3005

# Step 1: Build the Docker image
echo "Building the Docker image..."
yarn docker:build:dev

# Step 2: Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${REPOSITORY_URL}

# Step 3: Tag the Docker image
echo "Tagging the Docker image..."
docker tag ${IMAGE_NAME} ${REPOSITORY_URL}/serviceplug/serviceplug-dev-api:latest

# Step 4: Push the Docker image to ECR
echo "Pushing the Docker image to ECR..."
docker push ${REPOSITORY_URL}/serviceplug/serviceplug-dev-api:latest

# # Step 5: SSH into the EC2 instance
# echo "Connecting to the EC2 instance..."
# ssh -i "${KEY_PATH}" ${EC2_USER}@${EC2_HOST} << EOF

#     # Step 6: Check running Docker containers and images
#     echo "Checking Docker containers and images on the EC2 instance..."
#     docker ps
#     docker images

#     # Step 7: Login to ECS if required (you can add specific ECS login commands here if needed)
#     aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${REPOSITORY_URL}

#     # Step 8: Pull the Docker image from ECR
#     echo "Pulling the Docker image from ECR..."
#     docker pull ${REPOSITORY_URL}/serviceplug/serviceplug-dev-api:latest

#     # Step 9: Stop the previous version and clean up (if required)
#     echo "Stopping the current Docker container if running..."
#     docker stop \$(docker ps -q --filter ancestor=${REPOSITORY_URL}/serviceplug/serviceplug-dev-api)
#     echo "Removing the old Docker container..."
#     docker rm \$(docker ps -a -q --filter ancestor=${REPOSITORY_URL}/serviceplug/serviceplug-dev-api)

#     # Step 9 (cont): Start a new container with the updated image
#     echo "Running the new Docker container..."
#     docker run -p ${LOCAL_PORT}:${CONTAINER_PORT} -d ${REPOSITORY_URL}/serviceplug/serviceplug-dev-api:latest

# EOF

echo "Pushed to ecr completed successfully!"