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

### 1. Check GitHub Actions Deployment

1. Go to your repository → **Actions** tab
2. Find the latest "Deploy to Cloud Run" workflow run
3. Check that it completed successfully (green checkmark)
4. Click on the workflow run to see details
5. The output will show your service URL

### 2. Get Service URL

**From GitHub Actions:**
- In the workflow output, look for "MCP Endpoint:" or "Service URL:"

**From Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Run**
3. Find your service (`google-maps-mcp-server`)
4. Click on it to see details
5. Copy the URL shown at the top

### 3. Test Health Endpoint

1. Open your browser
2. Visit: `https://your-service-url.run.app/health`
3. You should see JSON response:
   ```json
   {
     "status": "healthy",
     "service": "google-maps-mcp-server",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

### 4. Test MCP Endpoint

Use an online API testing tool:

1. Go to [Postman](https://www.postman.com/) or [reqbin.com](https://reqbin.com/)
2. Create a POST request to: `https://your-service-url.run.app/mcp`
3. Set header: `Content-Type: application/json`
4. Set body (JSON):
   ```json
   {
     "jsonrpc": "2.0",
     "method": "initialize",
     "id": 1,
     "params": {}
   }
   ```
5. Send the request

### 5. Check Logs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Run** → Your service
3. Click on the **Logs** tab
4. View recent logs and errors

### 6. View Service Details

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Run**
3. Click on your service name
4. View all details: status, metrics, revisions, logs

## Updating the Deployment

### Update with New Code

Simply push to the repository - GitHub Actions automatically redeploys:

1. Make your code changes
2. Commit and push to your repository (via GitHub web interface or Git)
3. GitHub Actions automatically:
   - Builds a new Docker image
   - Deploys the updated service to Cloud Run

No manual steps needed! Check the **Actions** tab to see the deployment progress.

### Update Configuration

To update Cloud Run settings (memory, CPU, etc.):

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Run**
3. Click on your service name
4. Click **Edit & Deploy New Revision**
5. Adjust settings (memory, CPU, timeout, etc.)
6. Click **Deploy**

Or edit the `.github/workflows/deploy.yml` file in your repository and push - GitHub Actions will redeploy with new settings.

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

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Run** → Your service
3. View metrics, logs, and performance data
4. Or go to **Monitoring** → **Cloud Run** for detailed analytics

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

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Run**
3. Find your service and click on it
4. Click **Delete** button
5. Confirm deletion

### Delete Container Images

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Artifact Registry** or **Container Registry**
3. Find the images related to your service
4. Select and delete them

### Remove All Resources

1. Delete the Cloud Run service (see above)
2. Delete container images (see above)
3. Optionally delete the entire project:
   - Go to **IAM & Admin** → **Settings**
   - Click **Delete Project**
   - **Warning:** This deletes everything in the project!

## GitHub Actions Setup

To enable automatic deployment on every push (no local files or tools needed):

**All steps can be done via the Google Cloud Console web interface - no command line tools required!**

### Using Google Cloud Console (No Local Tools Required)

#### 1. Create a Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project from the project selector at the top
3. Click the hamburger menu (☰) in the top left
4. Navigate to **IAM & Admin** → **Service Accounts**
5. Click **Create Service Account** button (usually at the top)
6. **Step 1: Service account details:**
   - **Service account name**: Enter `github-actions`
   - **Service account ID**: Will auto-fill as `github-actions` (you can change if needed)
   - **Description** (optional): `Service account for GitHub Actions deployment`
   - Click **Create and Continue**

#### 2. Grant Necessary Permissions

After clicking "Create and Continue", you'll move to the next step. The interface may show:
- **Step 2: Grant this service account access to project**, OR
- **Grant access to project**, OR
- A section with role/permission options

**If you see a role/permission section:**

1. Look for a button or dropdown that says:
   - **"Grant access"**, OR
   - **"Select a role"**, OR
   - **"Add role"**, OR
   - **"Grant this service account access to project"**

