/**
 * Test script to verify rate limiting is working correctly
 * Run this in the browser console to test the rate limiting system
 */

import { queueRequest, PRIORITY, getQueueStatus } from './requestManager';
import api from '../services/api';

export async function testRateLimiting() {
  console.log('🧪 Starting rate limiting test...');
  
  const departmentId = 101; // Use a valid department ID
  const testRequests = [];
  
  // Create 10 simultaneous requests
  for (let i = 1; i <= 10; i++) {
    const request = queueRequest(
      () => api.get(`/departments/${departmentId}/visual-analytics`, {
        params: {
          chart_types: ['performance_distribution'],
          time_range: '1year'
        }
      }),
      {
        url: `/departments/${departmentId}/visual-analytics`,
        params: { test: i },
        priority: PRIORITY.LOW
      }
    );
    
    testRequests.push(request.then(
      (result) => ({ success: true, request: i, result }),
      (error) => ({ success: false, request: i, error: error.response?.status || error.message })
    ));
  }
  
  console.log('📋 Queue status:', getQueueStatus());
  
  // Wait for all requests to complete
  const results = await Promise.allSettled(testRequests);
  
  console.log('📊 Test Results:');
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const { success, request, error } = result.value;
      if (success) {
        console.log(`✅ Request ${request}: SUCCESS`);
      } else {
        console.log(`❌ Request ${request}: FAILED (${error})`);
      }
    } else {
      console.log(`💥 Request ${index + 1}: REJECTED (${result.reason})`);
    }
  });
  
  console.log('📋 Final queue status:', getQueueStatus());
  
  const successCount = results.filter(r => 
    r.status === 'fulfilled' && r.value.success
  ).length;
  
  const rateLimitedCount = results.filter(r => 
    r.status === 'fulfilled' && !r.value.success && r.value.error === 429
  ).length;
  
  console.log(`\n📈 Summary:`);
  console.log(`✅ Successful requests: ${successCount}`);
  console.log(`🚫 Rate limited requests: ${rateLimitedCount}`);
  console.log(`❌ Other errors: ${results.length - successCount - rateLimitedCount}`);
  
  if (rateLimitedCount === 0 && successCount > 0) {
    console.log('🎉 Rate limiting system is working! Requests were queued and processed smoothly.');
  } else if (rateLimitedCount > 0) {
    console.log('⚠️ Some requests were rate limited, but the system handled them gracefully.');
  } else {
    console.log('❌ All requests failed. There may be an issue with the system.');
  }
}

// Export for use in browser console
window.testRateLimiting = testRateLimiting;