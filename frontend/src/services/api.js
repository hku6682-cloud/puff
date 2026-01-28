import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

const MAX_RETRIES = 3
const RETRY_DELAY = 1000

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Initialize retry count for this request
  if (!config.retryCount) {
    config.retryCount = 0
  }
  return config
})

// Handle responses with retry logic for rate limiting
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config

    // Prevent retry for requests without config
    if (!config) {
      return Promise.reject(error)
    }

    // Handle 401 - Only logout on actual auth errors
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.error?.message || ''
      // Only logout if it's actually an auth error, not a rate limit
      if (!errorMessage.includes('rate') && !errorMessage.includes('Too Many')) {
        // Clear auth and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }

    // Handle 429 (Too Many Requests) with exponential backoff
    if (error.response?.status === 429) {
      if (!config.retryCount) {
        config.retryCount = 0
      }
      
      if (config.retryCount < MAX_RETRIES) {
        config.retryCount++
        // Exponential backoff: 1s, 2s, 4s
        const delay = RETRY_DELAY * Math.pow(2, config.retryCount - 1)
        console.log(`Retrying request (attempt ${config.retryCount}/${MAX_RETRIES}) after ${delay}ms`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Retry the request
        return API(config)
      }
    }

    // For other errors, just reject
    return Promise.reject(error)
  }
)

export default API
