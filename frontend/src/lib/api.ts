import type { 
  StockData, 
  ChartData, 
  StockInfoResponse, 
  StockHistoryResponse, 
  ApiError 
} from '@/types'

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Custom API Error class
export class ApiErrorClass extends Error implements ApiError {
  status: number
  data?: any

  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Enhanced API client
export class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit & { timeout?: number } = {}
  ): Promise<T> {
    const { timeout = 10000, ...fetchOptions } = options

    // Add timeout support
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorMessage = 'Something went wrong'
        let errorData: any = null

        try {
          errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch {
          // If response is not JSON, use default error message
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }

        throw new ApiErrorClass(errorMessage, response.status, errorData)
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof ApiErrorClass) {
        throw error
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiErrorClass('Request timeout', 408)
        }
        throw new ApiErrorClass(error.message, 0)
      }
      
      throw new ApiErrorClass('Unknown error occurred', 0)
    }
  }

  // Stock-specific API methods
  stocks = {
    getInfo: (symbol: string): Promise<StockInfoResponse> => 
      this.request<StockInfoResponse>(`/api/stocks/${symbol}/info`),
    
    getHistory: (symbol: string, period: string): Promise<StockHistoryResponse> => 
      this.request<StockHistoryResponse>(`/api/stocks/${symbol}/history?period=${period}`),
  }
}

// Default API client instance
export const apiClient = new ApiClient()

// Legacy function for backward compatibility
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return apiClient.request<T>(endpoint, options)
}