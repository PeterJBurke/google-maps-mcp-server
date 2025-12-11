# OpenAI Platform Setup Guide

This guide walks you through connecting your deployed Google Maps MCP Server to OpenAI Platform.

## Prerequisites

- Deployed MCP server on Cloud Run (or other hosting)
- Service URL (e.g., `https://your-service-name-xxxxx-uc.a.run.app`)
- OpenAI Platform account with access to MCP features

## Step-by-Step Configuration

### 1. Get Your MCP Server URL

After deployment, you need to get your Cloud Run service URL and add `/mcp` to the end.

**Understanding the URL Format:**

Your MCP server URL has two parts:
1. **Base URL** (from Cloud Run): `https://google-maps-mcp-server-xxxxx-uc.a.run.app`
   - This is your Cloud Run service URL
   - The `xxxxx` part is a unique identifier Google assigns
   - The `uc` means `us-central1` region
   - `.a.run.app` is Google's Cloud Run domain

2. **MCP Endpoint Path**: `/mcp`
   - This is the specific endpoint your server listens on
   - Always add this to the end of your Cloud Run URL

**Final MCP URL Format:**
```
https://google-maps-mcp-server-xxxxx-uc.a.run.app/mcp
```

**How to Get Your Actual URL:**

**Method 1: From GitHub Actions (Easiest)**
1. Go to your repository → **Actions** tab
2. Click on the most recent successful workflow run (green checkmark)
3. Scroll down to the **"Get Service URL"** step
4. Look for the output: `MCP Endpoint: https://google-maps-mcp-server-xxxxx-uc.a.run.app/mcp`
5. Copy that entire URL

**Method 2: From Google Cloud Console**
1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Make sure your project is selected (top dropdown)
3. Click on the service named **`google-maps-mcp-server`**
4. At the top of the service details page, you'll see a **URL** field
5. Copy that URL (it will look like: `https://google-maps-mcp-server-xxxxx-uc.a.run.app`)
6. Add `/mcp` to the end: `https://google-maps-mcp-server-xxxxx-uc.a.run.app/mcp`

**Method 3: Using gcloud CLI (if you have it installed)**
```bash
SERVICE_URL=$(gcloud run services describe google-maps-mcp-server \
  --region us-central1 \
  --format 'value(status.url)')

echo "MCP Endpoint: ${SERVICE_URL}/mcp"
```

**Example:**
If your Cloud Run service URL is:
```
https://google-maps-mcp-server-a1b2c3d4-uc.a.run.app
```

Then your MCP endpoint URL is:
```
https://google-maps-mcp-server-a1b2c3d4-uc.a.run.app/mcp
```

**Important:** Always include `/mcp` at the end - this is the endpoint path your server uses!

### 2. Access OpenAI Platform

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to the Chat section
3. Click on "Tools" or look for "Add MCP Server" option
4. Click "Configure Tools" → "Connect to MCP Server"

### 3. Configure MCP Server Connection

In the "Connect to MCP Server" modal:

#### Required Fields

- **URL**: 
  - This is your MCP server endpoint URL
  - Format: `https://google-maps-mcp-server-xxxxx-uc.a.run.app/mcp`
  - **Important:** Use the actual URL from your deployment (see Step 1 above)
  - **Important:** Must end with `/mcp` - this is the endpoint path
  - Example: `https://google-maps-mcp-server-a1b2c3d4-uc.a.run.app/mcp`

- **Label**: 
  ```
  google-maps-platform-code-assist
  ```
  (Or any name you prefer)

- **Description** (optional):
  ```
  Google Maps Platform Code Assist MCP Server - Provides access to official documentation and code samples
  ```

#### Authentication

**Option 1: Unauthenticated Access** (Default)
- Leave authentication dropdown as "None" or empty
- Works if you deployed with `--allow-unauthenticated`

**Option 2: Access Token / API Key**
- Select "Access token / API key" from dropdown
- Enter your authentication token
- Required if you removed `--allow-unauthenticated` from deployment

### 4. Connect

Click the "Connect" button.

### 5. Verify Connection

You should see:
- Success message confirming connection
- The MCP server listed in your tools
- Status indicator showing it's connected

## Testing the Integration

### Test Queries

Try asking ChatGPT questions like:

1. **Documentation Queries:**
   - "How do I use the Places API?"
   - "Show me the documentation for the Geocoding API"
   - "What are the best practices for using Google Maps JavaScript API?"

