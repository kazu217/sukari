import type { SearchResult } from '../types'
import type { KakakuResult } from './kakakuScraper'
import { searchRakuten } from './rakutenApi'
import { searchYahooShopping } from './yahooShoppingApi'
import { searchKakaku } from './kakakuScraper'
import { getAmazonResult } from './amazonService'
import { getMercariResult, getYahuokuResult } from './freeMarketService'

export type { KakakuResult }

export interface FullSearchResult extends SearchResult {
  kakaku: KakakuResult | null
  kakakuLoading: boolean
}

export async function searchPrices(
  query: string,
  queryType: 'barcode' | 'text',
  onKakakuResult?: (result: KakakuResult) => void
): Promise<FullSearchResult> {
  // 楽天・Yahoo は並列で即時取得
  const [
    { result: rakutenResult0, productName: rakutenName0, productImage: rakutenImage0 },
    { result: yahooResult, productName: yahooName },
  ] = await Promise.all([
    searchRakuten(query),
    searchYahooShopping(query),
  ])

  // 片方がヒットしなかった場合、もう片方の商品名で再検索
  let rakutenResult = rakutenResult0
  let rakutenName = rakutenName0
  let productImage = rakutenImage0
  let yahooResult2 = yahooResult
  let yahooName2 = yahooName

  if (rakutenResult0.price === null && yahooName) {
    const retry = await searchRakuten(yahooName + ' 新品')
    if (retry.result.price !== null) {
      rakutenResult = retry.result
      rakutenName = retry.productName
      productImage = retry.productImage ?? rakutenImage0
    }
  }

  if (yahooResult.price === null && rakutenName0) {
    const retry = await searchYahooShopping(rakutenName0 + ' 新品')
    if (retry.result.price !== null) {
      yahooResult2 = retry.result
      yahooName2 = retry.productName
    }
  }

  const productName = rakutenName ?? yahooName2
  const amazonResult = getAmazonResult(query)
  const mercariResult = getMercariResult(query)
  const yahuokuResult = getYahuokuResult(query)

  // 追加の店舗価格は非同期で後から届く（重いため）
  if (onKakakuResult) {
    searchKakaku(query)
      .then(onKakakuResult)
      .catch(() => onKakakuResult({ productName: null, productUrl: null, stores: [] }))
  }

  return {
    query,
    queryType,
    productName,
    productImage,
    prices: [rakutenResult, yahooResult2, amazonResult, mercariResult, yahuokuResult],
    searchedAt: new Date(),
    kakaku: null,
    kakakuLoading: !!onKakakuResult,
  }
}

export function calcProfit(purchasePrice: number, sellPrice: number) {
  const profit = sellPrice - purchasePrice
  const profitRate = (profit / purchasePrice) * 100
  const verdict = profitRate >= 20 ? 'buy' : profitRate >= 10 ? 'maybe' : 'skip'
  return { purchasePrice, sellPrice, profit, profitRate, verdict } as const
}
