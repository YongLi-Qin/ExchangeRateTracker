# 🚀 AWS 部署指南

## 部署选项

### **方案1: AWS Amplify + Lambda (推荐)**

#### **步骤1: 前端部署 (AWS Amplify)**

1. **登录 AWS Console**
   - 进入 [AWS Amplify Console](https://console.aws.amazon.com/amplify/)

2. **连接 GitHub 仓库**
   - 点击 "New app" → "Host web app"
   - 选择 "GitHub"，授权连接
   - 选择仓库: `YongLi-Qin/ExchangeRateTracker`
   - 分支: `a` (当前分支)

3. **配置构建设置**
   ```yaml
   version: 1
   applications:
     - frontend:
         phases:
           preBuild:
             commands:
               - cd frontend
               - npm ci
           build:
             commands:
               - npm run build
         artifacts:
           baseDirectory: frontend/build
           files:
             - '**/*'
         cache:
           paths:
             - frontend/node_modules/**/*
   ```

4. **添加环境变量**
   - 在 Amplify Console → Environment variables 添加:
     ```
     REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com/prod
     ```

#### **步骤2: 后端部署 (AWS Lambda)**

1. **创建 Lambda 函数**
   - 进入 [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
   - 创建新函数
   - 运行时: Python 3.9
   - 函数名: `exchange-rate-api`

2. **打包并上传代码**
   ```bash
   cd backend
   pip install -r requirements.txt -t .
   zip -r lambda_deployment.zip .
   ```

3. **配置 API Gateway**
   - 创建 REST API
   - 配置资源和方法
   - 部署到 stage (如 `prod`)

4. **设置环境变量**
   ```
   FIREBASE_PROJECT_ID=exchangeratetracker
   ```

5. **上传 Firebase Service Account**
   - 将 `firebase-service-account.json` 添加到 Lambda 层

#### **步骤3: CORS 配置**
在 API Gateway 中为所有方法启用 CORS:
- Access-Control-Allow-Origin: `*`
- Access-Control-Allow-Methods: `GET,POST,PUT,DELETE,OPTIONS`
- Access-Control-Allow-Headers: `Content-Type,Authorization`

---

### **方案2: 容器化部署**

1. **创建 Docker 文件**
2. **使用 AWS Fargate 或 ECS**
3. **配置 Application Load Balancer**

---

### **方案3: 全 Amplify 方案**

1. **使用 Amplify CLI**
   ```bash
   amplify init
   amplify add api
   amplify add function
   amplify push
   ```

2. **迁移到 DynamoDB**
   - 替代 Firebase Firestore
   - 使用 Amplify DataStore

---

## 🔐 环境变量配置

### **前端 (.env)**
```
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=exchangeratetracker.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=exchangeratetracker
```

### **后端 (Lambda Environment Variables)**
```
FIREBASE_PROJECT_ID=exchangeratetracker
ENVIRONMENT=production
```

---

## 📝 部署清单

- [ ] GitHub 仓库已更新
- [ ] Firebase 项目已配置
- [ ] Firebase Service Account 密钥已创建
- [ ] AWS 账户已准备
- [ ] 前端环境变量已设置
- [ ] 后端部署包已创建
- [ ] API Gateway CORS 已配置
- [ ] 域名配置 (可选)
- [ ] SSL 证书配置 (可选)

---

## 🛠️ 故障排除

### **常见问题:**

1. **CORS 错误**
   - 检查 API Gateway CORS 设置
   - 确保 Flask app 有 flask-cors 配置

2. **Firebase 认证失败**
   - 检查 service account 密钥
   - 确认 Firebase 项目设置

3. **构建失败**
   - 检查 Node.js 版本兼容性
   - 清除 npm cache: `npm cache clean --force`

4. **Lambda 超时**
   - 增加 Lambda 超时时间 (默认3秒)
   - 优化代码性能

---

## 💰 成本估算

### **AWS Amplify**
- 构建分钟数: $0.01/分钟
- 托管: $0.15/GB/月
- 数据传输: $0.15/GB

### **Lambda + API Gateway**
- Lambda 请求: $0.0000002/请求
- Lambda 计算: $0.0000166667/GB-秒
- API Gateway: $3.50/百万请求

### **预估月费用**: $5-20 (低流量)