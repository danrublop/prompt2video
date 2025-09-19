export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === maxAttempts) {
        throw lastError
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
      console.log(`Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

export function isRetryableError(error: any): boolean {
  if (!error) return false
  
  const message = error.message?.toLowerCase() || ''
  const status = error.status || error.statusCode || 0
  
  // Network errors
  if (message.includes('network') || message.includes('timeout') || message.includes('econnreset')) {
    return true
  }
  
  // HTTP status codes that are retryable
  if (status >= 500 || status === 429 || status === 408) {
    return true
  }
  
  // Specific API errors
  if (message.includes('rate limit') || message.includes('quota exceeded')) {
    return true
  }
  
  return false
}