2. **Code Examples:**
   - "Show me code for geocoding an address in Node.js"
   - "How do I add markers to a map?"
   - "Give me an example of calculating directions"

3. **Specific Features:**
   - "How do I implement autocomplete for addresses?"
   - "What's the difference between Places API and Places SDK?"
   - "Show me how to use the Routes API"

### Expected Behavior

When working correctly:
- ChatGPT should provide accurate, up-to-date information
- Responses should reference official Google Maps Platform documentation
- Code examples should be current and follow best practices
- ChatGPT can access the latest documentation even if it's newer than the model's training data

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to MCP server

**Solutions**:
1. Verify the URL is correct (must end with `/mcp`)
2. Test the endpoint directly:
   ```bash
   curl https://your-service-url.run.app/health
   ```
3. Check Cloud Run service is running:
   ```bash
   gcloud run services describe google-maps-mcp-server --region us-central1
   ```
4. Verify the service allows unauthenticated access (if not using auth)

**Problem**: Connection times out

**Solutions**:
1. Check Cloud Run service logs for errors
2. Verify the service has sufficient resources (memory, CPU)
3. Check network connectivity
4. Verify firewall rules allow traffic

### Authentication Issues

**Problem**: Authentication required error

**Solutions**:
1. If you removed `--allow-unauthenticated`, add it back:
   ```bash
   gcloud run services update google-maps-mcp-server \
     --allow-unauthenticated \
     --region us-central1
   ```
2. Or configure proper authentication in OpenAI Platform
3. Set up IAM permissions if using authenticated access

### Functionality Issues

**Problem**: ChatGPT doesn't use the MCP tools

**Solutions**:
1. Verify the connection is active in OpenAI Platform
2. Try explicitly asking ChatGPT to use Google Maps documentation
3. Check MCP server logs for errors:
   ```bash
   gcloud run services logs read google-maps-mcp-server --region us-central1
   ```
4. Test the MCP endpoint directly:
   ```bash
   curl -X POST https://your-service-url.run.app/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"initialize","id":1}'
   ```

**Problem**: Responses are outdated or incorrect

**Solutions**:
1. The MCP server should provide up-to-date docs, but verify it's working
2. Check if the RAG engine is functioning properly
3. Review server logs for any errors

## Advanced Configuration

### Using with Authentication

If you want to secure your MCP server:

1. **Remove Public Access:**
   ```bash
   gcloud run services update google-maps-mcp-server \
     --no-allow-unauthenticated \
     --region us-central1
   ```

2. **Create Service Account:**
   ```bash
   gcloud iam service-accounts create mcp-client \
     --display-name="MCP Client Service Account"
   ```

3. **Grant Permissions:**
   ```bash
   gcloud run services add-iam-policy-binding google-maps-mcp-server \
     --member="serviceAccount:mcp-client@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/run.invoker" \
     --region us-central1
   ```

4. **Generate Access Token:**
   ```bash
   gcloud auth print-access-token
   ```

5. **Use Token in OpenAI Platform:**
   - Select "Access token / API key" in authentication
   - Enter the token

### Multiple Environments

You can deploy multiple instances for different environments:

- **Development**: `google-maps-mcp-server-dev`
- **Staging**: `google-maps-mcp-server-staging`
- **Production**: `google-maps-mcp-server`

Connect each to different OpenAI Platform workspaces or use different labels.

## Monitoring

### Check Usage

```bash
# View service metrics
gcloud run services describe google-maps-mcp-server \
  --region us-central1 \
  --format="yaml(status)"
```

### View Logs

```bash
# Real-time logs
gcloud run services logs tail google-maps-mcp-server \
  --region us-central1

# Recent logs
gcloud run services logs read google-maps-mcp-server \
  --region us-central1 \
  --limit 100
```

### Set Up Alerts

1. Go to [Cloud Monitoring](https://console.cloud.google.com/monitoring)
2. Create alert policies for:
   - High error rates
   - High latency
   - Resource exhaustion

## Best Practices

1. **Use Descriptive Labels**: Make it easy to identify the MCP server
2. **Monitor Costs**: Keep an eye on Cloud Run usage
3. **Set Resource Limits**: Prevent runaway costs
4. **Regular Updates**: Keep the MCP server package updated
5. **Test Regularly**: Verify the integration is working
6. **Document Changes**: Keep track of configuration changes

## Next Steps

- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Google Maps Platform Documentation](https://developers.google.com/maps)

