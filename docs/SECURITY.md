# Security Guide

This document explains the security measures and best practices for deploying the Google Maps MCP Server.

## GitHub Secrets Security

### How GitHub Secrets Work

GitHub Secrets are **encrypted and stored separately** from your repository. They are:

- ✅ **Encrypted at rest** - Stored in GitHub's secure vault
- ✅ **Encrypted in transit** - Transmitted securely to GitHub Actions
- ✅ **Never exposed** - Not visible in logs, commits, or pull requests
- ✅ **Access controlled** - Only accessible to authorized GitHub Actions workflows
- ✅ **Safe for public repos** - Can be used safely even in public repositories

### What Gets Stored Where

**In Your Repository (Public):**
- ✅ Source code (server.js, Dockerfile, etc.)
- ✅ Configuration files (package.json, etc.)
- ✅ Documentation
- ❌ **NOT** your secrets or keys

**In GitHub Secrets (Encrypted & Private):**
- ✅ `GCP_PROJECT_ID` - Your Google Cloud project ID
- ✅ `GCP_SA_KEY` - Service account key JSON

### Security Best Practices

1. **Principle of Least Privilege**
   - Create a dedicated service account for GitHub Actions
   - Grant only the minimum required permissions:
     - `roles/run.admin` - Deploy to Cloud Run
     - `roles/iam.serviceAccountUser` - Use service accounts
     - `roles/cloudbuild.builds.editor` - Build images
     - `roles/artifactregistry.writer` - Access Artifact Registry (required for `--source` deployments)

2. **Key Rotation**
   - Rotate service account keys periodically (every 90 days recommended)
   - Create new key → Update GitHub Secret → Delete old key

3. **Monitoring**
   - Review GitHub Actions logs regularly
   - Set up alerts for failed deployments
   - Monitor Cloud Run access logs

4. **Access Control**
   - Limit who can modify GitHub Secrets (repository settings)
   - Use branch protection rules
   - Require pull request reviews

## Service Account Setup

### Creating a Secure Service Account

```bash
# Create dedicated service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account" \
  --description="Service account for GitHub Actions deployment"

# Grant minimal required permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/serviceusage.serviceUsageConsumer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

### Key Rotation Process

1. **Create new key:**
   ```bash
   gcloud iam service-accounts keys create key-new.json \
     --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

2. **Update GitHub Secret:**
   - Go to repository → Settings → Secrets → Actions
   - Update `GCP_SA_KEY` with new key contents

3. **Verify deployment works:**
   - Trigger a deployment
   - Verify it succeeds

4. **Delete old key:**
   ```bash
   # List keys to find the old one
   gcloud iam service-accounts keys list \
     --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
   
   # Delete old key
   gcloud iam service-accounts keys delete KEY_ID \
     --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

## Cloud Run Security

### Default Security Features

- **HTTPS by default** - All traffic encrypted in transit
- **IAM integration** - Can require authentication
- **VPC support** - Can deploy in private networks
- **Audit logging** - All actions logged

### Optional: Require Authentication

If you want to require authentication for your Cloud Run service:

1. **Update GitHub Actions workflow:**
   ```yaml
   # In .github/workflows/deploy.yml
   # Remove: --allow-unauthenticated
   # Add: --no-allow-unauthenticated
   ```

2. **Configure OpenAI Platform:**
   - Generate an access token
   - Use it in OpenAI Platform authentication settings

### Resource Limits

Set appropriate limits to prevent abuse:

```yaml
# In GitHub Actions workflow
--memory 512Mi
--cpu 1
--max-instances 10
--timeout 300
```

## Monitoring and Alerts

### GitHub Actions Monitoring

- Review workflow runs regularly
- Set up notifications for failed deployments
- Monitor for unexpected workflow triggers

### Cloud Run Monitoring

- Set up Cloud Monitoring alerts
- Monitor request rates and errors
- Track resource usage
- Review access logs

## Incident Response

If you suspect a security issue:

1. **Immediately rotate keys:**
   - Create new service account key
   - Update GitHub Secrets
   - Delete compromised key

2. **Review access logs:**
   - Check GitHub Actions logs
   - Review Cloud Run access logs
   - Look for unauthorized access

3. **Revoke access if needed:**
   - Disable service account
   - Remove GitHub Secrets
   - Redeploy with new credentials

## Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Google Cloud IAM Best Practices](https://cloud.google.com/iam/docs/using-iam-securely)
- [Cloud Run Security](https://cloud.google.com/run/docs/securing/service-identity)

