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

### 2. Install Google Cloud SDK

**Linux:**
```bash
# Download and install
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

**macOS:**
```bash
# Using Homebrew
brew install google-cloud-sdk
gcloud init
```

**Windows:**
Download and run the [installer](https://cloud.google.com/sdk/docs/install)

### 3. Authenticate

```bash
gcloud auth login
gcloud auth application-default login
```

### 4. Set Project

```bash
gcloud config set project YOUR_PROJECT_ID
```

### 5. Enable Required APIs

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com
```

## Initial Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd google-maps-mcp-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Test Locally (Optional)

```bash
# Using Docker
docker-compose up

# Or directly with Node.js
npm start
```

Test the server:
```bash
curl http://localhost:8080/health
```

## Building the Docker Image

### Option 1: Using the Deployment Script

**Linux/Mac:**
```bash
./deploy.sh
```

**Windows:**
```powershell
.\deploy.ps1
```

The script will automatically:
- Check prerequisites
- Build the Docker image
- Push to Google Container Registry
- Deploy to Cloud Run

### Option 2: Manual Build

```bash
# Set variables
PROJECT_ID="your-project-id"
SERVICE_NAME="google-maps-mcp-server"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Build the image
docker build -t ${IMAGE_NAME} .

# Verify the image
docker images | grep ${SERVICE_NAME}
```

## Pushing to Container Registry

### 1. Configure Docker Authentication

```bash
gcloud auth configure-docker
```

### 2. Push the Image

```bash
docker push ${IMAGE_NAME}
```

This may take a few minutes depending on your internet connection.

### 3. Verify Push

```bash
gcloud container images list --repository=gcr.io/${PROJECT_ID}
```

## Deploying to Cloud Run

### Basic Deployment

```bash
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

### Advanced Deployment with Custom Settings

```bash
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --concurrency 80 \
  --max-instances 100
```

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

### Update with New Image

```bash
# Rebuild and push
docker build -t ${IMAGE_NAME} .
docker push ${IMAGE_NAME}

# Update Cloud Run service
gcloud run services update ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --region us-central1
```

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
- Test locally first

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

## Next Steps

After successful deployment:
1. [Configure OpenAI Platform](../docs/OPENAI_SETUP.md)
2. Test the integration
3. Monitor usage and costs
4. Set up alerts if needed

