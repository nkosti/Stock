export type StockData = {
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

export type ChartData = Array<{ date: string; value: number }>