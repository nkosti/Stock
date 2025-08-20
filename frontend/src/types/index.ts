// Centralized type definitions for the Stock Valuation app

// =============================================================================
// STOCK DATA TYPES
// =============================================================================

export interface StockData {
  symbol: string
  company_name: string
  sector?: string
  industry?: string
  market_cap?: number
  current_price?: number
  '52_week_high'?: number
  '52_week_low'?: number
  pe_ratio?: number
  forward_pe?: number
  price_to_book?: number
  peg_ratio?: number
  debt_to_equity?: number
  return_on_equity?: number
  revenue_growth?: number
  beta?: number
}

// =============================================================================
// CHART DATA TYPES
// =============================================================================

export interface ChartDataPoint {
  Date: string
  Open?: number
  High?: number
  Low?: number
  Close: number
  Volume: number
}

export type ChartData = ChartDataPoint[]

// Legacy support for simple chart data
export type SimpleChartData = Array<{ date: string; value: number }>

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

export interface EnhancedStockChartProps {
  data: ChartData
  symbol: string
  timeframe?: string
  onTimeframeChange?: (newTimeframe: string) => void
}

export type ChartType = 'line' | 'area' | 'candlestick'

export interface ChartConfig {
  type: ChartType
  timeframe: string
  showVolume: boolean
  showTooltip: boolean
}

export interface ChartInteractionState {
  crosshair: { x: string | number; y: number } | null
  tooltip: any | null
  mousePosition: { x: number; y: number } | null
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  data: T
  status: 'success' | 'error'
  message?: string
}

export interface StockInfoResponse extends StockData {}

export interface StockHistoryResponse {
  symbol: string
  data: ChartData
}

export interface ApiError extends Error {
  status: number
  data?: any
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// =============================================================================
// FORM TYPES
// =============================================================================

export interface SearchFormData {
  symbol: string
}

export interface ContactFormData {
  name: string
  email: string
  message: string
}

// =============================================================================
// STATE MANAGEMENT TYPES
// =============================================================================

export interface AppState {
  currentStock: StockData | null
  chartData: ChartData | null
  loading: boolean
  error: string | null
}

export interface StockDataContextType extends AppState {
  fetchStockData: (symbol: string) => Promise<void>
  updateTimeframe: (timeframe: string) => Promise<void>
  clearError: () => void
}