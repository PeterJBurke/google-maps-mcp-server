# Google Maps MCP Server Deployment Script (PowerShell)
# Deploys to Google Cloud Run using Docker build and push

$ErrorActionPreference = "Stop"

# Configuration
$SERVICE_NAME = "google-maps-mcp-server"
$REGION = if ($env:REGION) { $env:REGION } else { "us-central1" }
$PROJECT_ID = ""

# Functions
function Write-Error-Custom {
    Write-Host "Error: $args" -ForegroundColor Red
}

function Write-Success {
    Write-Host $args -ForegroundColor Green
}

function Write-Info {
    Write-Host $args -ForegroundColor Yellow
}

# Check prerequisites
function Check-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check for gcloud
    if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "gcloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
        exit 1
    }
    
    # Check for Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "Docker is not installed. Please install it from https://docs.docker.com/get-docker/"
        exit 1
    }
    
    Write-Success "All prerequisites are installed"
}

# Get or set project ID
function Get-ProjectId {
    $script:PROJECT_ID = gcloud config get-value project 2>$null
    
    if ([string]::IsNullOrEmpty($PROJECT_ID)) {
        Write-Info "No project ID set. Please enter your Google Cloud project ID:"
        $script:PROJECT_ID = Read-Host
        
        if ([string]::IsNullOrEmpty($PROJECT_ID)) {
            Write-Error-Custom "Project ID is required"
            exit 1
        }
        
        gcloud config set project $PROJECT_ID
        Write-Success "Project set to: $PROJECT_ID"
    } else {
        Write-Info "Using project: $PROJECT_ID"
    }
}

# Enable required APIs
function Enable-Apis {
    Write-Info "Enabling required Google Cloud APIs..."
    
    gcloud services enable `
        cloudbuild.googleapis.com `
        run.googleapis.com `
        artifactregistry.googleapis.com `
        --project=$PROJECT_ID 2>$null
    
    Write-Success "APIs enabled"
}

# Build Docker image
function Build-Image {
    Write-Info "Building Docker image..."
    
    $IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"
    
    docker build -t $IMAGE_NAME .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Docker build failed"
        exit 1
    }
    
    Write-Success "Docker image built: $IMAGE_NAME"
    return $IMAGE_NAME
}

# Push Docker image
function Push-Image {
    param($ImageName)
    
    Write-Info "Pushing Docker image to Google Container Registry..."
    
    # Configure Docker to use gcloud as a credential helper
    gcloud auth configure-docker --quiet
    
    docker push $ImageName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Docker push failed"
        exit 1
    }
    
    Write-Success "Docker image pushed"
}

# Deploy to Cloud Run
function Deploy-ToCloudRun {
    param($ImageName)
    
    Write-Info "Deploying to Cloud Run..."
    
    gcloud run deploy $SERVICE_NAME `
        --image $ImageName `
        --platform managed `
        --region $REGION `
        --allow-unauthenticated `
        --port 8080 `
        --memory 512Mi `
        --cpu 1 `
        --min-instances 0 `
        --max-instances 10 `
        --timeout 300 `
        --project $PROJECT_ID
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Cloud Run deployment failed"
        exit 1
    }
    
    Write-Success "Deployment successful!"
}

# Get service URL
function Get-ServiceUrl {
    $SERVICE_URL = gcloud run services describe $SERVICE_NAME `
        --platform managed `
        --region $REGION `
        --format 'value(status.url)' `
        --project $PROJECT_ID
    
    $MCP_ENDPOINT = "$SERVICE_URL/mcp"
    
    Write-Host ""
    Write-Success "=========================================="
    Write-Success "Deployment Complete!"
    Write-Success "=========================================="
    Write-Host ""
    Write-Info "Service URL: $SERVICE_URL"
    Write-Info "MCP Endpoint: $MCP_ENDPOINT"
    Write-Host ""
    Write-Info "Next steps:"
    Write-Host "1. Test the health endpoint: curl $SERVICE_URL/health"
    Write-Host "2. Configure in OpenAI Platform:"
    Write-Host "   - URL: $MCP_ENDPOINT"
    Write-Host "   - Label: google-maps-platform-code-assist"
    Write-Host "   - Description: Google Maps Platform Code Assist MCP Server"
    Write-Host ""
}

# Main execution
function Main {
    Write-Host "Google Maps MCP Server Deployment"
    Write-Host "================================"
    Write-Host ""
    
    Check-Prerequisites
    Get-ProjectId
    Enable-Apis
    $imageName = Build-Image
    Push-Image -ImageName $imageName
    Deploy-ToCloudRun -ImageName $imageName
    Get-ServiceUrl
}

# Run main function
Main

