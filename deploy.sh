#!/bin/bash

# Google Maps MCP Server Deployment Script
# Deploys to Google Cloud Run using Cloud Build (no local Docker required)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="google-maps-mcp-server"
REGION="${REGION:-us-central1}"
PROJECT_ID=""

# Functions
print_error() {
    echo -e "${RED}Error: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_info() {
    echo -e "${YELLOW}$1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check for gcloud
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Get or set project ID
get_project_id() {
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    
    if [ -z "$PROJECT_ID" ]; then
        print_info "No project ID set. Please enter your Google Cloud project ID:"
        read -r PROJECT_ID
        
        if [ -z "$PROJECT_ID" ]; then
            print_error "Project ID is required"
            exit 1
        fi
        
        gcloud config set project "$PROJECT_ID"
        print_success "Project set to: $PROJECT_ID"
    else
        print_info "Using project: $PROJECT_ID"
    fi
}

# Enable required APIs
enable_apis() {
    print_info "Enabling required Google Cloud APIs..."
    
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        --project="$PROJECT_ID" 2>/dev/null || true
    
    print_success "APIs enabled"
}

# Deploy to Cloud Run using source-based deployment
deploy_to_cloud_run() {
    print_info "Deploying to Cloud Run (building in the cloud)..."
    print_info "This will build the Docker image in Google Cloud Build - no local Docker required!"
    
    gcloud run deploy "$SERVICE_NAME" \
        --source . \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 8080 \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --timeout 300 \
        --project "$PROJECT_ID"
    
    if [ $? -ne 0 ]; then
        print_error "Cloud Run deployment failed"
        exit 1
    fi
    
    print_success "Deployment successful!"
}

# Get service URL
get_service_url() {
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --platform managed \
        --region "$REGION" \
        --format 'value(status.url)' \
        --project "$PROJECT_ID")
    
    MCP_ENDPOINT="${SERVICE_URL}/mcp"
    
    echo ""
    print_success "=========================================="
    print_success "Deployment Complete!"
    print_success "=========================================="
    echo ""
    print_info "Service URL: $SERVICE_URL"
    print_info "MCP Endpoint: $MCP_ENDPOINT"
    echo ""
    print_info "Next steps:"
    echo "1. Test the health endpoint: curl $SERVICE_URL/health"
    echo "2. Configure in OpenAI Platform:"
    echo "   - URL: $MCP_ENDPOINT"
    echo "   - Label: google-maps-platform-code-assist"
    echo "   - Description: Google Maps Platform Code Assist MCP Server"
    echo ""
}

# Main execution
main() {
    echo "Google Maps MCP Server Deployment"
    echo "================================"
    echo ""
    
    check_prerequisites
    get_project_id
    enable_apis
    deploy_to_cloud_run
    get_service_url
}

# Run main function
main

