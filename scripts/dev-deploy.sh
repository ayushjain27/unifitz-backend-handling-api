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
aws ecr get-login-password --region ${REGION} --profile ${PROFILE} | docker login --username AWS --password-stdin ${REPOSITORY_URL}

# Step 3: Tag the Docker image
echo "Tagging the Docker image..."
docker tag ${IMAGE_NAME} ${REPOSITORY_URL}/serviceplug/serviceplug-dev-api:latest

# Step 4: Push the Docker image to ECR
echo "Pushing the Docker image to ECR..."
docker push ${REPOSITORY_URL}/serviceplug/serviceplug-dev-api:latest

#  Step 5: Deploy the Docker image to the EC2 instance
echo "Connecting to the EC2 instance and deploying the Docker image..."
ssh -i "${KEY_PATH}" ${EC2_USER}@${EC2_HOST} << EOF
    aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${REPOSITORY_URL}
    docker pull ${REPOSITORY_URL}/serviceplug/serviceplug-dev-api:latest
    echo "Stopping the current Docker container if running..."
    docker stop \$(docker ps -q --filter ancestor=${REPOSITORY_URL}/serviceplug/serviceplug-dev-api)
    echo "Removing the old Docker container..."
    docker rm \$(docker ps -a -q --filter ancestor=${REPOSITORY_URL}/serviceplug/serviceplug-dev-api)
    echo "Removing the Docker image ${REPOSITORY_URL}/serviceplug/serviceplug-dev-api..."
     docker rmi \$(docker ps -a -q --filter ancestor=${REPOSITORY_URL}/serviceplug/serviceplug-dev-api)
    docker-compose up -d
EOF


echo "Pushed to ecr completed successfully!"