#!/usr/bin/env node

/**
 * Google Maps Platform Code Assist MCP Server
 * HTTP Server for OpenAI Platform Integration
 * 
 * This script uses the @googlemaps/code-assist-mcp package's built-in
 * HTTP server functionality.
 */

const PORT = process.env.PORT || 8080;

console.log('Starting Google Maps MCP Server...');
console.log(`Target port: ${PORT}`);

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
  console.log('MCP server methods:', Object.keys(mcpServer));
  
  // Check if the package has startHttpServer method
  if (mcpServer.startHttpServer && typeof mcpServer.startHttpServer === 'function') {
    console.log('Using package built-in startHttpServer method');
    
    // Start the HTTP server using the package's method
    // Pass the port from environment variable
    await mcpServer.startHttpServer({ port: parseInt(PORT, 10) });
    
    console.log(`Google Maps MCP Server started successfully on port ${PORT}`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  } else {
    // Fallback: If no startHttpServer, list available methods
    console.error('startHttpServer method not found');
    console.error('Available methods:', Object.keys(mcpServer));
    
    // Try other common patterns
    if (mcpServer.listen) {
      console.log('Trying mcpServer.listen...');
      await mcpServer.listen(parseInt(PORT, 10));
    } else if (mcpServer.start) {
      console.log('Trying mcpServer.start...');
      await mcpServer.start({ port: parseInt(PORT, 10) });
    } else if (mcpServer.run) {
      console.log('Trying mcpServer.run...');
      await mcpServer.run({ port: parseInt(PORT, 10) });
    } else {
      throw new Error('No suitable server start method found. Available: ' + Object.keys(mcpServer).join(', '));
    }
  }
} catch (error) {
  console.error('Failed to start MCP server:', error);
  console.error('Error details:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
