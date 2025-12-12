# Google Maps Grounding Lite MCP Server - Setup Guide for OpenAI Platform

This guide explains how to connect **OpenAI Platform** to Google's **Maps Grounding Lite** MCP server to enable live Google Maps queries.

## Overview

Google announced (December 10, 2025) fully-managed, remote MCP servers that make **live API calls** to Google Maps Platform. This enables AI to answer real-world location questions like "find the nearest Starbucks."

### Available Tools

The `mapstools.googleapis.com` MCP server provides:

| Tool | Description |
|------|-------------|
| `search_places` | Find places by name/type near a location |
| `lookup_weather` | Get current weather for a location |
| `compute_routes` | Calculate driving/walking routes between points |

### References

- [MCP Reference: mapstools.googleapis.com](https://developers.google.com/maps/ai/grounding-lite/reference/mcp)
- [Google Cloud Blog Announcement](https://cloud.google.com/blog/products/ai-machine-learning/announcing-mcp-support-for-google-services)

---

## Part 1: Enable Google Cloud APIs

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Ensure billing is enabled

### Step 2: Enable Required APIs

Go to [APIs & Services → Library](https://console.cloud.google.com/apis/library) and enable:

| API | Purpose | Required |
|-----|---------|----------|
| **Maps Grounding Lite** | Main MCP API | ✅ Yes |
| **Places API (New)** | Powers `search_places` | ✅ Yes |
| **Routes API** | Powers `compute_routes` | ✅ Yes |
| **Weather API** | Powers `lookup_weather` | ✅ Yes |

To enable each API:
1. Search for the API name
2. Click on it
3. Click **Enable**

---

## Part 2: Generate OAuth Access Token

OpenAI Platform's MCP connector requires an **OAuth Bearer token** (not just an API key).

### Option A: Using Google OAuth Playground (Recommended)

1. Go to: **[https://developers.google.com/oauthplayground/](https://developers.google.com/oauthplayground/)**

2. In the left panel, scroll to the bottom and click **"Input your own scopes"**

3. Enter this scope in the text box:
   ```
   https://www.googleapis.com/auth/cloud-platform
   ```

4. Click **Authorize APIs**

5. Sign in with your Google account (the one with access to your Google Cloud project)

6. Grant the requested permissions

7. Click **Exchange authorization code for tokens**

8. Copy the **Access token** (starts with `ya29.`)

> ⚠️ **Important:** This token expires after **1 hour**. You'll need to regenerate it when it expires.

### Option B: Using gcloud CLI

If you have the Google Cloud SDK installed:

```bash
gcloud auth login
gcloud auth print-access-token
```

Copy the token that's output.

---

## Part 3: Configure OpenAI MCP Connector

### Step 1: Open OpenAI Platform

Go to [OpenAI Platform](https://platform.openai.com) and navigate to where you add MCP connectors.

### Step 2: Add MCP Server

Click **"Add MCP Server"** or **"Connect to MCP Server"**

### Step 3: Enter Configuration

| Field | Value |
|-------|-------|
| **URL** | `https://mapstools.googleapis.com/mcp` |
| **Label** | `GM6` (or your choice) |
| **Description** | `Google Maps Grounding Lite` |
| **Authentication** | `Access token / API key` |
| **Access token** | *(paste your OAuth token from Part 2)* |

### Step 4: Connect

Click the **Connect** button.

---

## Part 4: Test the Integration

### Test `search_places`

```
Using GM6, find the nearest Starbucks to latitude 33.650353, longitude -117.8427504
```

```
Using GM6, find Italian restaurants within 1 km of 37.7749, -122.4194
```

### Test `lookup_weather`

```
Using GM6, what's the current weather in San Francisco?
```

### Test `compute_routes`

```
Using GM6, calculate the driving route from Los Angeles to San Francisco
```

### Combined Example (with Drone MCP)

```
Get the drone's current GPS position from ML26, then use GM6 to find the nearest Starbucks to that location and fly there.
```

---

## Troubleshooting

### "Reauthentication required"

**Cause:** Your OAuth token has expired (tokens last ~1 hour).

**Solution:** Generate a new token using the OAuth Playground (Part 2) and update your MCP connector.

### "Invalid URL"

**Cause:** Missing `/mcp` path.

**Solution:** Make sure URL is exactly: `https://mapstools.googleapis.com/mcp`

### "API not enabled"

**Cause:** Required APIs not enabled in Google Cloud.

**Solution:** Go to [APIs & Services → Library](https://console.cloud.google.com/apis/library) and enable Maps Grounding Lite, Places API (New), Routes API, and Weather API.

### "Permission denied"

**Cause:** Your Google account doesn't have access to the project.

**Solution:** Make sure you're using the same Google account that owns the Cloud project, and that billing is enabled.

---

## Quick Reference

```yaml
# OpenAI MCP Connector Configuration
URL: https://mapstools.googleapis.com/mcp
Label: GM6
Authentication: Access token / API key
Token: ya29.xxxxx... (OAuth access token)

# OAuth Playground
URL: https://developers.google.com/oauthplayground/
Scope: https://www.googleapis.com/auth/cloud-platform

# Required Google Cloud APIs
- Maps Grounding Lite
- Places API (New)
- Routes API
- Weather API
```

---

## Architecture

```
┌─────────────────┐                    ┌──────────────────────────┐
│  OpenAI         │  OAuth Token       │  Google OAuth            │
│  Platform       │◄──────────────────►│  (1-hour expiry)         │
└────────┬────────┘                    └──────────────────────────┘
         │
         │ MCP Protocol + Bearer Token
         ▼
┌─────────────────────────────────────┐
│  Google Maps Grounding Lite         │
│  mapstools.googleapis.com/mcp       │
├─────────────────────────────────────┤
│  Tools:                             │
│  • search_places                    │
│  • lookup_weather                   │
│  • compute_routes                   │
└────────┬────────────────────────────┘
         │
         │ Live API Calls
         ▼
┌─────────────────────────────────────┐
│  Real-World Data                    │
│  • Places (Starbucks, restaurants)  │
│  • Weather (current conditions)     │
│  • Routes (directions, ETA)         │
└─────────────────────────────────────┘
```

---

## Token Expiration Workaround

Since OAuth tokens expire after 1 hour, here are your options:

1. **Manual refresh:** Regenerate token via OAuth Playground when needed
2. **gcloud CLI script:** Run `gcloud auth print-access-token` to get a fresh token
3. **Wait for OpenAI:** OpenAI may add proper OAuth 2.0 flow support in the future, which would handle token refresh automatically

---

## What This Replaces

This setup replaces the documentation-only `@googlemaps/code-assist-mcp` package:

| Feature | `@googlemaps/code-assist-mcp` | Maps Grounding Lite |
|---------|-------------------------------|---------------------|
| Purpose | Documentation & code samples | **Live API queries** |
| Returns | How-to instructions | **Actual data** |
| Hosting | Self-hosted (Cloud Run) | Google-managed |
| Can find Starbucks? | ❌ No | ✅ Yes |

---

*Last updated: December 2025*
