# WhatsApp Bookkeeper Server

Real-time WhatsApp integration for automated document classification and bookkeeping.

## Features

- ✅ WhatsApp Web integration via QR code authentication
- ✅ Automatic receipt/invoice detection
- ✅ AI-powered document classification using Google Gemini
- ✅ Real-time document processing
- ✅ RESTful API for frontend integration

## Prerequisites

- Node.js 18+ installed
- Google Gemini API key
- WhatsApp account

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Add your Gemini API key

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Scan QR code:**
   - A QR code will appear in the terminal
   - Scan it with your WhatsApp mobile app (Settings → Linked Devices → Link a Device)
   - Server will automatically connect

## API Endpoints

### GET /api/status
Get current connection status and QR code

**Response:**
```json
{
  "connectionState": "connected",
  "qrCode": "data:image/png;base64,...",
  "hasClient": true
}
```

### GET /api/documents
Get all received documents

**Response:**
```json
{
  "documents": [
    {
      "id": "doc_123",
      "filename": "receipt.jpg",
      "type": "Receipt",
      "vendor": "Office Depot",
      "amount": 150.50,
      "status": "classified",
      "uploadedAt": "2025-11-17T00:00:00.000Z"
    }
  ]
}
```

### POST /api/classify/:id
Classify a document using AI

**Response:**
```json
{
  "success": true,
  "classification": {
    "documentType": "Receipt",
    "vendor": "Office Depot",
    "amount": "150.50",
    "confidence": 95
  }
}
```

### DELETE /api/documents/:id
Remove a document from the list

## How It Works

1. **WhatsApp Connection:**
   - Server initializes WhatsApp Web client
   - Generates QR code for authentication
   - Maintains persistent session via LocalAuth

2. **Document Reception:**
   - Listens for incoming messages with media
   - Filters for images (JPG, PNG) and PDFs
   - Stores documents with metadata

3. **AI Classification:**
   - Uses Google Gemini Vision API
   - Extracts vendor, amount, date, type
   - Categorizes documents automatically

4. **Frontend Integration:**
   - Frontend polls `/api/status` for connection state
   - Fetches documents via `/api/documents`
   - Triggers classification via `/api/classify/:id`

## Usage

1. Start the server
2. Scan QR code with WhatsApp
3. Send or forward receipts/invoices to your WhatsApp
4. Documents are automatically received and classified
5. View results in the frontend dashboard

## Troubleshooting

**QR code not appearing:**
- Check terminal output for errors
- Ensure port 3002 is not in use
- Try deleting `whatsapp-session` folder and restart

**Authentication fails:**
- Delete `whatsapp-session` folder
- Restart server and rescan QR code

**Documents not being received:**
- Check WhatsApp connection status
- Ensure media is image or PDF format
- Check server logs for errors

## Development

```bash
npm run dev  # Start with auto-reload
```

## Port Configuration

Default port: `3002`

To change, update `PORT` in `.env`:
```
PORT=3003
```

## Security Notes

- Keep `.env` file secure (contains API keys)
- Don't commit `whatsapp-session` folder
- API currently has no authentication (add for production)

## License

MIT
