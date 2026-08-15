import type { PriceResult } from '../types'

const APP_ID = process.env.EXPO_PUBLIC_YAHOO_CLIENT_ID ?? ''

function toSearchUrl(keyword: string): string {
  return `https://shopping.yahoo.co.jp/search?p=${encodeURIComponent(keyword)}`
}

interface YahooHit {
  name: string
  price: number
  url: string
  image?: { small?: string; medium?: string }
}

interface YahooResponse {
  hits?: YahooHit[]
  error?: string
}

type YahooSearchResult = { result: PriceResult; productName: string | null }

const CACHE_TTL_MS = 5 * 60 * 1000
const successCache = new Map<string, { value: YahooSearchResult; expiresAt: number }>()
const inFlight = new Map<string, Promise<YahooSearchResult>>()

function cacheKey(keyword: string): string {
  return keyword.trim().toLowerCase()
}

function getCachedSuccess(key: string): YahooSearchResult | null {
  const cached = successCache.get(key)
  if (!cached) return null
  if (cached.expiresAt <= Date.now()) {
    successCache.delete(key)
    return null
  }
  return cached.value
}

function setCachedSuccess(key: string, value: YahooSearchResult) {
  if (value.result.price === null) return
  successCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

async function fetchYahooShopping(keyword: string, key: string): Promise<YahooSearchResult> {
  if (!APP_ID) {
    return {
      result: { platform: 'yahoo', price: null, url: toSearchUrl(keyword), label: 'App IDが未設定' },
      productName: null,
    }
  }

  const url = new URL('https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch')
  url.searchParams.set('appid', APP_ID)
  url.searchParams.set('query', keyword)
  url.searchParams.set('results', '10')
  url.searchParams.set('sort', '+price')
  url.searchParams.set('condition', 'new')

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url.toString(), { signal: controller.signal }).finally(() => {
      clearTimeout(timer)
    })
    if (!res.ok) {
      return getCachedSuccess(key) ?? {
        result: { platform: 'yahoo', price: null, url: toSearchUrl(keyword), label: '取得失敗' },
        productName: null,
      }
    }
    const data: YahooResponse = await res.json()

    if (data.hits && data.hits.length > 0) {
      const cheapest = data.hits[0]
      const value: YahooSearchResult = {
        result: { platform: 'yahoo', price: cheapest.price, url: cheapest.url },
        productName: cheapest.name,
      }
      setCachedSuccess(key, value)
      return value
    }
    return getCachedSuccess(key) ?? {
      result: { platform: 'yahoo', price: null, url: toSearchUrl(keyword), label: '取扱なし' },
      productName: null,
    }
  } catch {
    return getCachedSuccess(key) ?? {
      result: { platform: 'yahoo', price: null, url: toSearchUrl(keyword), label: '取得失敗' },
      productName: null,
    }
  }
}

export async function searchYahooShopping(keyword: string): Promise<YahooSearchResult> {
  const key = cacheKey(keyword)
  const cached = getCachedSuccess(key)
  if (cached) return cached

  const pending = inFlight.get(key)
  if (pending) return pending

  const request = fetchYahooShopping(keyword, key).finally(() => {
    inFlight.delete(key)
  })
  inFlight.set(key, request)
  return request
}
