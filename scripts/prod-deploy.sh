#!/bin/bash

# Variables
REGION="ap-south-1"
PROFILE="jitin-serviceplug"
REPOSITORY_URL="771470636147.dkr.ecr.${REGION}.amazonaws.com"
IMAGE_NAME="serviceplug/prod-api:latest"
KEY_PATH="keys/serviceplug-prod-ec2.pem"
LOCAL_PORT=8000
CONTAINER_PORT=3005

# Step 1: Build the Docker image
echo "Building the Docker image..."
yarn docker:build:prod

# Step 2: Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region ${REGION} --profile ${PROFILE} | docker login --username AWS --password-stdin ${REPOSITORY_URL}

# Step 3: Tag the Docker image
echo "Tagging the Docker image..."
docker tag ${IMAGE_NAME} ${REPOSITORY_URL}/${IMAGE_NAME}

# Step 4: Push the Docker image to ECR
echo "Pushing the Docker image to ECR..."
docker push ${REPOSITORY_URL}/${IMAGE_NAME}