#!/usr/bin/env node

/**
 * Google Maps Platform Code Assist MCP Server
 * HTTP Server for OpenAI Platform Integration
 * 
 * The @googlemaps/code-assist-mcp package auto-starts its own HTTP server
 * when imported. We just need to import it and keep the process alive.
 */

const PORT = process.env.PORT || 8080;

console.log('Starting Google Maps MCP Server...');
console.log(`PORT environment variable: ${PORT}`);

async function main() {
  try {
    // Import the MCP server package
    // The package auto-starts both stdio and HTTP servers when imported
    const codeAssistMCP = await import('@googlemaps/code-assist-mcp');
    
    console.log('Package imported successfully');
    console.log('Package exports:', Object.keys(codeAssistMCP));
    
    // Get the default export
    const mcpServer = codeAssistMCP.default;
    
    if (mcpServer) {
      console.log('MCP server type:', typeof mcpServer);
      
      if (typeof mcpServer === 'object') {
        console.log('MCP server methods:', Object.keys(mcpServer));
      }
      
      // Check if there's a getServer method to get the running server
      if (mcpServer.getServer && typeof mcpServer.getServer === 'function') {
        const server = mcpServer.getServer();
        console.log('Got server instance:', server ? 'yes' : 'no');
      }
    }
    
    // The package auto-starts its HTTP server on the PORT environment variable
    // We just need to keep the process alive
    console.log(`Google Maps MCP Server should be running on port ${PORT}`);
    console.log('Server is ready. Waiting for requests...');
    
    // Keep the process alive
    // The package's internal HTTP server handles the requests
    setInterval(() => {
      // Keep alive - the package handles everything
    }, 1000 * 60 * 60); // 1 hour interval
    
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
