# Multi-Provider Fallback System

## Overview

This application implements a robust multi-provider AI system with automatic fallback capabilities. The system attempts to use AI providers in a priority order, automatically falling back to the next provider if one fails.

## Provider Priority Chain

The system follows this priority order:

1. **Ollama (Local)** - First priority
   - Fast, free, and runs locally
   - No API costs
   - Privacy-focused (data stays local)

2. **OpenAI** - Second priority
   - Reliable cloud service
   - High-quality responses
   - Requires API key and credits

3. **Claude (Anthropic)** - Third priority
   - Fallback for when other providers fail
   - High-quality responses
   - Requires API key and credits

## Architecture

### Services

#### `multiProviderChatService.ts`
Main service that orchestrates the fallback logic.

```typescript
const providers = [
  { name: 'Ollama', service: ollamaChatService },
  { name: 'OpenAI', service: openaiService },
  { name: 'Claude', service: claudeService }
];
```

#### `ollamaChatService.ts`
Handles communication with local Ollama instance.

#### `openaiService.ts`
Handles communication with OpenAI API.

#### `claudeService.ts`
Handles communication with Anthropic's Claude API.

### API Endpoints

#### `/api/unified` - Unified Chat Endpoint
Accepts requests and automatically tries providers in order.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Your prompt here"
    }
  ],
  "preferredProvider": "ollama" // optional
}
```

**Response:**
```json
{
  "content": "AI response here",
  "provider": "ollama",
  "model": "llama2"
}
```

#### `/api/ollama` - Direct Ollama Endpoint
Direct access to Ollama (bypasses fallback).

#### `/api/openai` - Direct OpenAI Endpoint
Direct access to OpenAI (bypasses fallback).

#### `/api/claude` - Direct Claude Endpoint
Direct access to Claude (bypasses fallback).

## Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Ollama Configuration (Local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# OpenAI Configuration
OPENAI_API_KEY=sk-...your-key-here...
OPENAI_MODEL=gpt-4

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Provider Setup

#### Setting Up Ollama (Recommended First)

1. **Install Ollama:**
   ```bash
   # macOS
   brew install ollama

   # Or download from https://ollama.ai
   ```

2. **Start Ollama:**
   ```bash
   ollama serve
   ```

3. **Pull a model:**
   ```bash
   ollama pull llama2
   # or
   ollama pull mistral
   ```

4. **Verify it's running:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

#### Setting Up OpenAI

1. **Get API Key:**
   - Visit https://platform.openai.com/api-keys
   - Create a new API key
   - Add credits to your account

2. **Add to `.env.local`:**
   ```bash
   OPENAI_API_KEY=sk-...your-key-here...
   OPENAI_MODEL=gpt-4
   ```

#### Setting Up Claude (Anthropic)

1. **Get API Key:**
   - Visit https://console.anthropic.com/
   - Create a new API key
   - Add credits to your account

2. **Add to `.env.local`:**
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...your-key-here...
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
   ```

## Usage Examples

### Using the Multi-Provider Service

```typescript
import { multiProviderChatService } from '@/services/multiProviderChatService';

// Automatic fallback
const response = await multiProviderChatService.chat([
  {
    role: 'user',
    content: 'Create a lesson plan about forgiveness'
  }
]);

console.log(`Used provider: ${response.provider}`);
console.log(`Response: ${response.content}`);
```

### Using a Specific Provider

```typescript
import { ollamaChatService } from '@/services/ollamaChatService';
import { openaiService } from '@/services/openaiService';

// Force Ollama
const ollamaResponse = await ollamaChatService.chat([...]);

// Force OpenAI
const openaiResponse = await openaiService.chat([...]);
```

### In React Components

```typescript
const generateLessonPlan = async () => {
  try {
    const response = await fetch('/api/unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    console.log(`Provider used: ${data.provider}`);
    setLessonPlan(data.content);
  } catch (error) {
    console.error('All providers failed:', error);
  }
};
```

## Error Handling

### Fallback Behavior

When a provider fails, the system:

1. Logs the error with provider name
2. Automatically tries the next provider in the chain
3. Returns the first successful response
4. Throws an error only if all providers fail

### Common Error Scenarios

#### Ollama Not Running
```
Error: Ollama provider failed: connect ECONNREFUSED
→ System automatically tries OpenAI next
```

