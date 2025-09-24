#!/bin/bash

# Deployment Test Script
echo "🧪 Testing Exchange Rate Tracker Deployment..."

# Test 1: Check if Lambda deployment package exists
echo "📦 Checking Lambda deployment package..."
if [ -f "backend/lambda_deployment.zip" ]; then
    echo "✅ Lambda deployment package found"
    echo "   Size: $(ls -lh backend/lambda_deployment.zip | awk '{print $5}')"
else
    echo "❌ Lambda deployment package not found"
    exit 1
fi

# Test 2: Check if required configuration files exist
echo ""
echo "⚙️ Checking configuration files..."

CONFIG_FILES=(
    "amplify.yml"
    "backend/lambda_function.py"
    ".env.example"
    "backend/.env.example"
    "DEPLOYMENT_GUIDE.md"
    ".github/workflows/deploy.yml"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Test 3: Check if Lambda handler is properly configured
echo ""
echo "🔍 Validating Lambda handler..."
if grep -q "lambda_handler" backend/lambda_function.py; then
    echo "✅ Lambda handler function found"
else
    echo "❌ Lambda handler function not found"
    exit 1
fi

# Test 4: Check if Mangum is configured correctly
if grep -q "Mangum" backend/lambda_function.py; then
    echo "✅ Mangum WSGI adapter configured"
else
    echo "❌ Mangum WSGI adapter not configured"
    exit 1
fi

# Test 5: Validate Amplify configuration
echo ""
echo "🏗️ Validating Amplify configuration..."
if grep -q "frontend" amplify.yml && grep -q "npm run build" amplify.yml; then
    echo "✅ Amplify build configuration valid"
else
    echo "❌ Amplify build configuration invalid"
    exit 1
fi

# Test 6: Check Python imports (basic syntax check)
echo ""
echo "🐍 Testing Python syntax..."
cd backend
if python3 -m py_compile lambda_function.py; then
    echo "✅ Lambda function syntax valid"
else
    echo "❌ Lambda function syntax errors"
    exit 1
fi
cd ..

# Test 7: Check if frontend builds successfully
echo ""
echo "⚛️ Testing frontend build..."
if [ -d "frontend" ]; then
    cd frontend
    if [ -f "package.json" ]; then
        echo "✅ Frontend package.json found"
        if command -v npm &> /dev/null; then
            echo "📦 Installing frontend dependencies..."
            npm install --silent
            echo "🏗️ Building frontend..."
            if npm run build --silent; then
                echo "✅ Frontend builds successfully"
            else
                echo "❌ Frontend build failed"
                exit 1
            fi
        else
            echo "⚠️  npm not installed, skipping frontend build test"
        fi
    else
        echo "❌ Frontend package.json not found"
        exit 1
    fi
    cd ..
else
    echo "❌ Frontend directory not found"
    exit 1
fi

echo ""
echo "🎉 All deployment tests passed!"
echo ""
echo "✅ Your project is ready for AWS deployment!"
echo ""
echo "Next steps:"
echo "1. Set up AWS credentials"
echo "2. Create Lambda execution role"
echo "3. Run: ./deploy-aws.sh"
echo "4. Configure AWS Amplify in Console"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions."