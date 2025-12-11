#!/usr/bin/env node

/**
 * Simple test script to verify the MCP server is working
 */

const http = require('http');

const PORT = process.env.PORT || 8080;
const BASE_URL = `http://localhost:${PORT}`;

async function testHealth() {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✓ Health check passed:', json);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', reject);
  });
}

async function testMCP() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      id: 1,
      params: {}
    });

    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✓ MCP endpoint test passed:', json);
          resolve(json);
        } catch (e) {
          console.error('✗ Invalid JSON response:', data);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('Testing MCP Server...\n');

  try {
    await testHealth();
    await testMCP();
    console.log('\n✓ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    process.exit(1);
  }
}

// Wait a bit for server to start if needed
setTimeout(runTests, 2000);

