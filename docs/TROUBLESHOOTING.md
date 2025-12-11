# Troubleshooting Guide

Common issues and solutions for the Google Maps MCP Server deployment and OpenAI Platform integration.

## Table of Contents

1. [Deployment Issues](#deployment-issues)
2. [Connection Issues](#connection-issues)
3. [Runtime Issues](#runtime-issues)
4. [Performance Issues](#performance-issues)
5. [Cost Issues](#cost-issues)

## Deployment Issues

### GitHub Actions Workflow Fails

**Symptoms:**
- Workflow shows "Failure" status with red X
- Error message: "Process completed with exit code 1"
- Workflow run appears in Actions tab but fails

**How to View Detailed Error Logs:**

1. Go to your repository → Click **"Actions"** tab (at the top)
2. Find the failed workflow run (it will have a red X)
3. Click on the workflow run name (e.g., "Deploy to Cloud Run #15")
4. You'll see a list of jobs - click on the **"deploy"** job (it will have a red X)
5. Expand each step to see detailed error messages:
   - Click on **"Authenticate to Google Cloud"** to see if authentication failed
   - Click on **"Deploy to Cloud Run"** to see the actual deployment error
   - The error message will tell you exactly what went wrong

**Common Causes and Solutions:**

1. **Missing or Incorrect GitHub Secrets:**
   - **Error**: "Secret not found" or authentication errors
   - **Solution**: 
     - Go to repository → **Settings** → **Secrets and variables** → **Actions**
     - Verify both `GCP_PROJECT_ID` and `GCP_SA_KEY` exist
     - Check that `GCP_PROJECT_ID` contains your actual Project ID (not project name)
     - Check that `GCP_SA_KEY` contains the complete JSON from the service account key file

2. **Service Account Permissions Missing:**
   - **Error**: `PERMISSION_DENIED: Build failed because the service account is missing required IAM permissions`
   - **Error**: `Caller does not have required permission to use project`
   - **Error**: `Grant the caller the roles/serviceusage.serviceUsageConsumer role`
   - **Error**: `PERMISSION_DENIED: Permission 'storage.buckets.create' denied`
   - **Error**: `storage.buckets.create access to the Google Cloud project`
   - **Error**: `PERMISSION_DENIED: Permission 'artifactregistry.repositories.create' denied`
   - **Error**: `PERMISSION_DENIED: Permission 'artifactregistry.repositories.get' denied`
   - **Error**: "Permission denied while accessing Artifact Registry"
   - **Error**: "Permission denied" or "does not have permission"
   - **Solution**:
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Navigate to **IAM & Admin** → **Service Accounts**
     - Click on `github-actions` service account → **Permissions** tab
     - Click **"Manage access"** → Verify these **five** roles are assigned:
       - **Cloud Run Admin** (`roles/run.admin`)
       - **Service Account User** (`roles/iam.serviceAccountUser`)
       - **Cloud Build Editor** (`roles/cloudbuild.builds.editor`)
       - **Artifact Registry Administrator** (`roles/artifactregistry.admin`) - **CRITICAL!**
         - **Important:** "Artifact Registry Writer" (`roles/artifactregistry.writer`) is NOT sufficient
         - Writer role can only push/pull images, but cannot CREATE repositories
         - When using `--source`, Cloud Run needs to CREATE the repository if it doesn't exist
         - Administrator role provides full access including repository creation
       - **Storage Admin** (`roles/storage.admin`) - **REQUIRED for source uploads!**
         - **Error if missing**: `storage.buckets.create access denied`
         - Cloud Build needs to create temporary buckets to stage source code
     - If any are missing, click **"+ Add role"** and add them
     - **Remove "Artifact Registry Writer" if you have it** and replace with "Artifact Registry Administrator"

3. **APIs Not Enabled (Most Common Issue):**
   - **Error**: `PERMISSION_DENIED: Cloud Build API has not been used in project *** before or it is disabled`
   - **Error**: `PERMISSION_DENIED: Cloud Run Admin API has not been used in project *** before or it is disabled`
   - **Error**: `API [cloudbuild.googleapis.com] not enabled on project`
   - **Error**: `API [run.googleapis.com] not enabled on project`
   - **Error**: `API not enabled` or `service is not available`
   - **Solution**:
     1. Go to [Google Cloud Console](https://console.cloud.google.com/)
     2. Make sure your project is selected
     3. Navigate to **APIs & Services** → **Library**
     4. Search for and enable these APIs (click on each, then click **"Enable"**):
        - **Cloud Run API** (also called "Cloud Run Admin API")
          - Direct link: [Enable Cloud Run API](https://console.cloud.google.com/apis/library/run.googleapis.com)
          - **Required for**: Deploying services to Cloud Run
        - **Cloud Build API** ⚠️ **CRITICAL**
          - Direct link: [Enable Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com)
          - **Required for**: Building Docker images from source (`--source` flag)
          - **Error if missing**: `PERMISSION_DENIED: Cloud Build API has not been used in project`
        - **Artifact Registry API**
          - Direct link: [Enable Artifact Registry API](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com)
          - **Required for**: Storing Docker images built from source
     5. **Verify APIs are enabled:**
        - Go to **APIs & Services** → **Enabled APIs**
        - Make sure all three APIs show as "Enabled"
     6. **Wait 2-3 minutes** after enabling for the APIs to propagate to all systems
     7. Re-run the GitHub Actions workflow (click **"Re-run jobs"** button)

4. **Billing Not Enabled:**
   - **Error**: "Billing account required" or "billing is not enabled"
   - **Solution**:
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Navigate to **Billing**
     - Link a billing account to your project
     - Cloud Run requires billing to be enabled

5. **Project ID Mismatch:**
   - **Error**: "Project not found" or "invalid project"
   - **Solution**:
     - Verify your `GCP_PROJECT_ID` secret matches your actual Project ID
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Navigate to **IAM & Admin** → **Settings**
     - Copy the exact **Project ID** (not Project Name)
     - Update the `GCP_PROJECT_ID` secret in GitHub with the correct value

6. **Service Account Key Invalid:**
   - **Error**: "Invalid credentials" or "authentication failed"
   - **Solution**:
     - The service account key JSON might be corrupted or incomplete
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Navigate to **IAM & Admin** → **Service Accounts**
     - Click on `github-actions` → **Keys** tab
     - Delete the old key (if you want) and create a new one
     - Copy the ENTIRE JSON file contents (including all curly braces)
     - Update the `GCP_SA_KEY` secret in GitHub with the new key

7. **Build Errors:**
   - **Error**: Docker build fails or package installation errors
   - **Solution**:
     - Check the **"Deploy to Cloud Run"** step logs in GitHub Actions
     - Common issues:
       - Missing files (Dockerfile, package.json, server.js)
       - Package installation failures
       - Dockerfile syntax errors
     - Verify all required files are committed to the repository

**How to Re-run a Failed Workflow:**

1. Go to repository → **Actions** tab
2. Click on the failed workflow run
3. Click the **"Re-run jobs"** button (top right, dropdown button)
4. Select **"Re-run all jobs"** from the dropdown
5. The workflow will start again

### Docker Build Fails

**Symptoms:**
- `docker build` command fails
- Error messages about missing files or dependencies

**Solutions:**

1. **Check Docker is Running:**
   ```bash
   docker ps
   ```
   If this fails, start Docker Desktop or Docker daemon.

2. **Verify Dockerfile:**
   ```bash
   # Check Dockerfile exists and is readable
   cat Dockerfile
   ```

3. **Check Disk Space:**
   ```bash
   df -h  # Linux/Mac
   ```
   Ensure you have at least 5GB free space.

4. **Clear Docker Cache:**
   ```bash
   docker system prune -a
   ```

5. **Rebuild from Scratch:**
   ```bash
   docker build --no-cache -t google-maps-mcp-server .
   ```

### Image Push Fails

**Symptoms:**
- `docker push` fails with authentication errors
- Permission denied errors

**Solutions:**

1. **Re-authenticate:**
   ```bash
   gcloud auth login
   gcloud auth configure-docker
   ```

2. **Verify Project Permissions:**
   ```bash
   gcloud projects get-iam-policy YOUR_PROJECT_ID
   ```
   Ensure you have `roles/storage.admin` or `roles/container.admin`.

3. **Check Project ID:**
   ```bash
   gcloud config get-value project
   ```
   Verify it matches your intended project.

4. **Enable Container Registry API:**
   ```bash
   gcloud services enable containerregistry.googleapis.com
   ```

### Cloud Run Deployment Fails

**Symptoms:**
- `gcloud run deploy` fails
- Service creation errors

**Solutions:**

1. **Enable Required APIs:**
   ```bash
   gcloud services enable \
     cloudbuild.googleapis.com \
     run.googleapis.com \
     artifactregistry.googleapis.com
   ```

2. **Check Billing:**
   ```bash
   gcloud billing accounts list
   ```
   Ensure billing is enabled for your project.

3. **Verify Image Exists:**
   ```bash
   gcloud container images list --repository=gcr.io/YOUR_PROJECT_ID
   ```

4. **Check Quotas:**
   ```bash
   gcloud compute project-info describe --project=YOUR_PROJECT_ID
   ```
   Ensure you haven't exceeded Cloud Run quotas.

5. **Try Different Region:**
   ```bash
   gcloud run deploy google-maps-mcp-server \
     --image gcr.io/YOUR_PROJECT_ID/google-maps-mcp-server \
     --region us-east1  # Try different region
   ```

## Connection Issues

### Cannot Connect from OpenAI Platform

**Symptoms:**
- Connection timeout in OpenAI Platform
- "Cannot reach server" error

**Solutions:**

1. **Verify Service is Running:**
   ```bash
   gcloud run services describe google-maps-mcp-server \
     --region us-central1
   ```
   Check the status is "Ready".

2. **Test Endpoint Directly:**
   ```bash
   curl https://your-service-url.run.app/health
   ```
   Should return JSON with status "healthy".

3. **Check URL Format:**
   - Must use HTTPS (not HTTP)
   - Must include `/mcp` at the end
   - Example: `https://service-name-xxxxx.run.app/mcp`

4. **Verify Public Access:**
   ```bash
   gcloud run services get-iam-policy google-maps-mcp-server \
     --region us-central1
   ```
   Should show `allUsers` with `roles/run.invoker` if using unauthenticated access.

5. **Check Firewall Rules:**
   Cloud Run services are public by default when `--allow-unauthenticated` is used.
   If issues persist, check VPC firewall rules if using VPC connector.

### Authentication Errors

**Symptoms:**
- 401 Unauthorized errors
- Authentication required messages

**Solutions:**

1. **Enable Unauthenticated Access:**
   ```bash
   gcloud run services update google-maps-mcp-server \
     --allow-unauthenticated \
     --region us-central1
   ```

2. **Or Set Up Proper Authentication:**
   - Create service account
   - Grant `roles/run.invoker` permission
   - Use access token in OpenAI Platform

3. **Check IAM Policy:**
   ```bash
   gcloud run services get-iam-policy google-maps-mcp-server \
     --region us-central1
   ```

### CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Preflight requests fail

**Solutions:**

1. **Verify CORS Headers:**
   The server.js should include CORS headers. Check server logs:
   ```bash
   gcloud run services logs read google-maps-mcp-server \
     --region us-central1
   ```

2. **Update server.js:**
   Ensure CORS headers are properly set:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
   ```

## Runtime Issues

### Server Crashes

**Symptoms:**
- Service becomes unavailable
- 500 errors
- Logs show crashes

**Solutions:**

1. **Check Logs:**
   ```bash
   gcloud run services logs read google-maps-mcp-server \
     --region us-central1 \
     --limit 100
   ```

2. **Increase Memory:**
   ```bash
   gcloud run services update google-maps-mcp-server \
     --memory 1Gi \
     --region us-central1
   ```

3. **Check for Memory Leaks:**
   Review server.js for potential memory issues.

4. **Verify Dependencies:**
   ```bash
   npm audit
   npm update
   ```

### MCP Protocol Errors

**Symptoms:**
- Invalid JSON-RPC responses
- Protocol errors in logs

**Solutions:**

1. **Verify Request Format:**
   MCP uses JSON-RPC 2.0. Ensure requests follow the format:
   ```json
   {
     "jsonrpc": "2.0",
     "method": "method_name",
     "id": 1,
     "params": {}
   }
   ```

2. **Check server.js Implementation:**
   Verify the MCP protocol handler is correctly implemented.

3. **Test on Cloud Run:**
   ```bash
   # Get service URL
   SERVICE_URL=$(gcloud run services describe google-maps-mcp-server \
     --region us-central1 \
     --format 'value(status.url)')
   
   # Test MCP endpoint
   curl -X POST ${SERVICE_URL}/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"initialize","id":1}'
   ```

### Package Import Errors

**Symptoms:**
- `@googlemaps/code-assist-mcp` not found
- Module resolution errors

**Solutions:**

1. **Reinstall Dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Verify Package Version:**
   ```bash
   npm list @googlemaps/code-assist-mcp
   ```

3. **Check package.json:**
   Ensure the dependency is listed correctly.

4. **Update Package:**
   ```bash
   npm update @googlemaps/code-assist-mcp
   ```

## Performance Issues

### Slow Response Times

**Symptoms:**
- High latency
- Timeout errors
- Slow ChatGPT responses

**Solutions:**

1. **Increase Resources:**
   ```bash
   gcloud run services update google-maps-mcp-server \
     --memory 1Gi \
     --cpu 2 \
     --region us-central1
   ```

2. **Set Min Instances:**
   ```bash
   gcloud run services update google-maps-mcp-server \
     --min-instances 1 \
     --region us-central1
   ```
   Prevents cold starts but increases costs.

3. **Check Region:**
   Deploy closer to your users or OpenAI's infrastructure.

4. **Optimize Code:**
   Review server.js for performance bottlenecks.

### High Memory Usage

**Symptoms:**
- OOM (Out of Memory) errors
- Service restarts

**Solutions:**

1. **Increase Memory Limit:**
   ```bash
   gcloud run services update google-maps-mcp-server \
     --memory 2Gi \
     --region us-central1
   ```

2. **Review Memory Usage:**
   ```bash
   gcloud run services describe google-maps-mcp-server \
     --region us-central1 \
     --format="value(status.conditions)"
   ```

3. **Check for Memory Leaks:**
   Monitor memory usage over time.

### Cold Start Issues

**Symptoms:**
- First request is very slow
- Subsequent requests are fast

**Solutions:**

1. **Set Min Instances:**
   ```bash
   gcloud run services update google-maps-mcp-server \
     --min-instances 1 \
     --region us-central1
   ```

2. **Optimize Startup:**
   - Minimize dependencies
   - Lazy load heavy modules
   - Use faster Node.js startup flags

3. **Use Health Checks:**
   Cloud Run keeps instances warm if they receive regular health checks.

## Cost Issues

### Unexpected Charges

**Symptoms:**
- Higher than expected Cloud Run bills

**Solutions:**

1. **Review Usage:**
   ```bash
   gcloud billing accounts list
   gcloud billing projects describe YOUR_PROJECT_ID
   ```

2. **Set Budget Alerts:**
   - Go to [Cloud Billing Console](https://console.cloud.google.com/billing)
   - Set up budget alerts

3. **Optimize Configuration:**
   - Reduce memory if possible
   - Set max instances limit
   - Use scale-to-zero (min-instances: 0)

4. **Monitor Usage:**
   ```bash
   gcloud run services describe google-maps-mcp-server \
     --region us-central1 \
     --format="yaml(status)"
   ```

### High Request Volume

**Solutions:**

1. **Set Max Instances:**
   ```bash
   gcloud run services update google-maps-mcp-server \
     --max-instances 10 \
     --region us-central1
   ```

2. **Implement Rate Limiting:**
   Add rate limiting in server.js if needed.

3. **Review Usage Patterns:**
   Check Cloud Monitoring for usage spikes.

## Getting Help

### Check Logs

```bash
# Real-time logs
gcloud run services logs tail google-maps-mcp-server --region us-central1

# Recent errors
gcloud run services logs read google-maps-mcp-server \
  --region us-central1 \
  --limit 100 \
  | grep -i error
```

### Useful Commands

```bash
# Service status
gcloud run services describe google-maps-mcp-server --region us-central1

# Service metrics
gcloud monitoring dashboards list

# Check quotas
gcloud compute project-info describe --project=YOUR_PROJECT_ID
```

### Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Run Troubleshooting](https://cloud.google.com/run/docs/troubleshooting)
- [Google Maps Platform MCP Docs](https://developers.google.com/maps/ai/mcp)
- [OpenAI Platform Documentation](https://platform.openai.com/docs)

## Still Having Issues?

1. Check the [Deployment Guide](DEPLOYMENT.md) for detailed steps
2. Review [OpenAI Setup Guide](OPENAI_SETUP.md) for connection issues
3. Open an issue on GitHub with:
   - Error messages
   - Logs
   - Steps to reproduce
   - Your configuration (without sensitive data)

