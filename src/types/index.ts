export type Platform = 'amazon' | 'rakuten' | 'yahoo' | 'mercari' | 'yahuoku'
export type QueryType = 'barcode' | 'text'

export interface PriceResult {
  platform: Platform
  price: number | null
  url: string | null
  label?: string
  isMock?: boolean
}

export interface SearchResult {
  query: string
  queryType: QueryType
  productName: string | null
  productImage: string | null
  prices: PriceResult[]
  searchedAt: Date
}

export interface HistoryItem {
  id: string
  query: string
  queryType: QueryType
  productName: string | null
  productImage: string | null
  lowestPrice: number | null
  purchasePrice: number | null
  searchedAt: Date
}

export interface ProfitCalc {
  purchasePrice: number
  sellPrice: number
  profit: number
  profitRate: number
  verdict: 'buy' | 'maybe' | 'skip'
}
