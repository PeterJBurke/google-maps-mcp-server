#!/bin/bash
TOKEN=$(gcloud auth print-access-token)
curl -s -X POST "https://mapstools.googleapis.com/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
