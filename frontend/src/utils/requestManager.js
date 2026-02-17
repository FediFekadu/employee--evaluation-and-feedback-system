/**
 * Global Request Manager
 * Coordinates API requests to prevent rate limiting and improve performance
 */

// Global request queue and cache
const requestQueue = [];
const requestCache = new Map();
const pendingRequests = new Map();
let isProcessing = false;

// Configuration
const CONFIG = {
  maxConcurrentRequests: 3,
  requestDelay: 500,
  cacheTimeout: 300000, // 5 minutes
  retryDelay: 1000,
  maxRetries: 2
};

/**
 * Request priority levels
 */
export const PRIORITY = {
  HIGH: 1,    // Critical user actions
  NORMAL: 2,  // Regular data loading
  LOW: 3      // Background/analytics data
};

/**
 * Create a cache key for a request
 */
function createCacheKey(url, params = {}) {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
  
  return `${url}?${JSON.stringify(sortedParams)}`;
}

/**
 * Check if cached response is still valid
 */
function isCacheValid(cacheEntry) {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CONFIG.cacheTimeout;
}

/**
 * Process the request queue
 */
async function processQueue() {
  if (isProcessing || requestQueue.length === 0) {
    return;
  }

  isProcessing = true;
  const activeBatch = [];

  try {
    // Determine concurrency based on highest-priority item
    requestQueue.sort((a, b) => a.priority - b.priority);
    const highestPriority = requestQueue[0]?.priority ?? PRIORITY.NORMAL;
    const concurrencyLimit = highestPriority === PRIORITY.LOW ? 1 : CONFIG.maxConcurrentRequests;

    while (requestQueue.length > 0 && activeBatch.length < concurrencyLimit) {
      // Sort by priority and take the highest priority request
      requestQueue.sort((a, b) => a.priority - b.priority);
      const request = requestQueue.shift();
      
      activeBatch.push(processRequest(request));
      
      // Add delay between requests to prevent overwhelming the server
      if (requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.requestDelay));
      }
    }

    // Wait for current batch to complete
    await Promise.allSettled(activeBatch);
    
  } finally {
    isProcessing = false;
    
    // Continue processing if there are more requests
    if (requestQueue.length > 0) {
      setTimeout(processQueue, CONFIG.requestDelay);
    }
  }
}

/**
 * Process a single request
 */
async function processRequest(requestItem) {
  const { cacheKey, apiCall, resolve, reject, retryCount = 0 } = requestItem;

  try {
    // Check cache first
    const cached = requestCache.get(cacheKey);
    if (isCacheValid(cached)) {
      console.log(`📦 Using cached response for: ${cacheKey}`);
      resolve(cached.data);
      return;
    }

    // Check if identical request is already pending
    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ Waiting for pending request: ${cacheKey}`);
      const result = await pendingRequests.get(cacheKey);
      resolve(result);
      return;
    }

    // Execute the API call
    const requestPromise = apiCall();
    pendingRequests.set(cacheKey, requestPromise);

    const response = await requestPromise;
    
    // Cache the response
    requestCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    // Clean up pending request
    pendingRequests.delete(cacheKey);
    
    console.log(`✅ Request completed: ${cacheKey}`);
    resolve(response);

  } catch (error) {
    // Clean up pending request
    pendingRequests.delete(cacheKey);
    
    // Handle rate limiting with retry
    if (error.response?.status === 429 && retryCount < CONFIG.maxRetries) {
      const retryAfter = error.response.headers['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : CONFIG.retryDelay * Math.pow(2, retryCount);
      
      console.log(`🔄 Rate limited, retrying in ${delay}ms: ${cacheKey}`);
      
      setTimeout(() => {
        requestQueue.unshift({
          ...requestItem,
          retryCount: retryCount + 1
        });
        processQueue();
      }, delay);
      
      return;
    }

    console.error(`❌ Request failed: ${cacheKey}`, error);
    reject(error);
  }
}

/**
 * Queue a request with priority and caching
 */
export function queueRequest(apiCall, options = {}) {
  const {
    url = 'unknown',
    params = {},
    priority = PRIORITY.NORMAL,
    skipCache = false
  } = options;

  const cacheKey = createCacheKey(url, params);

  return new Promise((resolve, reject) => {
    // Check cache first if not skipping
    if (!skipCache) {
      const cached = requestCache.get(cacheKey);
      if (isCacheValid(cached)) {
        console.log(`📦 Immediate cache hit: ${cacheKey}`);
        resolve(cached.data);
        return;
      }
    }

    // Add to queue
    requestQueue.push({
      cacheKey,
      apiCall,
      resolve,
      reject,
      priority,
      timestamp: Date.now()
    });

    console.log(`📋 Queued request (priority ${priority}): ${cacheKey}`);
    
    // Start processing
    processQueue();
  });
}

/**
 * Clear cache entries older than the timeout
 */
export function clearExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of requestCache.entries()) {
    if (now - entry.timestamp > CONFIG.cacheTimeout) {
      requestCache.delete(key);
    }
  }
}

/**
 * Get queue status for debugging
 */
export function getQueueStatus() {
  return {
    queueLength: requestQueue.length,
    cacheSize: requestCache.size,
    pendingRequests: pendingRequests.size,
    isProcessing
  };
}

/**
 * Clear all cache and pending requests
 */
export function clearAll() {
  requestQueue.length = 0;
  requestCache.clear();
  pendingRequests.clear();
  isProcessing = false;
}

// Periodic cache cleanup
setInterval(clearExpiredCache, 60000); // Every minute
