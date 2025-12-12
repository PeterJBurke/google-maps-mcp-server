# Google Maps Grounding Lite MCP Server - OAuth Setup Guide

This guide explains how to connect OpenAI Platform to Google's **Maps Grounding Lite** MCP server using OAuth 2.0 authentication.

## Overview

Google announced (December 10, 2025) fully-managed, remote MCP servers that make **live API calls** to Google Maps Platform. This replaces the documentation-only `@googlemaps/code-assist-mcp` package with actual live query capabilities.

### What You'll Get

The `mapstools.googleapis.com` MCP server provides these tools:

| Tool | Description |
|------|-------------|
| `search_places` | Find places by name/type near a location (e.g., "nearest Starbucks") |
| `lookup_weather` | Get current weather for a location |
| `compute_routes` | Calculate driving/walking routes between points |

### References

- [MCP Reference: mapstools.googleapis.com](https://developers.google.com/maps/ai/grounding-lite/reference/mcp)
- [Google Cloud Blog Announcement](https://cloud.google.com/blog/products/ai-machine-learning/announcing-mcp-support-for-google-services)
- [LaunchMyBakery Example](https://github.com/google/mcp/tree/main/examples/launchmybakery)

---

## Part 1: Enable Google Cloud APIs

### Step 1: Access Google Maps Platform Console

1. Go to [Google Cloud Console - Maps APIs](https://console.cloud.google.com/google/maps-apis/api-list)
2. Select your project (or create a new one)
3. Ensure billing is enabled for your project

### Step 2: Enable Required APIs

Navigate to the API Library and enable these APIs:

| API | Purpose | Required |
|-----|---------|----------|
| **Maps Grounding Lite** | Main MCP API for `mapstools.googleapis.com` | ✅ Yes |
| **Places API (New)** | Powers `search_places` tool | ✅ Yes |
| **Routes API** | Powers `compute_routes` tool | ✅ Yes |
| **Weather API** | Powers `lookup_weather` tool | ✅ Yes |

To enable each API:
1. Go to **APIs & Services** → **Library**
2. Search for the API name
3. Click on it and press **Enable**

---

## Part 2: Configure OAuth Consent Screen

### Step 3: Access OAuth Configuration

Go directly to: [https://console.cloud.google.com/auth/overview](https://console.cloud.google.com/auth/overview)

Or navigate:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Click hamburger menu (☰) → **APIs & Services** → **OAuth consent screen**

> **Note:** This is in the main Google Cloud Console, NOT the Google Maps Platform section.

### Step 4: Configure Consent Screen

If you see "Google Auth Platform not configured yet", click **Get started**.

Fill in the required fields:

| Field | Value |
|-------|-------|
| **App name** | `OpenAI Maps Integration` |
| **User support email** | Your email address |
| **Developer contact email** | Your email address |
| **User type** | External |

### Step 5: Configure Scopes

When prompted for scopes, add:

```
https://www.googleapis.com/auth/cloud-platform
```

### Step 6: Add Test Users

On the "Test users" page:
1. Click **Add users**
2. Enter your Google account email address
3. Save

> **Important:** While your app is in "Testing" mode, only test users can authorize. For production, you'll need to publish the app.

---

## Part 3: Create OAuth Client Credentials

### Step 7: Create OAuth Client ID

1. Go to **Clients** in the left menu (or [https://console.cloud.google.com/auth/clients](https://console.cloud.google.com/auth/clients))
2. Click **+ Create Client**
3. Select **Web application**

### Step 8: Configure the Client

| Field | Value |
|-------|-------|
| **Name** | `OpenAI MCP Connector` |
| **Authorized redirect URIs** | See below |

Add this **Authorized redirect URI**:

```
https://platform.openai.com/aip/g-callback
```

> **Note:** If using ChatGPT consumer (chatgpt.com) instead of OpenAI Platform, use:
> `https://chatgpt.com/aip/g-callback`

### Step 9: Save Credentials

After creating the client, you'll receive:
- **Client ID**: `xxxxxxxxxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxxxx`

**Save these values securely** - you'll need them for OpenAI configuration.

---

## Part 4: Configure OpenAI MCP Connector

### Step 10: Add MCP Server in OpenAI

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to where you add MCP connectors
3. Click **Add MCP Server** or **Connect to MCP Server**

### Step 11: Enter Server Details

| Field | Value |
|-------|-------|
| **URL** | `https://mapstools.googleapis.com/mcp` |
| **Label** | `GoogleMaps` (or your choice) |
| **Description** | `Google Maps Grounding Lite - Places, Weather, Routes` |
| **Authentication** | OAuth 2.0 |

### Step 12: Enter OAuth Configuration

| OAuth Field | Value |
|-------------|-------|
| **Client ID** | *(paste from Step 9)* |
| **Client Secret** | *(paste from Step 9)* |
| **Authorization URL** | `https://accounts.google.com/o/oauth2/v2/auth` |
| **Token URL** | `https://oauth2.googleapis.com/token` |
| **Scope** | `https://www.googleapis.com/auth/cloud-platform` |

### Step 13: Connect and Authorize

1. Click **Connect**
2. You'll be redirected to Google's sign-in page
3. Sign in with your Google account (must be a test user from Step 6)
4. Review and grant permissions
5. You'll be redirected back to OpenAI

---

## Part 5: Test the Integration

### Example Prompts

Once connected, try these prompts (replace `GoogleMaps` with your label):

**Find nearby places:**
```
Using GoogleMaps, find the nearest Starbucks to latitude 33.650353, longitude -117.8427504
```

**Check weather:**
```
Using GoogleMaps, what's the weather in Los Angeles right now?
```

**Calculate route:**
```
Using GoogleMaps, compute the driving route from San Francisco to Los Angeles
```

**Combined with other tools (e.g., drone):**
```
Get the drone's current GPS location, then use GoogleMaps to find the nearest Starbucks, and fly the drone there.
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **"Invalid URL"** | Make sure URL is exactly `https://mapstools.googleapis.com/mcp` |
| **"Invalid redirect URI"** | Ensure `https://platform.openai.com/aip/g-callback` is in your Google OAuth authorized redirect URIs |
| **"Access denied"** | Make sure your Google account is added as a test user in the OAuth consent screen |
| **"API not enabled"** | Enable Maps Grounding Lite API in Google Cloud Console |
| **"Quota exceeded"** | Check billing is enabled and you have API quota |
| **OAuth consent screen not found** | Go to main Cloud Console (`console.cloud.google.com`), not Maps Platform section |

### Verify API Status

Check that your APIs are enabled:
1. Go to [APIs & Services Dashboard](https://console.cloud.google.com/apis/dashboard)
2. Verify Maps Grounding Lite, Places API (New), Routes API, and Weather API are listed

### Check OAuth Client Configuration

1. Go to [OAuth Clients](https://console.cloud.google.com/auth/clients)
2. Click on your client
3. Verify the redirect URI is correct

---

## OAuth Configuration Summary

For quick reference, here are all the OAuth values:

```yaml
# OpenAI MCP Connector Configuration
URL: https://mapstools.googleapis.com/mcp
Authentication: OAuth 2.0

# Google OAuth Endpoints
Authorization URL: https://accounts.google.com/o/oauth2/v2/auth
Token URL: https://oauth2.googleapis.com/token

# Required Scope
Scope: https://www.googleapis.com/auth/cloud-platform

# Redirect URI (add to Google OAuth Client)
Redirect URI: https://platform.openai.com/aip/g-callback
```

---

## Architecture

```
┌─────────────────┐     OAuth 2.0      ┌──────────────────────────┐
│  OpenAI         │◄──────────────────►│  Google OAuth            │
│  Platform       │                    │  accounts.google.com     │
└────────┬────────┘                    └──────────────────────────┘
         │
         │ MCP Protocol
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
         │ Google Maps Platform APIs
         ▼
┌─────────────────────────────────────┐
│  Live Data                          │
│  • Places (Starbucks, restaurants)  │
│  • Weather (forecasts)              │
│  • Routes (directions, ETA)         │
└─────────────────────────────────────┘
```

---

## Differences from Code Assist MCP

| Feature | `@googlemaps/code-assist-mcp` | Maps Grounding Lite |
|---------|-------------------------------|---------------------|
| Purpose | Documentation & code samples | **Live API queries** |
| Returns | How-to instructions | **Actual data** |
| Hosting | Self-hosted (Cloud Run) | Google-managed |
| Endpoint | Your Cloud Run URL | `mapstools.googleapis.com/mcp` |
| Can find Starbucks? | ❌ No | ✅ Yes |

---

## Next Steps

- Consider publishing your OAuth app for production use (removes test user requirement)
- Monitor API usage in [Google Cloud Console](https://console.cloud.google.com/apis/dashboard)
- Review [Google Maps Platform pricing](https://cloud.google.com/maps-platform/pricing)
- Explore additional MCP servers from Google (BigQuery, GKE, GCE)

---

*Last updated: December 2025*

