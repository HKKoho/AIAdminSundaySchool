# Church Admin Railway Backend

Unified backend server for AI Church Admin platform, providing WhatsApp integration for Secretary and Bookkeeper modules.

## Features

- **Dual WhatsApp Sessions**: Separate sessions for Secretary and Bookkeeper
- **Unified AI Engine**: Gemini, OpenAI, and Ollama with automatic failover
- **MongoDB Integration**: Shared database with Vercel frontend
- **Document Classification**: AI-powered receipt/invoice processing
- **Message Automation**: Send bulk notifications and reminders

## Architecture

```
┌─────────────────────────────────────────┐
│         Railway Backend (Node.js)        │
├──────────────┬──────────────────────────┤
│ WhatsApp #1  │     WhatsApp #2          │
│ (Secretary)  │     (Bookkeeper)         │
├──────────────┴──────────────────────────┤
│     Unified AI Service (Failover)        │
│   Gemini → OpenAI → Ollama              │
├─────────────────────────────────────────┤
│          MongoDB (churchadmin)           │
└─────────────────────────────────────────┘
```

## API Endpoints

### Health
- `GET /api/health` - Service health check

### AI
- `POST /api/ai/chat` - Unified AI chat with failover
- `POST /api/ai/generate` - Simple text generation

### Secretary
- `GET /api/secretary/status` - WhatsApp connection status
- `POST /api/secretary/report` - Generate monthly report
- `POST /api/secretary/schedule` - Generate daily schedule
- `POST /api/secretary/pastoral` - Pastoral AI assistant
- `POST /api/secretary/event` - Event management AI
- `POST /api/secretary/send` - Send WhatsApp message
- `POST /api/secretary/notify` - Send bulk notifications
- `GET /api/secretary/members` - Get members list
- `GET /api/secretary/events` - Get events list

### Bookkeeper
- `GET /api/bookkeeper/status` - WhatsApp connection status
- `GET /api/bookkeeper/documents` - Get all documents
- `POST /api/bookkeeper/upload` - Upload document
- `POST /api/bookkeeper/classify/:id` - Classify document with AI
- `GET /api/bookkeeper/summary` - Get financial summary
- `POST /api/bookkeeper/report` - Generate financial report
- `DELETE /api/bookkeeper/documents/:id` - Delete document

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- AI API keys (Gemini, OpenAI, Ollama)

### Local Development

1. Clone and install dependencies:
```bash
cd railway-backend
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure `.env` with your credentials:
```env
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=...
OPENAI_API_KEY=...
```

4. Start development server:
```bash
npm run dev
```

### Railway Deployment

1. Create new Railway project:
```bash
railway login
railway init
```

2. Link to this directory:
```bash
railway link
```

3. Set environment variables in Railway dashboard

4. Deploy:
```bash
railway up
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3002) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | No |
| `OLLAMA_API_URL` | Ollama Cloud API URL | No |
| `OLLAMA_API_KEY` | Ollama API key | No |
| `AI_PROVIDER_PRIORITY` | Provider order (gemini,openai,ollama) | No |
| `ALLOWED_ORIGINS` | CORS allowed origins | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (default: 60000) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window (default: 100) | No |

## WhatsApp Session Management

Sessions are stored locally in `./whatsapp-sessions/`. To reset a session:

1. Stop the server
2. Delete the session folder (e.g., `./whatsapp-sessions/secretary-session`)
3. Restart the server
4. Scan the new QR code

## Updating Frontend

Update the frontend to point to Railway backend:

```typescript
// In WhatsAppBookkeeper.tsx
const API_URL = import.meta.env.VITE_BOOKKEEPER_API_URL || 'https://your-app.railway.app';

// In WhatsAppSecretary.tsx (new)
const API_URL = import.meta.env.VITE_SECRETARY_API_URL || 'https://your-app.railway.app';
```

## License

MIT
