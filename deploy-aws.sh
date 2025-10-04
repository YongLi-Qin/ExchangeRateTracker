#!/bin/bash

# AWS Deployment Script for Exchange Rate Tracker
# Make sure you have AWS CLI configured with proper permissions

set -e

echo "🚀 Starting AWS Deployment..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "📋 Checking dependencies..."
if ! command_exists aws; then
    echo "❌ AWS CLI is required. Please install it first."
    exit 1
fi

if ! command_exists zip; then
    echo "❌ zip command is required."
    exit 1
fi

# Variables (update these with your actual values)
LAMBDA_FUNCTION_NAME="exchange-rate-api"
LAMBDA_RUNTIME="python3.9"
LAMBDA_ROLE_ARN=""  # Set your Lambda execution role ARN
API_GATEWAY_NAME="exchange-rate-api"

echo "📦 Preparing Lambda deployment package..."
cd backend

# Install dependencies if not already installed
if [ ! -f "lambda_deployment.zip" ]; then
    echo "Installing Python dependencies..."
    pip install -r requirements.txt -t . --upgrade
    echo "Creating deployment package..."
    zip -r lambda_deployment.zip . -x "*.pyc" "*__pycache__*" "venv/*" ".git/*"
fi

echo "☁️  Deploying to AWS Lambda..."
if aws lambda get-function --function-name "$LAMBDA_FUNCTION_NAME" 2>/dev/null; then
    echo "Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --zip-file fileb://lambda_deployment.zip
else
    echo "Creating new Lambda function..."
    if [ -z "$LAMBDA_ROLE_ARN" ]; then
        echo "❌ Please set LAMBDA_ROLE_ARN in the script"
        exit 1
    fi

    aws lambda create-function \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --runtime "$LAMBDA_RUNTIME" \
        --role "$LAMBDA_ROLE_ARN" \
        --handler lambda_function.lambda_handler \
        --zip-file fileb://lambda_deployment.zip \
        --timeout 30 \
        --memory-size 256
fi

echo "🌐 Setting up API Gateway integration..."
echo "Please manually configure API Gateway in the AWS Console as described in DEPLOYMENT_GUIDE.md"

cd ..

echo "✅ Backend deployment completed!"
echo ""
echo "Next steps:"
echo "1. Configure API Gateway in AWS Console"
echo "2. Update frontend environment variables with API Gateway URL"
echo "3. Deploy frontend using AWS Amplify"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions."