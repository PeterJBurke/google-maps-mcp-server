#!/usr/bin/env node

/**
 * Google Maps Platform Code Assist MCP Server
 * HTTP Server Wrapper for OpenAI Platform Integration
 */

import { createServer } from 'http';
import { URL } from 'url';

// Import the MCP server package
// Note: The actual import may vary based on the package structure
// The @googlemaps/code-assist-mcp package may export the server differently
// Adjust this import based on the actual package API when available
let mcpServer;
let mcpHandler;

try {
  // Try to import the MCP server
  // The package may export:
  // - A default export with the server
  // - Named exports like { createServer, Server }
  // - A function to create the server
  const codeAssistMCP = await import('@googlemaps/code-assist-mcp');
  
  console.log('Package imported successfully');
  console.log('Package exports:', Object.keys(codeAssistMCP));
  
  // Try different common export patterns
  if (codeAssistMCP.default) {
    mcpServer = codeAssistMCP.default;
    console.log('Using default export');
  } else if (codeAssistMCP.createServer) {
    mcpServer = codeAssistMCP.createServer();
    console.log('Using createServer function');
  } else if (codeAssistMCP.Server) {
    mcpServer = new codeAssistMCP.Server();
    console.log('Using Server class');
  } else {
    mcpServer = codeAssistMCP;
    console.log('Using entire package as server');
  }
  
  // Get handler function if available
  mcpHandler = mcpServer.handle || mcpServer.process || mcpServer;
  
  console.log('MCP server package loaded successfully');
  console.log('MCP server type:', typeof mcpServer);
  console.log('MCP handler type:', typeof mcpHandler);
  console.log('MCP server methods:', Object.keys(mcpServer || {}));
} catch (error) {
  console.error('Failed to import @googlemaps/code-assist-mcp:', error);
  console.error('Error details:', error.message);
  console.error('Stack:', error.stack);
  console.error('Please ensure the package is installed: npm install @googlemaps/code-assist-mcp');
  process.exit(1);
}

const PORT = process.env.PORT || 8080;

/**
 * Handle MCP protocol requests
 */
async function handleMCPRequest(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    // Read request body
    let body = '';
    for await (const chunk of req) {
      body += chunk.toString();
    }

    console.log('Received request body:', body.substring(0, 500));

    if (!body) {
      console.warn('Empty request body received');
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Empty request body' }));
      return;
    }

    // Parse JSON request
    let request;
    try {
      request = JSON.parse(body);
      console.log('Parsed request:', JSON.stringify(request).substring(0, 500));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON', message: parseError.message }));
      return;
    }

    // Handle MCP protocol request
    // The MCP server should handle the request and return a response
    // This is a simplified handler - actual implementation may vary
    const response = await handleMCPProtocol(request);
    
    console.log('Sending response:', JSON.stringify(response).substring(0, 500));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  } catch (error) {
    console.error('Error handling MCP request:', error);
    console.error('Error stack:', error.stack);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    }));
  }
}

/**
 * Handle MCP protocol messages
 * This function routes MCP protocol requests to the appropriate handler
 */
async function handleMCPProtocol(request) {
  // MCP uses JSON-RPC 2.0 protocol
  const { jsonrpc, method, id, params } = request;

  if (jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      id: id || null,
      error: {
        code: -32600,
        message: 'Invalid Request'
      }
    };
  }

  try {
    console.log(`Handling MCP method: ${method}, id: ${id}`);
    
    // Route to MCP server handler
    // Try different handler patterns based on common MCP server implementations
    let result;
    
    if (typeof mcpHandler === 'function') {
      // If handler is a function, call it with the request
      console.log('Calling mcpHandler as function');
      result = await mcpHandler(request);
    } else if (mcpServer && mcpServer.handleRequest) {
      // If server has handleRequest method
      console.log('Calling mcpServer.handleRequest');
      result = await mcpServer.handleRequest(method, params);
    } else if (mcpServer && mcpServer.process) {
      // If server has process method
      console.log('Calling mcpServer.process');
      result = await mcpServer.process(request);
    } else if (mcpServer && typeof mcpServer === 'object') {
      // Fallback: try to call with method name
      if (mcpServer[method] && typeof mcpServer[method] === 'function') {
        console.log(`Calling mcpServer.${method}`);
        result = await mcpServer[method](params);
      } else {
        console.error(`Method ${method} not found on mcpServer`);
        console.error('Available methods:', Object.keys(mcpServer));
        throw new Error(`Method ${method} not found. Available: ${Object.keys(mcpServer).join(', ')}`);
      }
    } else {
      console.error('mcpServer is not usable:', typeof mcpServer, mcpServer);
      throw new Error('MCP server not properly initialized');
    }

    console.log('MCP handler result:', JSON.stringify(result).substring(0, 200));

    // If result is already a JSON-RPC response, return it
    if (result && result.jsonrpc) {
      return result;
    }

    // Otherwise, wrap in JSON-RPC response
    return {
      jsonrpc: '2.0',
      id: id || null,
      result: result
    };
  } catch (error) {
    console.error('MCP handler error:', error);
    console.error('Error stack:', error.stack);
    return {
      jsonrpc: '2.0',
      id: id || null,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      }
    };
  }
}

/**
 * Health check endpoint
 */
function handleHealthCheck(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'healthy',
    service: 'google-maps-mcp-server',
    timestamp: new Date().toISOString()
  }));
}

/**
 * Create HTTP server
 */
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Route requests
  if (url.pathname === '/mcp') {
    handleMCPRequest(req, res);
  } else if (url.pathname === '/health' || url.pathname === '/') {
    handleHealthCheck(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Google Maps MCP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

