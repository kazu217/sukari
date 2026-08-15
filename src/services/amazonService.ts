import type { PriceResult } from '../types'

// PA-API申請後にこのファイルを実装に置き換える
const ASSOCIATE_TAG = process.env.EXPO_PUBLIC_AMAZON_ASSOCIATE_TAG ?? ''

export function getAmazonSearchUrl(keyword: string): string {
  const base = 'https://www.amazon.co.jp/s'
  const params = new URLSearchParams({ k: keyword })
  if (ASSOCIATE_TAG) params.set('tag', ASSOCIATE_TAG)
  return `${base}?${params.toString()}`
}

export function getAmazonResult(keyword: string): PriceResult {
  return {
    platform: 'amazon',
    price: null,
    url: getAmazonSearchUrl(keyword),
    label: 'Amazonで検索する',
    isMock: true,
  }
}
