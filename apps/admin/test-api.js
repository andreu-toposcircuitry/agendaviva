#!/usr/bin/env node

/**
 * Admin API Test Script
 * 
 * This script validates that the admin API endpoints are properly configured
 * and can be accessed. It checks:
 * - Environment variables are set
 * - Health check endpoint is accessible
 * - API endpoints return proper error codes when not authenticated
 * 
 * Usage:
 *   node test-api.js [base-url]
 *   
 * Examples:
 *   node test-api.js http://localhost:5173
 *   node test-api.js https://admin.agendaviva.cat
 */

const baseUrl = process.argv[2] || 'http://localhost:5173';

console.log('🧪 Testing Admin API at:', baseUrl);
console.log('');

let passCount = 0;
let failCount = 0;

function pass(message) {
  console.log('✅', message);
  passCount++;
}

function fail(message) {
  console.error('❌', message);
  failCount++;
}

function info(message) {
  console.log('ℹ️ ', message);
}

async function testHealthEndpoint() {
  console.log('📋 Testing Health Check Endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();
    
    if (response.ok) {
      pass('Health endpoint is accessible');
      
      if (data.checks?.environment) {
        if (data.checks.environment.details.PUBLIC_SUPABASE_URL) {
          pass('PUBLIC_SUPABASE_URL is configured');
        } else {
          fail('PUBLIC_SUPABASE_URL is not configured');
        }
        
        if (data.checks.environment.details.PUBLIC_SUPABASE_ANON_KEY) {
          pass('PUBLIC_SUPABASE_ANON_KEY is configured');
        } else {
          fail('PUBLIC_SUPABASE_ANON_KEY is not configured');
        }
        
        info(`Supabase URL: ${data.checks.environment.details.supabaseUrlValue}`);
      }
      
      if (data.checks?.authentication?.status === 'not_authenticated') {
        pass('Not authenticated (expected for API test)');
      } else if (data.checks?.authentication?.status === 'ok') {
        pass('Authenticated as: ' + data.checks.authentication.user?.email);
      }
    } else {
      fail(`Health endpoint returned ${response.status}`);
    }
  } catch (error) {
    fail(`Failed to connect to health endpoint: ${error.message}`);
  }
  console.log('');
}

async function testActivitiesEndpoint() {
  console.log('📋 Testing Activities Endpoint (unauthenticated)...');
  try {
    const response = await fetch(`${baseUrl}/api/activitats`);
    
    if (response.status === 401) {
      pass('Activities endpoint properly requires authentication (401)');
    } else if (response.status === 403) {
      pass('Activities endpoint returned 403 (authentication works but user not authorized)');
    } else if (response.status === 500) {
      fail('Activities endpoint returned 500 (server error)');
      try {
        const data = await response.json();
        info(`Error message: ${data.message || 'No message'}`);
      } catch (e) {
        // Ignore JSON parse errors
      }
    } else if (response.status === 200) {
      fail('Activities endpoint should require authentication but returned 200');
    } else {
      fail(`Activities endpoint returned unexpected status: ${response.status}`);
    }
  } catch (error) {
    fail(`Failed to connect to activities endpoint: ${error.message}`);
  }
  console.log('');
}

async function testBuildOutput() {
  console.log('📋 Checking Build Output...');
  const fs = require('fs');
  const path = require('path');
  
  const buildPath = path.join(__dirname, '../.svelte-kit/output');
  
  if (fs.existsSync(buildPath)) {
    pass('Build output directory exists');
    
    const serverIndexPath = path.join(buildPath, 'server/index.js');
    if (fs.existsSync(serverIndexPath)) {
      pass('Server build exists');
    } else {
      fail('Server build not found');
    }
    
    const clientPath = path.join(buildPath, 'client');
    if (fs.existsSync(clientPath)) {
      pass('Client build exists');
    } else {
      fail('Client build not found');
    }
  } else {
    info('Build output not found (run `pnpm build` first)');
  }
  console.log('');
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Admin API Test Suite');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  await testHealthEndpoint();
  await testActivitiesEndpoint();
  
  // Only test build output if running locally
  if (baseUrl.includes('localhost')) {
    testBuildOutput();
  }
  
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Results: ${passCount} passed, ${failCount} failed`);
  console.log('═══════════════════════════════════════════════════════');
  
  if (failCount > 0) {
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('');
    console.log('1. Environment Variables:');
    console.log('   - Copy .env.example to .env');
    console.log('   - Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY');
    console.log('');
    console.log('2. Database Setup:');
    console.log('   - Run database migrations: cd supabase && supabase db push');
    console.log('   - Create admin user in admin_users table');
    console.log('');
    console.log('3. For more help:');
    console.log('   - Check docs/ENVIRONMENT_SETUP.md');
    console.log('   - Check DEPLOYMENT_GUIDE.md');
    console.log('');
    
    process.exit(1);
  }
  
  console.log('');
  console.log('✨ All tests passed!');
  console.log('');
}

runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
