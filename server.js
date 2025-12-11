#!/usr/bin/env node

/**
 * Google Maps Platform Code Assist MCP Server
 * HTTP Server for OpenAI Platform Integration
 *
 * Uses the @googlemaps/code-assist-mcp package's built-in HTTP server.
 */

import { createServer } from 'http';

const PORT = process.env.PORT || 8080;

console.log('Starting Google Maps MCP Server...');
console.log(`PORT environment variable: ${PORT}`);

async function main() {
  try {
  // Import the MCP server package
    const codeAssistMCP = await import('@googlemaps/code-assist-mcp');
    
    console.log('Package imported successfully');
    console.log('Package exports:', Object.keys(codeAssistMCP));
    
    // Get the default export
    const mcpServer = codeAssistMCP.default;
    
    if (!mcpServer) {
      throw new Error('No default export found in @googlemaps/code-assist-mcp');
    }
    
    console.log('MCP server type:', typeof mcpServer);
    
    if (typeof mcpServer === 'object') {
      console.log('MCP server methods:', Object.keys(mcpServer));
    }
    
  // Prefer startHttpServer with an explicit httpServer to avoid undefined listen
  if (mcpServer.startHttpServer && typeof mcpServer.startHttpServer === 'function') {
    console.log('Calling startHttpServer with explicit httpServer and port...');
    const httpServer = createServer();

    const result = mcpServer.startHttpServer({
      httpServer,
      port: Number(PORT),
      // path: '/mcp', // uncomment if the package supports path option
    });

    if (result && typeof result.then === 'function') {
      console.log('startHttpServer returned a promise, awaiting...');
      await result;
    }

    console.log(`Google Maps MCP Server started on port ${PORT}`);
  } else if (mcpServer.listen && typeof mcpServer.listen === 'function') {
    console.log('Calling listen...');
    await mcpServer.listen(Number(PORT));
    console.log(`Google Maps MCP Server listening on port ${PORT}`);
  } else if (mcpServer.start && typeof mcpServer.start === 'function') {
    console.log('Calling start...');
    await mcpServer.start({ port: Number(PORT) });
    console.log(`Google Maps MCP Server started on port ${PORT}`);
  } else {
    console.error('No suitable start method found');
    console.error('Available methods:', Object.keys(mcpServer));
    // Keep process alive if the package auto-starts
    setInterval(() => {}, 1000 * 60 * 60);
  }
    
    // Keep process running
    console.log('Server is running. Waiting for requests...');
    
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
