import type { PriceResult } from '../types'

const APP_ID = process.env.EXPO_PUBLIC_RAKUTEN_APP_ID ?? ''
const AFFILIATE_BASE = process.env.EXPO_PUBLIC_RAKUTEN_AFFILIATE_BASE ?? ''

function toAffiliateUrl(itemUrl: string): string {
  if (!AFFILIATE_BASE) return itemUrl
  return `${AFFILIATE_BASE}?pc=${encodeURIComponent(itemUrl)}&link_type=text`
}

function toSearchUrl(keyword: string): string {
  const searchUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/`
  return AFFILIATE_BASE
    ? `${AFFILIATE_BASE}?pc=${encodeURIComponent(searchUrl)}&link_type=text`
    : searchUrl
}

interface RakutenItem {
  Item: {
    itemName: string
    itemPrice: number
    itemUrl: string
    mediumImageUrls: { imageUrl: string }[]
  }
}

interface RakutenResponse {
  Items?: RakutenItem[]
  error?: string
}

export async function searchRakuten(keyword: string): Promise<{ result: PriceResult; productName: string | null; productImage: string | null }> {
  if (!APP_ID) {
    return {
      result: { platform: 'rakuten', price: null, url: toSearchUrl(keyword), label: 'App IDが未設定' },
      productName: null,
      productImage: null,
    }
  }

  const url = new URL('https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706')
  url.searchParams.set('applicationId', APP_ID)
  url.searchParams.set('keyword', keyword)
  url.searchParams.set('hits', '30')
  url.searchParams.set('sort', '+itemPrice')
  url.searchParams.set('format', 'json')

  const USED_KEYWORDS = ['中古', 'USED', 'used', '訳あり', 'ジャンク', '難あり', '傷あり']

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url.toString(), { signal: controller.signal })
    clearTimeout(timer)
    const data: RakutenResponse = await res.json()

    if (data.Items && data.Items.length > 0) {
      const newItems = data.Items.filter(
        ({ Item }) => !USED_KEYWORDS.some((kw) => Item.itemName.includes(kw))
      )
      if (newItems.length === 0) {
        return { result: { platform: 'rakuten', price: null, url: toSearchUrl(keyword), label: '新品取扱なし' }, productName: null, productImage: null }
      }
      const cheapest = newItems[0].Item
      return {
        result: { platform: 'rakuten', price: cheapest.itemPrice, url: toAffiliateUrl(cheapest.itemUrl) },
        productName: cheapest.itemName,
        productImage: cheapest.mediumImageUrls?.[0]?.imageUrl ?? null,
      }
    }
    return { result: { platform: 'rakuten', price: null, url: toSearchUrl(keyword), label: '取扱なし' }, productName: null, productImage: null }
  } catch {
    return { result: { platform: 'rakuten', price: null, url: toSearchUrl(keyword), label: '取得失敗' }, productName: null, productImage: null }
  }
}
