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

- **GitHub account** (no local tools needed!)
- **Google Cloud account** (for hosting the service)

### Google Cloud Setup

1. Create a [Google Cloud account](https://cloud.google.com/)
2. Enable billing (Cloud Run requires a billing account)
3. Create a project or select an existing one
4. Get your Project ID (see [Deployment Guide](docs/DEPLOYMENT.md#appendix-getting-your-google-cloud-project-id))

**No local tools needed!** Everything can be done via the Google Cloud Console web interface.

## Quick Start

### 1. Deploy to Cloud Run

**Automatic Deployment via GitHub Actions (No Local Files Needed)**

⚠️ **IMPORTANT: Enable APIs First!** Before setting up secrets, you must enable required APIs. See [Step 0: Enable Required APIs](docs/DEPLOYMENT.md#step-0-enable-required-apis-important---do-this-first) for detailed instructions.

Set up once, then every push to the repository automatically deploys:

1. **Enable Required APIs (Do This First!):**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Library**
   - Enable these three APIs:
     - [Cloud Run API](https://console.cloud.google.com/apis/library/run.googleapis.com)
     - [Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com) ⚠️ **Critical**
     - [Artifact Registry API](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com)
   - Wait 2-3 minutes after enabling

2. **Set up GitHub Secrets (Secure - Not Stored in Repository):**
   - Go to your repository: https://github.com/PeterJBurke/google-maps-mcp-server
   - Click **Settings** tab → **Actions** (in left sidebar) → **Secrets and variables** → **Actions**
   - Click **"New repository secret"** button
   - Add two secrets (see detailed instructions in [Deployment Guide](docs/DEPLOYMENT.md#github-actions-setup)):
     - **Name**: `GCP_PROJECT_ID` → **Value**: Your Google Cloud project ID (see [how to get it](docs/DEPLOYMENT.md#appendix-getting-your-google-cloud-project-id))
     - **Name**: `GCP_SA_KEY` → **Value**: Entire contents of your service account key JSON file
   
   **Security Note:** GitHub Secrets are encrypted and stored separately by GitHub. They are:
   - ✅ NOT stored in your repository code
   - ✅ NOT visible in logs or repository history
   - ✅ Only accessible to GitHub Actions workflows
   - ✅ Safe to use even in public repositories
   
   **See [Deployment Guide](docs/DEPLOYMENT.md#github-actions-setup) for step-by-step instructions with detailed explanations.**

3. **Deploy automatically:**
   - **Automatic**: Push code to `main` or `master` branch → automatically deploys
   - **Manual trigger** (to deploy without pushing code):
     - Go to repository → Click **"Actions"** tab at the TOP (in main navigation, not Settings)
     - In left sidebar, click **"Deploy to Cloud Run"**
     - Click **"Run workflow"** button (top right) → Select branch → Click **"Run workflow"**

**Note:** The deployment builds the Docker image in Google Cloud Build automatically. No local tools needed!

### 3. Get Your MCP Server URL

After successful deployment, you need to get your service URL:

**From GitHub Actions:**
1. Go to repository → **Actions** tab
2. Click on the successful workflow run
3. Look for **"Get Service URL"** step output
4. Copy the URL shown (it will end with `/mcp`)

**From Google Cloud Console:**
1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on `google-maps-mcp-server`
3. Copy the URL at the top
4. Add `/mcp` to the end

**URL Format:**
- Base URL: `https://google-maps-mcp-server-xxxxx-uc.a.run.app`
- MCP Endpoint: Add `/mcp` → `https://google-maps-mcp-server-xxxxx-uc.a.run.app/mcp`
- The `xxxxx` is a unique identifier Google assigns to your service

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
├── Dockerfile                # Container configuration for Cloud Run
├── server.js                 # HTTP server wrapper
├── .dockerignore            # Docker build exclusions
├── .gitignore               # Git ignore patterns
├── .gcloudignore           # Cloud Run source exclusions
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions deployment workflow
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

To customize, edit the `.github/workflows/deploy.yml` file in your repository, or update settings via [Google Cloud Console](https://console.cloud.google.com/run).

## Testing

After deployment, test the Cloud Run endpoint:

1. **Get your service URL:**
   - Check the GitHub Actions workflow output (it shows the URL)
   - Or go to [Google Cloud Console](https://console.cloud.google.com/) → **Cloud Run** → Your service → Copy URL

2. **Test the health endpoint:**
   - Visit `https://your-service-url.run.app/health` in your browser
   - Should return JSON with status "healthy"

3. **Test the MCP endpoint:**
   - Use an online tool like [Postman](https://www.postman.com/) or [reqbin.com](https://reqbin.com/)
   - POST to `https://your-service-url.run.app/mcp`
   - Body: `{"jsonrpc":"2.0","method":"initialize","id":1}`

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

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Run** → Your service
3. Click **Edit & Deploy New Revision**
4. Under **Security**, uncheck "Allow unauthenticated invocations"
5. Click **Deploy**

Then configure OpenAI Platform with an access token (see [OpenAI Setup Guide](docs/OPENAI_SETUP.md)).

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues and solutions.

Common issues:
- Docker build failures
- Cloud Run deployment errors
- Connection issues with OpenAI Platform
- Performance problems

## Documentation

- [Detailed Deployment Guide](docs/DEPLOYMENT.md)
- [**Google Maps Setup & Authentication Guide**](docs/GOOGLE_MAPS_SETUP.md) (Recommended)
- [OpenAI Platform Setup](docs/OPENAI_SETUP.md)
- [Security Guide](docs/SECURITY.md) - **Important: Read about GitHub Secrets security**
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [Google Maps Platform MCP Documentation](https://developers.google.com/maps/ai/mcp)

## GitHub Actions Setup

To enable automatic deployment on every push:

**All setup can be done via web interfaces - no local tools required!**

See the detailed step-by-step instructions in [GitHub Actions Setup](docs/DEPLOYMENT.md#github-actions-setup) which includes:
- **Enabling required APIs** (IMPORTANT - do this first!)
- Creating service account via Google Cloud Console (web UI)
- Granting permissions via web interface
- Creating and downloading keys via web interface
- Adding secrets to GitHub

**Quick Summary:**
1. **Enable APIs first**: [Cloud Run API](https://console.cloud.google.com/apis/library/run.googleapis.com), [Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com), [Artifact Registry API](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com)
2. Get your Project ID from [Google Cloud Console](https://console.cloud.google.com/)
3. Create service account and download key (all via web UI)
4. Add secrets to GitHub repository
5. Push to repository → automatically deploys!

## License

Apache 2.0

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

- **Google Maps Platform Docs**: [developers.google.com/maps](https://developers.google.com/maps)
- **MCP Documentation**: [developers.google.com/maps/ai/mcp](https://developers.google.com/maps/ai/mcp)
- **Cloud Run Docs**: [cloud.google.com/run/docs](https://cloud.google.com/run/docs)

