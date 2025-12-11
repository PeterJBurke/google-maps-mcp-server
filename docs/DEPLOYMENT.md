# Detailed Deployment Guide

This guide provides step-by-step instructions for deploying the Google Maps MCP Server to Google Cloud Run.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Building the Docker Image](#building-the-docker-image)
4. [Pushing to Container Registry](#pushing-to-container-registry)
5. [Deploying to Cloud Run](#deploying-to-cloud-run)
6. [Verification](#verification)
7. [Alternative Deployment Options](#alternative-deployment-options)

## Prerequisites

### 1. Google Cloud Account

- Create a [Google Cloud account](https://cloud.google.com/)
- Enable billing (required for Cloud Run)
- Create a new project or select an existing one
- **Get your Project ID** - See [Appendix: Getting Your Google Cloud Project ID](#appendix-getting-your-google-cloud-project-id) below

### 2. GitHub Account

**No local tools required!** Deployment happens automatically via GitHub Actions in the cloud.

You'll need a GitHub account to use GitHub Actions for automatic deployment.

## Deploying to Cloud Run

### GitHub Actions (Automatic Deployment - No Local Files)

Automatic deployment on every push. No need to download or clone anything locally.

1. **Set up GitHub Secrets** (one-time setup):
   - Repository → Settings → Secrets and variables → Actions
   - Add `GCP_PROJECT_ID`: Your Google Cloud project ID
   - Add `GCP_SA_KEY`: Service account key JSON (see [GitHub Actions Setup](#github-actions-setup) section)

2. **Deploy automatically:**
   - Push to `main` or `master` branch → automatically deploys
   - Or manually trigger: Actions tab → "Deploy to Cloud Run" → Run workflow

The deployment workflow:
1. GitHub Actions uploads your source code to Cloud Build
2. Cloud Build builds the Docker image in the cloud (using your Dockerfile)
3. Cloud Run deploys the built image automatically

**No local tools needed! Everything happens in the cloud.**

### Customizing Deployment Settings

To customize deployment settings (memory, CPU, etc.), edit the `.github/workflows/deploy.yml` file in your repository. The default settings are:
- Memory: 512Mi
- CPU: 1
- Min Instances: 0 (scales to zero)
- Max Instances: 10
- Timeout: 300 seconds

You can modify these values in the workflow file and push the changes - GitHub Actions will automatically redeploy with the new settings.

### Deployment Parameters Explained

- `--memory`: Amount of memory allocated (512Mi, 1Gi, 2Gi, etc.)
- `--cpu`: Number of CPUs (1, 2, 4, etc.)
- `--min-instances`: Minimum number of instances (0 = scale to zero)
- `--max-instances`: Maximum number of instances
- `--timeout`: Request timeout in seconds (max 3600)
- `--concurrency`: Number of concurrent requests per instance
- `--allow-unauthenticated`: Allow public access (remove for private)

## Verification

### 1. Get Service URL

```bash
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region us-central1 \
  --format 'value(status.url)')

echo "Service URL: ${SERVICE_URL}"
```

### 2. Test Health Endpoint

```bash
curl ${SERVICE_URL}/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "google-maps-mcp-server",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. Test MCP Endpoint

```bash
curl -X POST ${SERVICE_URL}/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "id": 1,
    "params": {}
  }'
```

### 4. Check Logs

```bash
gcloud run services logs read ${SERVICE_NAME} \
  --region us-central1 \
  --limit 50
```

### 5. View Service Details

```bash
gcloud run services describe ${SERVICE_NAME} \
  --region us-central1
```

## Updating the Deployment

### Update with New Code

Simply push to the repository - GitHub Actions automatically redeploys:

```bash
git add .
git commit -m "Update code"
git push
```

The GitHub Actions workflow automatically:
1. Builds a new Docker image
2. Deploys the updated service to Cloud Run

No manual steps needed!

### Update Configuration

```bash
gcloud run services update ${SERVICE_NAME} \
  --memory 1Gi \
  --cpu 2 \
  --region us-central1
```

## Scaling and Performance

### Auto-scaling

Cloud Run automatically scales based on traffic:
- Scales to zero when no traffic
- Scales up to handle increased load
- Respects min/max instance limits

### Performance Tuning

1. **Memory**: Increase if you see OOM errors
2. **CPU**: Increase for CPU-intensive operations
3. **Concurrency**: Adjust based on request patterns
4. **Min Instances**: Set > 0 to avoid cold starts

### Monitoring

```bash
# View metrics in Cloud Console
gcloud run services describe ${SERVICE_NAME} \
  --region us-central1 \
  --format="value(status.url)"

# Or use Cloud Monitoring
# Visit: https://console.cloud.google.com/run
```

## Alternative Deployment Options

### AWS ECS/Fargate

1. Build Docker image
2. Push to Amazon ECR
3. Create ECS task definition
4. Deploy to Fargate

### Azure Container Instances

1. Build Docker image
2. Push to Azure Container Registry
3. Deploy using Azure CLI

### Self-Hosted

1. Build Docker image
2. Deploy to your own infrastructure
3. Configure reverse proxy (nginx, Traefik, etc.)
4. Set up SSL/TLS certificates

## Troubleshooting

### Build Failures

- Check Docker is running: `docker ps`
- Verify Dockerfile syntax
- Check for sufficient disk space

### Push Failures

- Verify authentication: `gcloud auth list`
- Check project permissions
- Ensure Container Registry API is enabled

### Deployment Failures

- Check Cloud Run API is enabled
- Verify image exists in registry
- Review service logs for errors

### Runtime Issues

- Check service logs
- Verify environment variables
- Review Cloud Run service configuration

## Cleanup

### Delete Service

```bash
gcloud run services delete ${SERVICE_NAME} \
  --region us-central1
```

### Delete Image

```bash
gcloud container images delete ${IMAGE_NAME}
```

### Remove All Resources

```bash
# Delete service
gcloud run services delete ${SERVICE_NAME} --region us-central1

# Delete image
gcloud container images delete ${IMAGE_NAME}

# Optionally delete project (careful!)
# gcloud projects delete ${PROJECT_ID}
```

## GitHub Actions Setup

To enable automatic deployment on every push (no local files or tools needed):

**All steps can be done via the Google Cloud Console web interface - no command line tools required!**

### Option A: Using Google Cloud Console (No Local Tools - Recommended)

#### 1. Create a Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
5. Enter:
   - **Service account name**: `github-actions`
   - **Service account ID**: `github-actions` (auto-filled)
   - **Description**: `Service account for GitHub Actions deployment`
6. Click **Create and Continue**

#### 2. Grant Necessary Permissions

1. In the **Grant this service account access to project** section, add these roles:
   - **Cloud Run Admin** (`roles/run.admin`)
   - **Service Account User** (`roles/iam.serviceAccountUser`)
   - **Cloud Build Editor** (`roles/cloudbuild.builds.editor`)
2. Click **Continue**
3. Click **Done**

#### 3. Create and Download Key

1. Find the `github-actions` service account in the list
2. Click on it to open details
3. Go to the **Keys** tab
4. Click **Add Key** → **Create new key**
5. Select **JSON** format
6. Click **Create**
7. The key file will download automatically - save it securely
8. Copy the entire contents of the downloaded JSON file (you'll need it for GitHub Secrets)

### Option B: Using gcloud CLI (Optional - Only if you prefer command line)

If you have gcloud CLI installed and prefer using it:

#### 1. Create a Google Cloud Service Account

```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account" \
  --project=YOUR_PROJECT_ID
```

#### 2. Grant Necessary Permissions

```bash
# Allow deploying to Cloud Run
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Allow using service accounts
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Allow building images
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"
```

#### 3. Create and Download Key

```bash
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --project=YOUR_PROJECT_ID
```

### 4. Add to GitHub Secrets (Both Options)

**Important Security Information:**
- GitHub Secrets are encrypted and stored separately by GitHub
- They are NOT stored in your repository code
- They are NOT visible in logs, commit history, or pull requests
- They are only accessible to GitHub Actions workflows
- This is safe to use even in public repositories

**Steps:**

1. Go to your repository: https://github.com/PeterJBurke/google-maps-mcp-server
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add two secrets:
   - **Name**: `GCP_PROJECT_ID`
     - **Value**: Your Google Cloud project ID
   - **Name**: `GCP_SA_KEY`
     - **Value**: Contents of the `key.json` file (copy the entire JSON)

**After adding secrets, you can safely delete the `key.json` file from your local machine.**

### 5. Deploy Automatically

- **Automatic**: Push to `main` or `master` branch → automatically deploys
- **Manual**: Go to **Actions** tab → **Deploy to Cloud Run** → **Run workflow**

## Next Steps

After successful deployment:
1. [Configure OpenAI Platform](../docs/OPENAI_SETUP.md)
2. Test the integration
3. Monitor usage and costs
4. Set up alerts if needed

## Appendix: Getting Your Google Cloud Project ID

### What is a Google Cloud Project ID?

A Google Cloud Project ID is a unique identifier for your Google Cloud project. It's used to organize and manage all your Google Cloud resources.

### Option 1: Find Your Existing Project ID

If you already have a Google Cloud project:

1. **Via Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account
   - Look at the top of the page - the project name is displayed in the project selector
   - Click on the project selector to see the **Project ID** (different from project name)
   - The Project ID is usually in the format: `my-project-123456`

2. **Via gcloud CLI (optional - only if you have it installed):**
   ```bash
   gcloud projects list
   ```
   This shows all your projects with their Project IDs.
   
   **Note:** You don't need gcloud CLI - you can do everything via the web console!

3. **From Project Settings:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Go to **IAM & Admin** → **Settings**
   - The **Project ID** is displayed at the top

### Option 2: Create a New Project

If you don't have a Google Cloud project yet:

1. **Via Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click the project selector at the top
   - Click **New Project**
   - Enter a **Project name** (e.g., "Google Maps MCP Server")
   - Google will auto-generate a **Project ID** (you can edit it if needed)
   - Click **Create**
   - Note the **Project ID** that was created

2. **Via gcloud CLI (optional - only if you have it installed):**
   ```bash
   gcloud projects create YOUR_PROJECT_ID \
     --name="Google Maps MCP Server"
   ```
   Replace `YOUR_PROJECT_ID` with your desired ID (must be globally unique).
   
   **Note:** You don't need gcloud CLI - you can create projects via the web console!

### Important Notes

- **Project ID vs Project Name:**
  - **Project Name**: Can be changed, human-readable (e.g., "My MCP Server")
  - **Project ID**: Cannot be changed, unique identifier (e.g., "my-mcp-server-123456")
  - Use the **Project ID** (not the name) for `GCP_PROJECT_ID` secret

- **Project ID Format:**
  - Must be globally unique across all Google Cloud projects
  - Can contain lowercase letters, numbers, and hyphens
  - Must be 6-30 characters long
  - Cannot be changed after creation

- **Billing:**
  - Cloud Run requires a billing account
  - You'll be prompted to enable billing when you first use Cloud Run
  - See [Cloud Run Pricing](https://cloud.google.com/run/pricing) for details

### Verify Your Project ID

To verify you have the correct Project ID:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Check the URL - it should contain your Project ID:
   ```
   https://console.cloud.google.com/home/dashboard?project=YOUR_PROJECT_ID
   ```
4. Or go to **IAM & Admin** → **Settings** to see the Project ID

### Using the Project ID

Once you have your Project ID, add it to GitHub Secrets:

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. **Name**: `GCP_PROJECT_ID`
4. **Value**: Your Project ID (e.g., `my-mcp-server-123456`)
5. Click **Add secret**

That's it! Your Project ID is now securely stored in GitHub Secrets.