2. Click it to add roles. You'll need to add three roles:

   **Add the first role:**
   - Click the role dropdown or "Select a role" button
   - Type or search for: `Cloud Run Admin`
   - Select **"Cloud Run Admin"** from the list
   - Look for **"Add another role"** button and click it (or click the role dropdown again)

   **Add the second role:**
   - Type or search for: `Service Account User`
   - Select **"Service Account User"** from the list
   - Click **"Add another role"** again (or click the role dropdown)

   **Add the third role:**
   - Type or search for: `Cloud Build Editor`
   - Select **"Cloud Build Editor"** from the list

3. After adding all three roles, click **Continue** (or **Next**)

4. **Final step** (if shown):
   - You may see "Grant users access to this service account" - you can skip this
   - Click **Done** (or **Create** or **Finish**)

**Alternative: If you don't see the role section during creation:**

1. Click **Done** or **Create** to finish creating the service account
2. You'll be taken back to the Service Accounts list
3. Click on the `github-actions` service account you just created
4. Go to the **Permissions** tab (or **IAM** tab)
5. Click **Grant Access** (or **Add Principal**)
6. In **Principal**, enter: `github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com`
7. In **Role**, add each role one by one:
   - `Cloud Run Admin`
   - `Service Account User`
   - `Cloud Build Editor`
8. Click **Save**

#### 3. Create and Download Key

