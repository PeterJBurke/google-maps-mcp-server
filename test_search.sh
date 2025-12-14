#!/bin/bash
# Get OAuth token dynamically using gcloud
# Alternatively, you can paste your OAuth token from OAuth Playground Step 2
# TRY THESE SCOPES ONE AT A TIME in OAuth Playground:
# 1. https://www.googleapis.com/auth/cloud-platform
# 2. https://www.googleapis.com/auth/mapstools
# 3. https://www.googleapis.com/auth/maps-platform.places
# 4. https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/cloud-platform

TOKEN=$(gcloud auth print-access-token)

curl -s -X POST "https://mapstools.googleapis.com/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Goog-User-Project: gmmcp-481018" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search_places",
      "arguments": {
        "textQuery": "Starbucks near Irvine, California"
      }
    },
    "id": 1
  }' | python3 -m json.tool
