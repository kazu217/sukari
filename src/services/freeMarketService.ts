import type { PriceResult } from '../types'

export function getMercariResult(keyword: string): PriceResult {
  const url = `https://jp.mercari.com/search?keyword=${encodeURIComponent(keyword)}&status=sold_out`
  return {
    platform: 'mercari',
    price: null,
    url,
    label: 'メルカリで相場を見る',
    isMock: true,
  }
}

export function getYahuokuResult(keyword: string): PriceResult {
  const url = `https://auctions.yahoo.co.jp/search/search?p=${encodeURIComponent(keyword)}&istatus=1&s1=end&o1=d`
  return {
    platform: 'yahuoku',
    price: null,
    url,
    label: 'ヤフオクで相場を見る',
    isMock: true,
  }
}
