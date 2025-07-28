# 🤖 EAA ChatBot - AI-Powered European Accessibility Act Consultation Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0.0+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1.8-blue.svg)](https://reactjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-orange.svg)](https://openai.com/)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Revolutionary AI-powered consultation platform for European Accessibility Act (EAA) compliance with RAG architecture, multi-agent AI system, voice input, and intelligent compliance guidance.**

## 🚨 IMPORTANT: API Keys Required

**⚠️ THIS APPLICATION WILL NOT START WITHOUT VALID API KEYS!**

This project requires API keys from:
- **OpenAI** (for GPT-4o-mini and embeddings)
- **Supabase** (for vector database and storage)

**The application will immediately exit with an error message if these keys are not provided.**

### 🔑 Getting Your API Keys

1. **OpenAI API Key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Supabase Keys**: Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API

### 📋 Required Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
```

**Without these keys properly configured, you will see a detailed error message and the application will not start.**

## 🌟 Key Features

- **🧠 RAG Architecture** - Retrieval-Augmented Generation with vector search
- **🤖 Multi-Agent AI System** - Specialized agents for different consultation aspects
- **🎤 Voice Input** - OpenAI Whisper integration for accessibility
- **😤 Frustration Detection** - AI-powered emotional analysis and escalation
- **📧 Smart Escalation** - Automatic email notifications for complex cases
- **💬 Intelligent Suggestions** - Context-aware question recommendations
- **🔍 Semantic Search** - pgvector-powered similarity matching
- **📱 Responsive UI** - Modern React interface with accessibility features
- **🔒 Enterprise Security** - Secure authentication and data handling
- **📊 Analytics & Monitoring** - Comprehensive performance tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0+
- npm 8.0.0+
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/eaa-chatbot.git
cd eaa-chatbot/ParserForChuncks
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup (CRITICAL STEP)**
```bash
cp env.example .env
```

**⚠️ MANDATORY: Configure your `.env` file with valid API keys:**
```env
# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Email Configuration (Optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

**🚨 IMPORTANT**: Replace the placeholder values with your actual API keys. The application will not start without them and will display a detailed error message if they're missing.

4. **Build and start**
```bash
npm run build-and-run
```

Or for development:
```bash
npm run dev
```

## 🏗️ Architecture Overview

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   Supabase DB   │
│                 │    │                 │    │                 │
│ • Chat UI       │◄──►│ • RAG Engine    │◄──►│ • Vector Store  │
│ • Voice Input   │    │ • AI Agents     │    │ • Chat History  │
│ • Suggestions   │    │ • Memory System │    │ • User Facts    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   OpenAI API    │◄─────────────┘
                        │                 │
                        │ • GPT-4o-mini   │
                        │ • Embeddings    │
                        │ • Whisper STT   │
                        └─────────────────┘
```

### Multi-Agent System

- **🎯 Suggestion Agent** - Generates contextual questions
- **😤 Frustration Agent** - Detects user emotional state
- **👤 Persona Agent** - Identifies user type and expertise level
- **🔍 Behavior Agent** - Analyzes interaction patterns
- **📧 Email Agent** - Composes escalation notifications
- **🎤 Voice Agent** - Processes speech-to-text

## 📚 API Documentation

### Core Endpoints

#### Chat & Consultation
```http
POST /ask
Content-Type: application/json

{
  "question": "What are the EAA requirements for mobile apps?",
  "user_id": "user123",
  "session_id": "session456",
  "similarity_threshold": 0.78,
  "max_chunks": 5,
  "stream": true
}
```

#### Session Management
```http
GET /chat/sessions/:userId          # Get user sessions
GET /chat/messages/:sessionId       # Get session messages
DELETE /chat/sessions/:sessionId    # Delete session
```

#### Voice Processing
```http
POST /whisper/transcribe
Content-Type: multipart/form-data

# Audio file upload for transcription
```

#### Health & Configuration
```http
GET /health                         # Server health check
GET /config                         # API configuration
```

### Response Format

```json
{
  "success": true,
  "data": {
    "answer": "The EAA requires mobile applications to...",
    "sources": [
      {
        "title": "Chapter 2: Scope and Requirements",
        "similarity": 0.89,
        "preview": "Mobile applications must comply with..."
      }
    ],
    "suggestions": [
      "What about web applications?",
      "Are there any exceptions for small businesses?"
    ],
    "metadata": {
      "chunks_used": 3,
      "processing_time": 1.2,
      "model": "gpt-4o-mini"
    }
  }
}
```

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test suites
npm run test:unit
npm run test:integration
```

### Test Coverage
- ✅ **14/14 tests passing (100%)**
- 🧠 AI agent functionality
- 💾 Database operations
- 🔍 Search algorithms
- 📧 Email notifications
- 🎤 Voice processing

## 🔧 Development

### Code Quality
```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Formatting
npm run format
npm run format:check
```

### Database Management
```bash
# Schema updates
npm run db:migrate

# Health check
npm run db:health

# Apply fixes
npm run db:apply-fix
```

### Documentation
```bash
# Generate API docs
npm run docs:api

# Serve documentation
npm run docs:serve
```

## 🗄️ Database Schema

### Core Tables

```sql
-- Chat sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  message_count INT DEFAULT 0,
  escalated BOOLEAN DEFAULT FALSE
);

-- Chat messages with vector embeddings
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User facts and business information
CREATE TABLE user_facts (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  fact_type TEXT NOT NULL,
  fact_value TEXT NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Frustration analysis
CREATE TABLE frustration_analysis (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id UUID,
  frustration_level FLOAT,
  risk_score FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deployment

### Docker
```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Docker Compose
npm run docker:compose
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm run start

# PM2 process management
npm run pm2:start
npm run pm2:restart
npm run pm2:stop
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Monitoring & Analytics

### Performance Metrics
- Response time tracking
- Token usage monitoring
- User satisfaction scores
- Escalation rates
- Voice processing accuracy

### Logging
```bash
# View logs
npm run logs

# Error logs
npm run logs:error
```

## 🔒 Security Features

- **Rate Limiting** - Express rate limiting middleware
- **Input Validation** - Zod schema validation
- **SQL Injection Protection** - Supabase ORM
- **Environment Variables** - No hardcoded secrets
- **CORS Configuration** - Secure cross-origin requests
- **Helmet.js** - Security headers

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Use conventional commits
- Ensure 100% test coverage for new features

## 📋 Roadmap

- [ ] **Multi-language Support** - Internationalization
- [ ] **Advanced Analytics Dashboard** - Real-time metrics
- [ ] **Mobile App** - React Native implementation
- [ ] **Plugin System** - Extensible architecture
- [ ] **Advanced Voice Features** - Voice responses
- [ ] **Integration APIs** - Third-party service connections

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [API Docs](docs/api/index.html)
- **Issues**: [GitHub Issues](https://github.com/your-username/eaa-chatbot/issues)
- **Email**: support@eaa-chatbot.com
- **Discord**: [Join our community](https://discord.gg/eaa-chatbot)

## 🙏 Acknowledgments

- European Accessibility Act documentation
- OpenAI for GPT-4o-mini and Whisper API
- Supabase for vector database capabilities
- The accessibility community for valuable feedback

---

**Built with ❤️ for digital accessibility and inclusion** 