// Simple request cache to prevent duplicate API calls
const cache = new Map()
const pendingRequests = new Map()

export const getCachedRequest = (key) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data
  }
  cache.delete(key)
  return null
}

export const setCachedRequest = (key, data, ttl = 60000) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

export const clearCache = (key) => {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

// Deduplication for in-flight requests
export const deduplicateRequest = async (key, requestFn) => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)
  }

  const promise = requestFn()
    .then(result => {
      pendingRequests.delete(key)
      return result
    })
    .catch(error => {
      pendingRequests.delete(key)
      throw error
    })

  pendingRequests.set(key, promise)
  return promise
}

export default {
  getCachedRequest,
  setCachedRequest,
  clearCache,
  deduplicateRequest
}
