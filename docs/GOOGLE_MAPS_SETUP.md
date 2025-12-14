# Google Maps Grounding Lite MCP Server - Setup Guide

This guide explains how to connect **OpenAI Platform** to Google's **Maps Grounding Lite** MCP server to enable live Google Maps queries.

## Overview

The `mapstools.googleapis.com` MCP server provides live access to Google Maps data, enabling AI to answer questions like "**find the nearest Starbucks**" or "**how long to drive to SFO?**".

### Available Tools
*   `search_places`: Find places by name/type near a location.
*   `lookup_weather`: Get current weather for a location.
*   `compute_routes`: Calculate driving/walking routes.

---

## Part 1: Prerequisites (CRITICAL)

Before verifying authentication, you **MUST** enable the specific API on Google Cloud.

1.  **Access Google Cloud Console**: Go to [APIs & Services Library](https://console.cloud.google.com/apis/library).
2.  **Select Project**: Ensure you are in the correct project (e.g., `gmmcp-481018`).
3.  **Enable "Maps Grounding Lite API"**:
    *   Search for **"Maps Grounding Lite API"**.
    *   Click **Enable**.
    *   *Note: If you receive a "MCP Policy" error later, open the [Cloud Shell](https://ssh.cloud.google.com/cloudshell) and run:*
        ```bash
        gcloud beta services mcp enable mapstools.googleapis.com --project=YOUR_PROJECT_ID
        ```
4.  **Enable Other APIs**:
    *   **Places API (New)**
    *   **Routes API**
    *   **Weather API**

---

## Part 2: Configuration Methods

We recommend **Option 1 (API Key)** as it is the most stable and does not require hourly re-authentication.

### Option 1: API Key (Recommended & Verified) ✅

This method uses a standard Google Cloud API Key. It does not expire.

#### 1. Get API Key
1.  Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials).
2.  Click **Create Credentials** -> **API Key**.
3.  Copy the key (starts with `AIza...`).

#### 2. Configure OpenAI Platform
1.  Go to [OpenAI Platform > Chat](https://platform.openai.com/).
2.  Select **"Add MCP Server"**.
3.  **Server URL**: 
    ```
    https://mapstools.googleapis.com/mcp?key=YOUR_API_KEY
    ```
    *(Replace `YOUR_API_KEY` with the actual key you copied).*
4.  **Authentication**: Select **"None"**.
    *   *(If prompted for a key anyway, just paste the same API Key, but the URL handles the actual access).*

**You are done!** You can now ask: *"Find a Starbucks near me."*

---

### Option 2: OAuth Token (Advanced / Temporary)

Use this method only if you need granular scopes or cannot use API Keys. **Note: OAuth tokens expire every 1 hour.**

1.  **Get Token**: Generate an Access Token via `gcloud auth print-access-token` or OAuth Playground.
2.  **Server URL**:
    ```
    https://mapstools.googleapis.com/mcp?userProject=YOUR_PROJECT_ID
    ```
    *(You must include `?userProject=...` because OAuth tokens often lack project attribution context for this specific API).*
3.  **Authentication**: Select **"Access token / API key"** in OpenAI.
4.  **Token**: Paste your `ya29...` token.

---

## Troubleshooting

### "Reauthentication required"
*   **Cause**: You are likely using Option 2 (OAuth) and the token expired.
*   **Fix**: Switch to **Option 1 (API Key)** to avoid expiration.

### "403 Forbidden" / "MCP Policy"
*   **Cause**: The **Maps Grounding Lite API** is not fully enabled.
*   **Fix**: You must run the `gcloud beta services mcp enable ...` command in the [Cloud Shell](https://ssh.cloud.google.com/cloudshell/editor), as the GUI button sometimes misses the MCP policy flag.

### "404 Not Found"
*   **Cause**: Incorrect URL.
*   **Fix**: Ensure your URL ends in `/mcp` (e.g., `.../mcp?key=...`), NOT `/tools/call` or just `.com`.
