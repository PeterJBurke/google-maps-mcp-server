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
    
    // Check if the package has startHttpServer method
    if (mcpServer.startHttpServer && typeof mcpServer.startHttpServer === 'function') {
      console.log('Calling startHttpServer...');
      
      // Try calling without arguments first - it might use PORT env var
      const result = mcpServer.startHttpServer();
      
      // If it returns a promise, await it
      if (result && typeof result.then === 'function') {
        console.log('startHttpServer returned a promise, awaiting...');
        await result;
      }
      
      console.log(`Google Maps MCP Server started on port ${PORT}`);
    } else if (mcpServer.listen && typeof mcpServer.listen === 'function') {
      console.log('Calling listen...');
      await mcpServer.listen(parseInt(PORT, 10));
      console.log(`Google Maps MCP Server listening on port ${PORT}`);
    } else if (mcpServer.start && typeof mcpServer.start === 'function') {
      console.log('Calling start...');
      await mcpServer.start();
      console.log(`Google Maps MCP Server started on port ${PORT}`);
    } else {
      console.error('No suitable start method found');
      console.error('Available methods:', Object.keys(mcpServer));
      
      // Last resort: check if the package already started an HTTP server
      // and just keep the process running
      console.log('Keeping process alive to allow auto-started server to run...');
      
      // Keep the process alive
      setInterval(() => {}, 1000 * 60 * 60); // Keep alive for 1 hour intervals
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