1. Find the `github-actions` service account in the list
2. Click on it to open details
3. Go to the **Keys** tab
4. Click **Add Key** → **Create new key**
5. Select **JSON** format
6. Click **Create**
7. The key file will download automatically - save it securely
8. Copy the entire contents of the downloaded JSON file (you'll need it for GitHub Secrets)

### 4. Add to GitHub Secrets

**Important Security Information:**
- GitHub Secrets are encrypted and stored separately by GitHub
- They are NOT stored in your repository code
- They are NOT visible in logs, commit history, or pull requests
- They are only accessible to GitHub Actions workflows
- This is safe to use even in public repositories

**Detailed Steps:**

#### Step 1: Navigate to Secrets Page

1. Go to your repository: https://github.com/PeterJBurke/google-maps-mcp-server
2. Click on the **Settings** tab (at the top of the repository page)
3. In the left sidebar, find the **"Code and automation"** section
4. Click on **"Actions"** (it has a play button icon)
5. A dropdown menu will appear - click on **"Secrets and variables"**
6. Click on **"Actions"** in the submenu
7. You should now see the "Actions secrets" page

#### Step 2: Add GCP_PROJECT_ID Secret

1. Click the **"New repository secret"** button (green button, usually on the right side)
2. You'll see a form with two fields:
   - **Name** field (required, marked with *)
   - **Secret** field (required, marked with *)

3. **For the first secret:**
   - In the **Name** field, enter exactly: `GCP_PROJECT_ID`
     - Make sure it's all uppercase
     - Use underscores, not hyphens
   - In the **Secret** field, enter your Google Cloud Project ID
     - This is the Project ID (not the project name)
     - Example format: `my-mcp-server-123456`
     - See [Appendix: Getting Your Google Cloud Project ID](#appendix-getting-your-google-cloud-project-id) if you need help finding it
   - Click **"Add secret"** button (green button at the bottom)

#### Step 3: Add GCP_SA_KEY Secret

1. After adding the first secret, you'll be redirected back to the secrets list
2. Click **"New repository secret"** again
3. **For the second secret:**
   - In the **Name** field, enter exactly: `GCP_SA_KEY`
     - Make sure it's all uppercase
     - Use underscores, not hyphens
   - In the **Secret** field, paste the entire contents of your service account key JSON file
     - Open the `key.json` file you downloaded (from Step 3 above)
     - Select ALL the text (Ctrl+A / Cmd+A)
     - Copy it (Ctrl+C / Cmd+C)
     - Paste it into the Secret field (Ctrl+V / Cmd+V)
     - The JSON should look like:
       ```json
       {
         "type": "service_account",
         "project_id": "your-project-id",
         "private_key_id": "...",
         "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
         ...
       }
       ```
     - Make sure you paste the ENTIRE JSON, including all the curly braces
   - Click **"Add secret"** button

#### Step 4: Verify Secrets Are Added

1. You should now see both secrets in the list:
   - `GCP_PROJECT_ID`
   - `GCP_SA_KEY`
2. The values are hidden (shown as dots) - this is normal and secure
3. You can edit or delete them later if needed

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

**Important:** The Project ID is different from the Project Name:
- **Project Name**: Human-readable name you can change (e.g., "My MCP Server")
- **Project ID**: Unique identifier that cannot be changed (e.g., `my-mcp-server-123456`)
- **You need the Project ID** (not the name) for the GitHub secret

### Option 1: Find Your Existing Project ID

If you already have a Google Cloud project:

#### Method A: From Project Selector (Easiest)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Look at the top of the page - you'll see a project selector dropdown
4. Click on the project selector (it shows your current project name)
5. A dropdown menu will appear showing all your projects
6. For each project, you'll see:
   - **Project Name** (in bold, larger text)
   - **Project ID** (below the name, in smaller gray text, format: `project-id-123456`)
7. Find your project and note the **Project ID** (the smaller text below the name)
8. Copy this Project ID - this is what you'll use for `GCP_PROJECT_ID` secret

#### Method B: From Project Settings (Most Reliable)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project from the project selector at the top
3. Click the hamburger menu (☰) in the top left
4. Navigate to **IAM & Admin** → **Settings**
5. On the Settings page, you'll see:
   - **Project name**: (your project's display name)
   - **Project ID**: (this is what you need - format: `project-id-123456`)
   - **Project number**: (different from Project ID)
6. Copy the **Project ID** - this is exactly what you need

#### Method C: From URL

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Look at the URL in your browser - it will contain your Project ID:
   ```
   https://console.cloud.google.com/home/dashboard?project=YOUR_PROJECT_ID
   ```
4. The part after `project=` is your Project ID

**Note:** The Project ID format is usually: lowercase letters, numbers, and hyphens (e.g., `my-mcp-server-123456`)

### Option 2: Create a New Project

If you don't have a Google Cloud project yet:

#### Via Google Cloud Console (Web Interface)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the **project selector** dropdown at the top of the page
3. Click **"New Project"** button
4. A form will appear:
   - **Project name**: Enter a name like "Google Maps MCP Server"
     - This is just a display name - you can change it later
   - **Project ID**: Google will auto-generate one based on your project name
     - You can edit this if you want a specific ID
     - Must be globally unique (if your desired ID is taken, add numbers)
     - Format: lowercase letters, numbers, hyphens only
     - Example: `google-maps-mcp-server` or `my-mcp-server-123`
   - **Location**: Select an organization (if applicable) or leave as "No organization"
5. Click **"Create"** button
6. Wait a few seconds for the project to be created
7. **Important:** After creation, note the **Project ID** that was created
   - It will be shown in the notification
   - Or go to **IAM & Admin** → **Settings** to see it
   - This is what you'll use for `GCP_PROJECT_ID` secret

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
2. Select your project from the project selector
3. Check the URL in your browser - it should contain your Project ID:
   ```
   https://console.cloud.google.com/home/dashboard?project=YOUR_PROJECT_ID
   ```
4. Or go to **IAM & Admin** → **Settings** to see the Project ID displayed clearly

**What the Project ID looks like:**
- Format: `lowercase-letters-numbers-123456`
- Usually 6-30 characters
- Contains only lowercase letters, numbers, and hyphens
- Example: `my-mcp-server-123456` or `google-maps-mcp-789`

**Common mistakes to avoid:**
- ❌ Using the Project Name instead of Project ID
- ❌ Using the Project Number (different from Project ID)
- ❌ Including spaces or special characters
- ✅ Use the exact Project ID as shown in Settings

### Using the Project ID in GitHub Secrets

Once you have your Project ID, you'll add it to GitHub Secrets. See [Step 2: Add GCP_PROJECT_ID Secret](#step-2-add-gcpprojectid-secret) above for detailed instructions on how to add it to your repository.

