# 🚀 EAA ChatBot Deployment Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites) 
3. [Local Development](#local-development)
4. [Environment Configuration](#environment-configuration)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Platforms](#cloud-platforms)
7. [Database Setup](#database-setup)
8. [Security Configuration](#security-configuration)
9. [Monitoring & Logging](#monitoring--logging)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Troubleshooting](#troubleshooting)

## 📖 Overview

This guide covers deploying the EAA ChatBot across different environments, from local development to production cloud platforms. The application consists of a Node.js/Express backend with React frontend, integrated with OpenAI GPT-4o-mini and Supabase database.

### Architecture Summary
- **Backend**: Node.js 18+, Express, TypeScript
- **Frontend**: React 18, TypeScript, Vite
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI Services**: OpenAI GPT-4o-mini, Whisper API
- **Infrastructure**: Docker, GitHub Actions

## ✅ Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher  
- **Git**: Latest version
- **Docker**: 20.10+ (for containerized deployment)

### Required Accounts & API Keys
- **OpenAI API Key**: GPT-4o-mini access required
- **Supabase Account**: PostgreSQL database with pgvector extension
- **Domain**: Custom domain (production only)
- **SSL Certificate**: For HTTPS (production only)

### System Requirements

| Environment | CPU | RAM | Storage | Network |
|-------------|-----|-----|---------|---------|
| **Development** | 2 cores | 4GB | 10GB | Broadband |
| **Staging** | 2 cores | 8GB | 20GB | High-speed |
| **Production** | 4+ cores | 16GB+ | 50GB+ | Enterprise |

## 💻 Local Development

### Quick Setup

1. **Clone Repository**
```bash
git clone https://github.com/your-username/eaa-chatbot.git
cd eaa-chatbot
```

2. **Install Dependencies**
```bash
cd ParserForChuncks
npm install
```

3. **Environment Configuration**
```bash
cp ../env.example .env
```

Edit `.env` file:
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4o-mini

# Supabase Configuration  
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-jwt-secret-here
RATE_LIMIT_MAX=1000
```

4. **Database Setup**
```bash
npm run db:migrate
npm run db:seed
```

5. **Start Development Server**
```bash
npm run dev
```

6. **Verify Installation**  
Visit `http://localhost:3000` and test the chat interface.

### Development Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check

# Health check
npm run health-check
```

## 🔧 Environment Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ | - | OpenAI API key for GPT-4o-mini |
| `OPENAI_MODEL` | ❌ | gpt-4o-mini | OpenAI model to use |
| `SUPABASE_URL` | ✅ | - | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | - | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | ✅ | - | Supabase service role key |
| `PORT` | ❌ | 3000 | Server port |
| `NODE_ENV` | ❌ | development | Deployment environment |
| `JWT_SECRET` | ✅ | - | JWT token secret |
| `RATE_LIMIT_MAX` | ❌ | 1000 | API rate limit per hour |
| `CORS_ORIGIN` | ❌ | * | CORS allowed origins |
| `LOG_LEVEL` | ❌ | info | Logging level |

### Environment-Specific Configurations

#### Development
```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX=1000
```

#### Staging
```env
NODE_ENV=staging
PORT=3000
LOG_LEVEL=info
CORS_ORIGIN=https://staging.eaa-chatbot.com
RATE_LIMIT_MAX=5000
```

#### Production
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn
CORS_ORIGIN=https://eaa-chatbot.com
RATE_LIMIT_MAX=10000
```

## 🐳 Docker Deployment

### Dockerfile

Create `Dockerfile` in project root:
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY ParserForChuncks/package*.json ./
RUN npm ci --only=production

COPY ParserForChuncks/ ./
RUN npm run build

# Runtime stage
FROM node:18-alpine AS runtime

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S eaa-chatbot -u 1001

# Copy built application
COPY --from=builder --chown=eaa-chatbot:nodejs /app/dist ./dist
COPY --from=builder --chown=eaa-chatbot:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=eaa-chatbot:nodejs /app/package*.json ./

USER eaa-chatbot

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  eaa-chatbot:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - eaa-chatbot
    restart: unless-stopped
```

### Build and Run

```bash
# Build Docker image
docker build -t eaa-chatbot .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f eaa-chatbot

# Scale application
docker-compose up -d --scale eaa-chatbot=3
```

## ☁️ Cloud Platforms

### Vercel (Recommended)

**Advantages**: Automatic deployments, serverless, great performance

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Create `vercel.json`**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "ParserForChuncks/dist/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "ParserForChuncks/src/client/dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "ParserForChuncks/dist/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "ParserForChuncks/src/client/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

3. **Deploy**
```bash
vercel --prod
```

### Railway

**Advantages**: Simple setup, automatic scaling

1. **Create `railway.toml`**
```toml
[build]
builder = "NIXPACKS"
buildCommand = "cd ParserForChuncks && npm ci && npm run build"

[deploy]
startCommand = "cd ParserForChuncks && npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

2. **Deploy via GitHub**
- Connect GitHub repository
- Set environment variables in Railway dashboard
- Deploy automatically on push

### Digital Ocean App Platform

1. **Create `.do/app.yaml`**
```yaml
name: eaa-chatbot
services:
- name: api
  source_dir: ParserForChuncks
  github:
    repo: your-username/eaa-chatbot
    branch: main
  run_command: npm start
  build_command: npm ci && npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  health_check:
    http_path: /api/health
  envs:
  - key: NODE_ENV
    value: production
  - key: OPENAI_API_KEY
    value: YOUR_OPENAI_KEY
    type: SECRET
  - key: SUPABASE_URL
    value: YOUR_SUPABASE_URL
    type: SECRET
```

2. **Deploy**
```bash
# Install doctl CLI
doctl apps create .do/app.yaml
```

### AWS ECS (Enterprise)

1. **Create ECS Task Definition**
2. **Set up Application Load Balancer**
3. **Configure Auto Scaling**
4. **Set up CloudWatch monitoring**

[Detailed AWS setup guide available in wiki]

## 🗄️ Database Setup

### Supabase Configuration

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Enable pgvector extension

2. **Database Schema**
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  token_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
```

3. **Seed Data**
```bash
npm run db:seed
```

### Database Migration

Run migrations automatically:
```bash
# Apply all migrations
npm run db:migrate

# Reset database (development only)
npm run db:reset
```

## 🔒 Security Configuration

### API Security

1. **Rate Limiting**
```javascript
// Already configured in the application
// Adjust in environment variables
RATE_LIMIT_MAX=1000 // requests per hour
```

2. **CORS Configuration**
```javascript
// Configure allowed origins
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

3. **Input Validation**
```javascript
// Zod schemas are already implemented
// All inputs are validated and sanitized
```

### SSL/TLS Setup

#### Let's Encrypt (Free)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 2 * * * /usr/bin/certbot renew --quiet
```

#### Custom Certificate
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256+EECDH:ECDHE-RSA-AES256+EDH:!aNULL;
}
```

### Environment Security

```bash
# Set proper file permissions
chmod 600 .env
chown app:app .env

# Use secrets management in production
# AWS Secrets Manager / Azure Key Vault / GCP Secret Manager
```

## 📊 Monitoring & Logging

### Application Monitoring

1. **Health Checks**
```bash
# Endpoint monitoring
curl -f http://localhost:3000/api/health || exit 1
```

2. **Custom Metrics**
```javascript
// Already implemented in the application
// Metrics available at /api/health endpoint
```

### Log Management

1. **Winston Logger Configuration**
```javascript
// Configured for different environments
// Development: console output
// Production: file rotation + external service
```

2. **Log Aggregation**
```yaml
# docker-compose with logging driver
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### External Monitoring Services

| Service | Purpose | Setup |
|---------|---------|-------|
| **Uptime Robot** | Uptime monitoring | Add HTTP monitor |
| **New Relic** | Application performance | Install agent |
| **Sentry** | Error tracking | Add Sentry SDK |
| **DataDog** | Infrastructure monitoring | Install agent |

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The included `.github/workflows/ci.yml` provides:

- **Code Quality**: ESLint, Prettier, TypeScript checks
- **Security**: Dependency audits, vulnerability scans
- **Testing**: Unit, integration, and AI functionality tests
- **Building**: Application compilation and artifact generation
- **Deployment**: Automated deployment to staging/production

### Deployment Stages

1. **Development** → Push to `develop` branch
2. **Staging** → Automatic deployment from `develop`
3. **Production** → Merge to `main` branch
4. **Release** → GitHub release creation

### Secrets Configuration

Set these secrets in GitHub repository settings:

```bash
OPENAI_API_KEY_TEST=sk-test-key
OPENAI_API_KEY_PROD=sk-prod-key
SUPABASE_URL_TEST=https://test.supabase.co
SUPABASE_URL_PROD=https://prod.supabase.co
SUPABASE_ANON_KEY_TEST=test-anon-key
SUPABASE_ANON_KEY_PROD=prod-anon-key
SUPABASE_SERVICE_KEY_TEST=test-service-key
SUPABASE_SERVICE_KEY_PROD=prod-service-key
NPM_TOKEN=npm-publish-token
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Application Won't Start

**Symptoms**: Server crashes on startup
```bash
# Check logs
npm run logs

# Verify environment variables
cat .env | grep -v '^#'

# Test database connection
npm run db:health
```

**Solutions**:
- Verify all required environment variables are set
- Check database connectivity
- Ensure Node.js version compatibility

#### 2. OpenAI API Errors

**Symptoms**: AI responses fail or return errors
```bash
# Test OpenAI connection
npm run test:ai
```

**Solutions**:
- Verify API key is valid and has credits
- Check rate limits
- Ensure correct model name (gpt-4o-mini)

#### 3. Database Connection Issues

**Symptoms**: Database queries fail
```bash
# Test database connection
npm run db:ping
```

**Solutions**:
- Verify Supabase credentials
- Check network connectivity
- Ensure pgvector extension is enabled

#### 4. High Memory Usage

**Symptoms**: Application consumes excessive memory
```bash
# Monitor memory usage
node --inspect dist/server.js
```

**Solutions**:
- Increase container memory limits
- Check for memory leaks
- Optimize database queries

#### 5. SSL Certificate Issues

**Symptoms**: HTTPS connection fails
```bash
# Check certificate validity
openssl x509 -in certificate.crt -text -noout
```

**Solutions**:
- Renew expired certificates
- Verify certificate chain
- Check domain name matches

### Performance Optimization

#### 1. Response Time Optimization
```javascript
// Enable gzip compression
// Implement Redis caching
// Optimize database queries
// Use CDN for static assets
```

#### 2. Database Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM documents WHERE...;

-- Optimize indexes
CREATE INDEX CONCURRENTLY ON documents USING gin(metadata);
```

#### 3. Caching Strategy
```javascript
// Redis configuration for production
const redis = new Redis(process.env.REDIS_URL);
// Cache frequently accessed data
```

### Support & Maintenance

#### Regular Maintenance Tasks

```bash
# Weekly
npm audit && npm audit fix
npm run test
npm run lint

# Monthly  
npm update
docker system prune

# Monitor logs for errors
tail -f logs/error.log
```

#### Backup Procedures

```bash
# Database backup
pg_dump supabase_db > backup_$(date +%Y%m%d).sql

# Configuration backup
tar -czf config_backup.tar.gz .env nginx.conf docker-compose.yml
```

#### Update Procedures

1. **Test updates in staging environment**
2. **Schedule maintenance window**  
3. **Backup database and configuration**
4. **Deploy updates**
5. **Verify functionality**
6. **Monitor for issues**

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/your-username/eaa-chatbot/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/eaa-chatbot/issues)
- **Discord**: [Join Community](https://discord.gg/eaa-chatbot)
- **Email**: [support@eaa-chatbot.com](mailto:support@eaa-chatbot.com)

---

**Last Updated**: January 15, 2024  
**Guide Version**: 2.1.0  
**Application Version**: 1.0.0 