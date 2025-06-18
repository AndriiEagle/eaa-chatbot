# 🔌 EAA ChatBot API Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [Core Endpoints](#core-endpoints)
6. [AI Agents](#ai-agents)
7. [Voice Processing](#voice-processing)
8. [System Health](#system-health)
9. [Response Formats](#response-formats)
10. [Code Examples](#code-examples)
11. [SDKs & Libraries](#sdks--libraries)

## 📖 Overview

The EAA ChatBot API provides intelligent consultation services for European Accessibility Act (EAA) compliance. Built with **RAG (Retrieval-Augmented Generation)** architecture and powered by **OpenAI GPT-4o-mini**, it offers contextual, accurate responses based on official EAA documentation.

### Base URL
```
https://api.eaa-chatbot.com/api/v1
```

### API Version
- **Current Version**: `v1`
- **Latest Update**: 2024-01-15
- **Deprecation Policy**: 12 months notice for breaking changes

## 🔐 Authentication

### API Key Authentication (Optional)
```http
Authorization: Bearer your-api-key-here
```

### Public Access
Most endpoints support anonymous access with rate limits. Authentication provides:
- Higher rate limits
- Priority processing
- Advanced features
- Usage analytics

### Getting an API Key
1. Register at [dashboard.eaa-chatbot.com](https://dashboard.eaa-chatbot.com)
2. Create a new API key
3. Copy the key (shown only once)
4. Use in `Authorization` header

## ⚡ Rate Limiting

| Endpoint | Anonymous | Authenticated | Premium |
|----------|-----------|---------------|---------|
| `/ask` | 100/hour | 1000/hour | 5000/hour |
| `/welcome` | 200/hour | 2000/hour | 10000/hour |
| `/whisper` | 50/hour | 500/hour | 2000/hour |
| `/agent/*` | 150/hour | 1500/hour | 7500/hour |
| `/health` | Unlimited | Unlimited | Unlimited |

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
X-RateLimit-Retry-After: 3600
```

## ❌ Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is missing required parameters",
    "details": {
      "missing_fields": ["question", "sessionId"],
      "provided_fields": ["userId"]
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_1234567890"
  }
}
```

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| `200` | OK | Request successful |
| `400` | Bad Request | Invalid request parameters |
| `401` | Unauthorized | Invalid or missing API key |
| `403` | Forbidden | Insufficient permissions |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |
| `503` | Service Unavailable | Service temporarily unavailable |

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `INVALID_REQUEST` | Malformed request | Check request format |
| `MISSING_PARAMETERS` | Required parameters missing | Add missing parameters |
| `INVALID_API_KEY` | API key invalid/expired | Generate new API key |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `SERVICE_UNAVAILABLE` | OpenAI API unavailable | Retry later |
| `INTERNAL_ERROR` | Server error | Contact support |

## 🔧 Core Endpoints

### 1. Chat Interaction

**Endpoint:** `POST /ask`

The main chat endpoint for EAA consultation questions.

#### Request
```json
{
  "question": "What are the EAA compliance requirements for e-commerce websites?",
  "userId": "user_12345",
  "sessionId": "session_67890",
  "preferences": {
    "mode": "detailed",
    "language": "en",
    "accessibility": {
      "screen_reader": false,
      "high_contrast": false,
      "simple_language": false
    }
  },
  "context": {
    "business_type": "e-commerce",
    "company_size": "medium",
    "technical_level": "intermediate",
    "previous_questions": [
      "What is the European Accessibility Act?"
    ]
  }
}
```

#### Response
```json
{
  "success": true,
  "answer": "Based on the European Accessibility Act, e-commerce websites must comply with specific accessibility requirements...",
  "confidence": 0.94,
  "sources": [
    {
      "id": "eaa_article_4_section_2",
      "title": "EAA Article 4 - Accessibility Requirements for Digital Services",
      "relevance": 0.91,
      "text_preview": "Electronic commerce services shall be accessible to persons with disabilities...",
      "url": "https://eur-lex.europa.eu/eli/dir/2019/882/oj",
      "page": 12,
      "section": "Article 4, Section 2"
    }
  ],
  "suggestions": [
    "What are the specific WCAG 2.1 Level AA requirements?",
    "How to conduct an accessibility audit for e-commerce?",
    "What are the compliance deadlines for different EU countries?"
  ],
  "metadata": {
    "query_id": "q_1234567890",
    "timestamp": "2024-01-15T10:30:00Z",
    "processing_details": {
      "total_time_ms": 1247,
      "embedding_time_ms": 89,
      "search_time_ms": 156,
      "generation_time_ms": 1002
    },
    "user_context": {
      "experience_level": "intermediate",
      "previous_queries": 5,
      "session_duration": "00:15:32"
    }
  }
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `question` | string | ✅ | User's question (max 1000 chars) |
| `userId` | string | ❌ | Unique user identifier |
| `sessionId` | string | ❌ | Session identifier for context |
| `preferences` | object | ❌ | User preferences object |
| `preferences.mode` | enum | ❌ | Response mode: `brief`, `detailed`, `technical` |
| `preferences.language` | string | ❌ | Language code (ISO 639-1) |
| `preferences.accessibility` | object | ❌ | Accessibility preferences |
| `context` | object | ❌ | Additional context information |

### 2. Welcome Message

**Endpoint:** `POST /welcome`

Get personalized welcome message with AI-generated suggestions.

#### Request
```json
{
  "userId": "user_12345",
  "context": {
    "business_type": "healthcare",
    "company_size": "large",
    "location": "Germany"
  }
}
```

#### Response
```json
{
  "success": true,
  "message": "Welcome to EAA ChatBot! I'm here to help you understand European Accessibility Act requirements for healthcare organizations.",
  "suggestions": [
    "What are EAA requirements for healthcare websites?",
    "How does EAA affect medical device software?",
    "What are the compliance deadlines in Germany?"
  ],
  "persona": {
    "experience_level": "beginner",
    "business_context": "healthcare_large_enterprise"
  }
}
```

### 3. Health Check

**Endpoint:** `GET /health`

System health and status information.

#### Response
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "response_time_ms": 23,
      "last_check": "2024-01-15T10:29:45Z"
    },
    "openai": {
      "status": "healthy",
      "response_time_ms": 156,
      "last_check": "2024-01-15T10:29:50Z"
    },
    "vector_search": {
      "status": "healthy",
      "response_time_ms": 45,
      "documents_indexed": 282
    }
  },
  "system": {
    "version": "1.0.0",
    "uptime_seconds": 3600,
    "memory_usage_mb": 245,
    "cpu_usage_percent": 12
  }
}
```

## 🤖 AI Agents

### 1. AI Suggestions Agent

**Endpoint:** `POST /agent/ai-suggestions`

Get contextual AI-generated suggestions based on conversation history.

#### Request
```json
{
  "userId": "user_12345",
  "sessionId": "session_67890",
  "conversationHistory": [
    {
      "type": "user",
      "message": "What is the European Accessibility Act?",
      "timestamp": "2024-01-15T10:25:00Z"
    },
    {
      "type": "assistant",
      "message": "The European Accessibility Act...",
      "timestamp": "2024-01-15T10:25:15Z"
    }
  ],
  "userProfile": {
    "business_type": "e-commerce",
    "experience_level": "intermediate"
  }
}
```

#### Response
```json
{
  "success": true,
  "suggestions": [
    "What are the specific WCAG 2.1 requirements for e-commerce?",
    "How to implement accessibility testing in your development process?",
    "What are the compliance deadlines for different EU member states?"
  ],
  "confidence": 0.88,
  "reasoning": "Based on the user's e-commerce background and intermediate level, these suggestions focus on practical implementation aspects."
}
```

### 2. Frustration Detection Agent

**Endpoint:** `POST /agent/frustration`

Analyze user messages for frustration indicators.

#### Request
```json
{
  "messages": [
    "I don't understand this at all",
    "This is so confusing",
    "Can someone please help me?"
  ],
  "context": {
    "session_duration": "00:45:00",
    "questions_asked": 12,
    "satisfactory_answers": 3
  }
}
```

#### Response
```json
{
  "success": true,
  "frustration_level": 0.87,
  "confidence": 0.92,
  "indicators": [
    "negative_language",
    "help_seeking_behavior",
    "confusion_expressions"
  ],
  "recommendation": "escalate_to_human",
  "suggested_response": "I understand this can be confusing. Let me connect you with a human expert who can provide more personalized assistance."
}
```

### 3. Email Composer Agent

**Endpoint:** `POST /agent/email`

Generate professional emails for business communication.

#### Request
```json
{
  "type": "compliance_inquiry",
  "recipient": {
    "role": "manager",
    "company": "TechCorp Ltd"
  },
  "context": {
    "user_questions": [
      "What are our EAA compliance obligations?",
      "When is the deadline for compliance?"
    ],
    "urgency": "high",
    "business_impact": "regulatory_compliance"
  },
  "user_profile": {
    "name": "John Doe",
    "role": "Compliance Officer",
    "company": "TechCorp Ltd"
  }
}
```

#### Response
```json
{
  "success": true,
  "email": {
    "subject": "Urgent: European Accessibility Act Compliance Requirements - Action Required",
    "body": "Dear Manager,\n\nI hope this email finds you well. I'm writing to bring to your attention the European Accessibility Act (EAA) compliance requirements that will impact our organization...",
    "priority": "high",
    "call_to_action": "Schedule a compliance review meeting within the next two weeks"
  },
  "metadata": {
    "tone": "professional",
    "urgency_level": "high",
    "estimated_reading_time": "2 minutes"
  }
}
```

## 🎙️ Voice Processing

### Voice to Text Conversion

**Endpoint:** `POST /whisper`

Convert audio files to text using OpenAI Whisper API.

#### Request
```http
POST /whisper
Content-Type: multipart/form-data

audio: [audio file]
language: en
```

#### Response
```json
{
  "success": true,
  "transcription": "What are the accessibility requirements for mobile applications under the European Accessibility Act?",
  "confidence": 0.96,
  "language": "en",
  "duration_seconds": 5.2,
  "processing_time_ms": 1500
}
```

#### Supported Formats
- **Audio Formats**: MP3, WAV, M4A, WEBM, MP4
- **Max File Size**: 25 MB
- **Max Duration**: 10 minutes
- **Languages**: 50+ languages supported

## 📊 Response Formats

### Success Response Structure
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_1234567890",
    "version": "1.0.0"
  }
}
```

### Error Response Structure
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_1234567890"
  }
}
```

## 💻 Code Examples

### JavaScript/Node.js

```javascript
// Using fetch API
async function askQuestion(question, options = {}) {
  const response = await fetch('https://api.eaa-chatbot.com/api/v1/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-api-key' // Optional
    },
    body: JSON.stringify({
      question,
      userId: options.userId,
      sessionId: options.sessionId,
      preferences: options.preferences
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Usage
try {
  const result = await askQuestion("What is the EAA compliance deadline?", {
    userId: "user_123",
    preferences: { mode: "detailed" }
  });
  console.log(result.answer);
} catch (error) {
  console.error('Error:', error);
}
```

### Python

```python
import requests
import json

class EAAChatBotAPI:
    def __init__(self, api_key=None):
        self.base_url = "https://api.eaa-chatbot.com/api/v1"
        self.headers = {
            "Content-Type": "application/json"
        }
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"
    
    def ask_question(self, question, **kwargs):
        payload = {
            "question": question,
            **kwargs
        }
        
        response = requests.post(
            f"{self.base_url}/ask",
            headers=self.headers,
            json=payload
        )
        
        response.raise_for_status()
        return response.json()

# Usage
client = EAAChatBotAPI(api_key="your-api-key")

try:
    result = client.ask_question(
        "What are the WCAG 2.1 requirements?",
        userId="user_123",
        preferences={"mode": "detailed"}
    )
    print(result["answer"])
except requests.RequestException as e:
    print(f"Error: {e}")
```

### cURL

```bash
# Basic chat request
curl -X POST https://api.eaa-chatbot.com/api/v1/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "question": "What is the European Accessibility Act?",
    "userId": "user_123",
    "preferences": {
      "mode": "detailed",
      "language": "en"
    }
  }'

# Health check
curl -X GET https://api.eaa-chatbot.com/api/v1/health

# Voice transcription
curl -X POST https://api.eaa-chatbot.com/api/v1/whisper \
  -H "Authorization: Bearer your-api-key" \
  -F "audio=@recording.mp3" \
  -F "language=en"
```

### PHP

```php
<?php
class EAAChatBotAPI {
    private $baseUrl = 'https://api.eaa-chatbot.com/api/v1';
    private $apiKey;
    
    public function __construct($apiKey = null) {
        $this->apiKey = $apiKey;
    }
    
    public function askQuestion($question, $options = []) {
        $payload = array_merge([
            'question' => $question
        ], $options);
        
        $headers = [
            'Content-Type: application/json'
        ];
        
        if ($this->apiKey) {
            $headers[] = 'Authorization: Bearer ' . $this->apiKey;
        }
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . '/ask');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("HTTP Error: " . $httpCode);
        }
        
        return json_decode($response, true);
    }
}

// Usage
$client = new EAAChatBotAPI('your-api-key');

try {
    $result = $client->askQuestion("What is EAA?", [
        'userId' => 'user_123',
        'preferences' => ['mode' => 'brief']
    ]);
    echo $result['answer'];
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
```

## 📚 SDKs & Libraries

### Official SDKs

| Language | Package | Installation | Documentation |
|----------|---------|--------------|---------------|
| **JavaScript** | `@eaa-chatbot/js-sdk` | `npm install @eaa-chatbot/js-sdk` | [Docs](https://docs.eaa-chatbot.com/js) |
| **Python** | `eaa-chatbot` | `pip install eaa-chatbot` | [Docs](https://docs.eaa-chatbot.com/python) |
| **PHP** | `eaa-chatbot/php-sdk` | `composer require eaa-chatbot/php-sdk` | [Docs](https://docs.eaa-chatbot.com/php) |
| **Go** | `github.com/eaa-chatbot/go-sdk` | `go get github.com/eaa-chatbot/go-sdk` | [Docs](https://docs.eaa-chatbot.com/go) |

### Community SDKs

| Language | Maintainer | Repository |
|----------|------------|------------|
| **Ruby** | @community-dev | [eaa-chatbot-ruby](https://github.com/community/eaa-chatbot-ruby) |
| **C#** | @dotnet-dev | [EAAChatBot.NET](https://github.com/community/eaa-chatbot-dotnet) |
| **Java** | @java-dev | [eaa-chatbot-java](https://github.com/community/eaa-chatbot-java) |

## 🔗 Useful Links

- **API Status**: [status.eaa-chatbot.com](https://status.eaa-chatbot.com)
- **Developer Dashboard**: [dashboard.eaa-chatbot.com](https://dashboard.eaa-chatbot.com)
- **OpenAPI Spec**: [api.eaa-chatbot.com/openapi.json](https://api.eaa-chatbot.com/openapi.json)
- **Postman Collection**: [Download](https://api.eaa-chatbot.com/postman-collection.json)
- **Support**: [support@eaa-chatbot.com](mailto:support@eaa-chatbot.com)
- **Discord**: [Join our community](https://discord.gg/eaa-chatbot)

---

**Last Updated**: January 15, 2024  
**API Version**: v1.0.0  
**Documentation Version**: 1.2.0 