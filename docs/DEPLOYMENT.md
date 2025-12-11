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
   - **Automatic**: Push code to `main` or `master` branch → automatically deploys
   - **Manual trigger** (if you want to deploy without pushing code):
     - Go to repository → Click **"Actions"** tab (at the top, next to "Pull requests")
     - In the left sidebar, click **"Deploy to Cloud Run"**
     - Click the **"Run workflow"** button (dropdown on the right)
     - Select branch (`master` or `main`) → Click **"Run workflow"**

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

### ⚠️ Step 0: Enable Required APIs (CRITICAL - Must Do This First!)

**⚠️ IMPORTANT: You MUST enable these APIs BEFORE creating the service account or the deployment will fail!**

**Before creating the service account, you must enable the required Google Cloud APIs:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure your project is selected (check the project selector at the top)
3. Click the hamburger menu (☰) in the top left
4. Navigate to **APIs & Services** → **Library**
5. You need to enable these three APIs. Search for and enable each one:

   **Enable Cloud Run API:**
   - In the search bar, type: `Cloud Run API`
   - Click on **"Cloud Run API"** from the results
   - Click the blue **"Enable"** button
   - Wait for it to enable (you'll see a checkmark when done)

   **Enable Cloud Build API (REQUIRED for source deployments):**
   - Go back to **APIs & Services** → **Library**
   - Search for: `Cloud Build API`
   - Click on **"Cloud Build API"**
   - Click the blue **"Enable"** button
   - Wait for it to enable
   - **Note:** This API is critical - without it, you'll get: `PERMISSION_DENIED: Cloud Build API has not been used in project`

   **Enable Artifact Registry API:**
   - Go back to **APIs & Services** → **Library**
   - Search for: `Artifact Registry API`
   - Click on **"Artifact Registry API"**
   - Click the blue **"Enable"** button
   - Wait for it to enable

**Alternative: Enable all at once via direct links:**
- [Enable Cloud Run API](https://console.cloud.google.com/apis/library/run.googleapis.com)
- [Enable Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com)
- [Enable Artifact Registry API](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com)

**⚠️ CRITICAL: Wait 2-3 minutes after enabling APIs before proceeding to the next step.** The APIs need time to propagate to all Google Cloud systems. If you proceed too quickly, you may still get "API not enabled" errors.

**How to verify APIs are enabled:**
1. Go to **APIs & Services** → **Enabled APIs**
2. You should see all three APIs listed:
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API
3. If any are missing, go back and enable them

### Using Google Cloud Console (No Local Tools Required)

#### 1. Create a Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure your project is selected (check the project selector at the top - it should show your project name)
3. In the left navigation sidebar, find **"IAM & Admin"** section
4. Click on **"Service Accounts"** (it's in the IAM & Admin section)
5. You'll see the Service Accounts page with a table
6. At the top of the page, click the blue **"+ Create service account"** button
7. A form will appear with **"Service account details"**:
   - In the **"Service account name"** field, type: `github-actions`
   - The **"Service account ID"** field will auto-fill with `github-actions` (leave it as is)
   - In the **"Description"** field (optional), type: `Service account for GitHub Actions deployment`
   - Click the blue **"Create and Continue"** button at the bottom

8. You may see a step about granting access - you can skip this for now:
   - If you see **"Grant this service account access to project"** - click **"Continue"** or **"Skip"**
   - If you see **"Grant users access to this service account"** - click **"Done"** or **"Skip"**

9. You should now see a success message saying **"Service account created"** (a black notification in the bottom right)
10. You'll be back at the Service Accounts list page

#### 2. Grant Necessary Permissions

**Important:** The service account needs these permissions because:
- It will be used by GitHub Actions to deploy to Cloud Run
- It will also be used by Cloud Build (via `--build-service-account`) to build your Docker image
- Cloud Build needs to create Artifact Registry repositories and push images
- Cloud Build needs to create temporary Cloud Storage buckets to stage source code

Now you need to add roles to the service account you just created:

1. On the Service Accounts list page, find the service account named **"github-actions"** in the table
2. Click on the service account name (the email address: `github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com`)
3. You'll see the service account details page with several tabs at the top: **Details**, **Permissions**, **Keys**, **Metrics**, **Logs**, **Principals with access**
4. Click on the **"Permissions"** tab
5. You'll see a section titled **"Manage service account permissions"** with text explaining you can edit roles
6. Click the blue **"Manage access"** button
7. A dialog box will appear on the right side titled **"Edit access to 'YOUR_PROJECT_NAME'"**
8. In this dialog, you'll see:
   - **Principal** field showing: `github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com`
   - **"Assign roles"** section with text about roles
   - A blue button labeled **"+ Add role"**

9. Click the **"+ Add role"** button
10. A dropdown menu will appear - start typing: `Cloud Run Admin`
11. Select **"Cloud Run Admin"** from the dropdown (it should show `roles/run.admin` in smaller text)
12. The role will be added to the list. Click **"+ Add role"** again
13. Type: `Service Account User` and select **"Service Account User"** (shows `roles/iam.serviceAccountUser`)
14. Click **"+ Add role"** again
15. Type: `Cloud Build Editor` and select **"Cloud Build Editor"** (shows `roles/cloudbuild.builds.editor`)
16. Click **"+ Add role"** one more time
17. Type: `Artifact Registry Administrator` and select **"Artifact Registry Administrator"** (shows `roles/artifactregistry.admin`)
    - **Important:** This role is required to CREATE repositories (not just write to them)
    - The "Artifact Registry Writer" role is NOT sufficient - it cannot create repositories
    - This role gives full admin access to Artifact Registry, including creating repositories
18. Click **"+ Add role"** one more time
19. Type: `Storage Admin` and select **"Storage Admin"** (shows `roles/storage.admin`)
    - **Important:** This role is required for Cloud Build to create temporary buckets
    - When using `--source`, Cloud Build needs to create a Cloud Storage bucket to stage source code
    - Without this, you'll get: `storage.buckets.create access denied`
20. You should now see all **five** roles listed in the dialog:
    - Cloud Run Admin
    - Service Account User
    - Cloud Build Editor
    - Artifact Registry Administrator
    - Storage Admin
21. Click the blue **"Save"** button at the bottom of the dialog
22. The dialog will close and you'll see a success notification

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

**Automatic Deployment:**
- Simply push code to the `main` or `master` branch
- GitHub Actions will automatically detect the push and start the deployment
- Go to the **Actions** tab to watch the deployment progress

**Monitoring Deployment:**

1. Go to repository → Click **"Actions"** tab (at the top)
2. You'll see a list of workflow runs
3. Click on the latest run to see progress:
   - **Yellow circle** = In progress
   - **Green checkmark** = Success
   - **Red X** = Failed (see [Troubleshooting](../docs/TROUBLESHOOTING.md#github-actions-workflow-fails) for help)
4. Click on the **"deploy"** job to see detailed logs for each step
5. Once complete, the workflow will show your service URL in the output

**Manual Deployment (Trigger Manually):**

If you want to trigger a deployment without pushing code:

1. Go to your repository: https://github.com/PeterJBurke/google-maps-mcp-server
2. **Important:** Look at the TOP of the repository page (not in Settings)
   - You'll see tabs: **Code**, **Issues**, **Pull requests**, **Actions**, **Projects**, **Wiki**, **Security**, **Insights**, **Settings**
   - Click on the **"Actions"** tab (this is different from Settings → Actions)
3. You'll now be on the Actions page showing workflow runs
4. In the **left sidebar**, you'll see a list of workflows
   - Look for **"Deploy to Cloud Run"** and click on it
5. On the right side of the page, you'll see a button that says **"Run workflow"** (it's a dropdown button with a small arrow)
6. Click the **"Run workflow"** button
7. A dropdown panel will appear on the right side with options:
   - **"Use workflow from"** dropdown - make sure it shows `Branch: master` (or `Branch: main` if your default branch is main)
   - A green **"Run workflow"** button at the bottom of the panel
8. Click the green **"Run workflow"** button in the panel
9. The panel will close and you'll see a new workflow run appear in the list
10. Click on the new workflow run (it will show as "queued" or "in progress") to watch the deployment progress in real-time

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