#### Missing API Key
```
Error: OpenAI provider failed: Missing API key
→ System automatically tries Claude next
```

#### Rate Limiting
```
Error: OpenAI provider failed: Rate limit exceeded
→ System automatically tries Claude next
```

#### All Providers Failed
```
Error: All AI providers failed. Last error: ...
→ User sees error message, can retry
```

## Model Configuration

### Ollama Models

Available models (pull before using):
- `llama2` - General purpose, good balance
- `mistral` - Fast and efficient
- `codellama` - Good for technical content
- `llama3` - Latest, improved quality

```bash
ollama pull llama2
ollama list  # View installed models
```

### OpenAI Models

Common models:
- `gpt-4` - Highest quality, slower, more expensive
- `gpt-4-turbo` - Fast GPT-4 variant
- `gpt-3.5-turbo` - Fast, cheaper, good quality

### Claude Models

Available models:
- `claude-3-5-sonnet-20241022` - Latest, best balance
- `claude-3-opus-20240229` - Highest quality
- `claude-3-sonnet-20240229` - Good balance
- `claude-3-haiku-20240307` - Fast and cheap

## Monitoring and Debugging

### Check Which Provider Is Being Used

The response includes a `provider` field:

```typescript
const response = await multiProviderChatService.chat(messages);
console.log(`Provider: ${response.provider}`);
console.log(`Model: ${response.model}`);
```

### Enable Detailed Logging

Each service logs when it's called and when it fails:

```
[Ollama] Attempting to generate response...
[Ollama] Error: Connection refused
[OpenAI] Attempting to generate response...
[OpenAI] Successfully generated response
```

### Test Each Provider Individually

```bash
# Test Ollama
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "Hello"
}'

# Test OpenAI
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}'

# Test Claude
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

## Cost Optimization

### Recommended Strategy

1. **Use Ollama for development** - Free, fast, local
2. **Use OpenAI for production** - Reliable, good quality
3. **Keep Claude as backup** - High quality fallback

### Cost Comparison (Approximate)

| Provider | Cost | Speed | Quality |
|----------|------|-------|---------|
| Ollama | Free | Fast | Good |
| OpenAI (GPT-4) | $0.03/1K tokens | Medium | Excellent |
| OpenAI (GPT-3.5) | $0.002/1K tokens | Fast | Good |
| Claude (Sonnet) | $0.015/1K tokens | Medium | Excellent |

### Minimize Costs

1. Use Ollama when possible
2. Use environment variables to set preferred models
3. Implement caching for repeated requests
4. Set token limits in requests

## Troubleshooting

### Ollama Issues

**Problem:** Connection refused
```bash
# Solution: Start Ollama
ollama serve
```

**Problem:** Model not found
```bash
# Solution: Pull the model
ollama pull llama2
```

### OpenAI Issues

**Problem:** Invalid API key
- Check your `.env.local` file
- Verify key at https://platform.openai.com/api-keys

**Problem:** Insufficient credits
- Add credits at https://platform.openai.com/account/billing

### Claude Issues

**Problem:** Invalid API key
- Check your `.env.local` file
- Verify key at https://console.anthropic.com/

**Problem:** Model not found
- Update to latest model name in `.env.local`
- Check available models in Anthropic docs

## Best Practices

1. **Always configure Ollama first** - Free and fast for development
2. **Keep API keys secure** - Never commit `.env.local` to git
3. **Monitor usage** - Check provider dashboards for costs
4. **Test fallbacks** - Occasionally test with providers disabled
5. **Set appropriate models** - Use cheaper models for non-critical tasks
6. **Implement rate limiting** - Prevent accidental high costs
7. **Cache responses** - Avoid regenerating identical content

## Future Enhancements

Potential improvements to consider:

- Add provider health checking
- Implement response caching
- Add custom retry logic
- Support streaming responses
- Add provider-specific optimizations
- Implement cost tracking
- Add A/B testing capabilities
- Support custom provider ordering
- Add provider selection UI

## Support

For issues or questions:

1. Check this documentation
2. Review error logs
3. Test providers individually
4. Check provider status pages:
   - OpenAI: https://status.openai.com/
   - Anthropic: https://status.anthropic.com/

## License

This multi-provider system is part of the AI Admin Sunday School application.
