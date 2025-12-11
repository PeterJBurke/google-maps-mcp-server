# Google Maps MCP Server for OpenAI Platform

Deploy the Google Maps Platform Code Assist MCP server to Google Cloud Run and connect it to OpenAI Platform, enabling ChatGPT to access up-to-date Google Maps Platform documentation and code samples.

## Overview

This project provides a complete deployment solution for the Google Maps Platform Code Assist MCP server. The MCP server acts as an intermediary that:

- Receives MCP protocol requests from ChatGPT (via OpenAI Platform)
- Queries Google Maps Platform documentation via an internal RAG engine
- Returns relevant documentation snippets and code samples

## Architecture

```
OpenAI Platform (ChatGPT) 
    ↓ HTTP POST (MCP Protocol)
Your MCP Server (Cloud Run)
    ↓ Internal RAG Engine
Google Maps Platform Documentation & Code Samples
```

## Prerequisites

### Required Tools

- **Node.js** (LTS version, v18+)
- **npm** (comes with Node.js)
- **Docker** (for building and testing containers)
- **Google Cloud SDK** (`gcloud` CLI)
- **Git** (for cloning repository)

### Google Cloud Setup

1. Create a [Google Cloud account](https://cloud.google.com/)
2. Enable billing (Cloud Run requires a billing account)
3. Install Google Cloud SDK: [Installation Guide](https://cloud.google.com/sdk/docs/install)
4. Authenticate: `gcloud auth login`
5. Set your project: `gcloud config set project YOUR_PROJECT_ID`

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/PeterJBurke/google-maps-mcp-server.git
cd google-maps-mcp-server
npm install
```

### 2. Test Locally

```bash
# Using Docker Compose
docker-compose up

# Or using Node.js directly
npm start
```

Test the health endpoint:
```bash
curl http://localhost:8080/health
```

### 3. Deploy to Cloud Run

**Linux/Mac:**
```bash
./deploy.sh
```

**Windows:**
```powershell
.\deploy.ps1
```

**Manual Deployment:**
```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/google-maps-mcp-server .

# Push to Google Container Registry
gcloud auth configure-docker
docker push gcr.io/YOUR_PROJECT_ID/google-maps-mcp-server

# Deploy to Cloud Run
gcloud run deploy google-maps-mcp-server \
  --image gcr.io/YOUR_PROJECT_ID/google-maps-mcp-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1
```

### 4. Configure OpenAI Platform

1. Open [OpenAI Platform](https://platform.openai.com/chat/edit?models=gpt-4.1)
2. Click "Add MCP Server" or use the "Connect to MCP Server" modal
3. Enter the following:
   - **URL**: `https://your-service-name-xxxxx-uc.a.run.app/mcp`
   - **Label**: `google-maps-platform-code-assist`
   - **Description**: `Google Maps Platform Code Assist MCP Server - Provides access to official documentation and code samples`
   - **Authentication**: Leave empty (or configure if using authenticated access)

4. Click "Connect"

### 5. Test the Integration

Ask ChatGPT questions like:
- "How do I use the Places API?"
- "Show me code for geocoding an address"
- "What's the best way to display a map with markers?"

## Project Structure

```
google-maps-mcp-server/
├── README.md                 # This file
├── package.json              # Node.js dependencies
├── Dockerfile                # Container configuration
├── docker-compose.yml        # Local development setup
├── server.js                 # HTTP server wrapper
├── deploy.sh                 # Deployment script (Unix/Mac/Linux)
├── deploy.ps1                # Deployment script (Windows)
├── .dockerignore            # Docker build exclusions
├── .gitignore               # Git ignore patterns
├── .gcloudignore           # Cloud Run source exclusions
└── docs/
    ├── DEPLOYMENT.md        # Detailed deployment guide
    ├── OPENAI_SETUP.md      # OpenAI Platform setup guide
    └── TROUBLESHOOTING.md   # Common issues and solutions
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 8080, Cloud Run sets this automatically)
- `NODE_ENV`: Environment (production, development)

### Cloud Run Settings

Default configuration:
- **Memory**: 512Mi
- **CPU**: 1
- **Min Instances**: 0 (scales to zero)
- **Max Instances**: 10
- **Timeout**: 300 seconds
- **Port**: 8080

To customize, edit the deployment script or use `gcloud run services update`.

## Testing

### Local Testing

```bash
# Health check
curl http://localhost:8080/health

# MCP endpoint test
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1}'
```

### Production Testing

After deployment, test the Cloud Run endpoint:

```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe google-maps-mcp-server \
  --region us-central1 \
  --format 'value(status.url)')

# Health check
curl $SERVICE_URL/health

# MCP endpoint
curl -X POST $SERVICE_URL/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1}'
```

## Available MCP Tools

Once connected to OpenAI Platform, ChatGPT will have access to:

- **`retrieve-instructions`**: Helper tool for understanding how to query Google Maps Platform docs
- **`retrieve-google-maps-platform-docs`**: Primary tool for searching official documentation, tutorials, and code samples

## Costs

Google Cloud Run pricing:
- **Free Tier**: 2 million requests per month, 360,000 GB-seconds of memory, 180,000 vCPU-seconds
- **After Free Tier**: Pay only for what you use
  - Requests: $0.40 per million
  - Memory: $0.0000025 per GB-second
  - CPU: $0.00002400 per vCPU-second

For typical usage, costs are minimal. See [Cloud Run Pricing](https://cloud.google.com/run/pricing) for details.

## Security

### Production Recommendations

1. **Enable Authentication**: Remove `--allow-unauthenticated` and use IAM
2. **Use HTTPS**: Cloud Run provides HTTPS by default
3. **Set Resource Limits**: Configure appropriate memory and CPU limits
4. **Monitor Usage**: Set up Cloud Monitoring alerts
5. **Review Logs**: Regularly check Cloud Run logs for issues

### Authentication Setup

To require authentication:

```bash
gcloud run services update google-maps-mcp-server \
  --no-allow-unauthenticated \
  --region us-central1
```

Then configure OpenAI Platform with an access token.

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues and solutions.

Common issues:
- Docker build failures
- Cloud Run deployment errors
- Connection issues with OpenAI Platform
- Performance problems

## Documentation

- [Detailed Deployment Guide](docs/DEPLOYMENT.md)
- [OpenAI Platform Setup](docs/OPENAI_SETUP.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [Google Maps Platform MCP Documentation](https://developers.google.com/maps/ai/mcp)

## License

Apache 2.0

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

- **Google Maps Platform Docs**: [developers.google.com/maps](https://developers.google.com/maps)
- **MCP Documentation**: [developers.google.com/maps/ai/mcp](https://developers.google.com/maps/ai/mcp)
- **Cloud Run Docs**: [cloud.google.com/run/docs](https://cloud.google.com/run/docs)

