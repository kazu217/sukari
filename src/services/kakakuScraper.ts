const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const PRICE_SITE_HOST = ['kakaku', 'com'].join('.')
const MOBILE_PRICE_SITE_HOST = `s.${PRICE_SITE_HOST}`
const SEARCH_PRICE_SITE_HOST = `search.${PRICE_SITE_HOST}`

export interface StorePrice {
  storeName: string
  price: number
  url: string
}

export interface KakakuResult {
  productName: string | null
  productUrl: string | null
  stores: StorePrice[]
}

// shopicon/{slug} → 店舗名（詳細ページ用）
const SHOPICON: Record<string, string> = {
  amazon: 'Amazon',
  rakuten: '楽天市場',
  yahoo: 'Yahoo!ショッピング',
  biccamera: 'ビックカメラ',
  yodobashi: 'ヨドバシ.com',
  edion: 'エディオン',
  joshin: 'Joshin',
  kojima: 'コジマネット',
  softmap: 'ソフマップ',
  nojima: 'ノジマオンライン',
  yamada: 'ヤマダウェブコム',
  '1865': 'ヤマダウェブコム',
  '1639': 'ノジマオンライン',
  '1747': 'エディオン',
  '1877': 'Joshin',
  '2220': 'ヨドバシ.com',
  '1925': 'コジマネット',
}

// icon_mall/{id} → モール名（バーコード検索ページ用）
const MALL_ICON: Record<string, string> = {
  '1': '楽天市場',
  '2': 'Yahoo!ショッピング',
  '6': 'Amazon',
}

// Shift_JIS ページを Latin-1 デコード（ASCII/数字/記号は完全保持）
async function fetchLatin1(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja-JP,ja;q=0.9',
      },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = await res.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    // ループでバイトごとに変換（spread より安全）
    let html = ''
    for (let i = 0; i < bytes.length; i++) {
      html += String.fromCharCode(bytes[i])
    }
    return html
  } finally {
    clearTimeout(timer)
  }
}

// Latin-1 デコード済み Shift_JIS から ASCII 文字のみ抽出
function asciiOnly(raw: string): string {
  let out = ''
  let i = 0
  while (i < raw.length) {
    const c = raw.charCodeAt(i)
    if ((c >= 0x81 && c <= 0x9f) || (c >= 0xe0 && c <= 0xfc)) {
      i += 2 // 2バイト文字
    } else if (c >= 0xa1 && c <= 0xdf) {
      i += 1 // 半角カタカナ
    } else if (c >= 0x20 && c < 0x80) {
      out += raw[i]
      i += 1
    } else {
      i += 1
    }
  }
  return out
}

// ============================================================
// ルート1: テキスト検索 → K番号 → 詳細ページ
// ============================================================

function findItemUrl(html: string): string | null {
  const itemUrlRegex = new RegExp(`href="(https?:\\/\\/${MOBILE_PRICE_SITE_HOST.replace(/\./g, '\\.')}\\/item\\/K[0-9]+\\/)"`)
  const m = html.match(itemUrlRegex)
  if (m) return m[1]
  const km = html.match(/K([0-9]{10})/)
  if (km) return `https://${MOBILE_PRICE_SITE_HOST}/item/K${km[1]}/`
  return null
}

function parseItemPage(html: string, productUrl: string): StorePrice[] {
  const prices: StorePrice[] = []
  const blockRegex =
    /shopicon\/([^."\/]+)\.png[\s\S]{0,600}?p-shopLowprice_shopName_entity"[^>]*>([\s\S]{1,120}?)<[\s\S]{0,400}?&#165;([\d,]+)/g
  let m: RegExpExecArray | null
  while ((m = blockRegex.exec(html)) !== null && prices.length < 10) {
    const price = parseInt(m[3].replace(/,/g, ''), 10)
    if (price <= 0) continue
    const iconSlug = m[1].toLowerCase()
    const knownName = SHOPICON[iconSlug]
    const asciiFromH4 = asciiOnly(m[2]).trim()
    const storeName = knownName ?? (asciiFromH4.length >= 2 ? asciiFromH4 : `店舗${prices.length + 1}`)
    prices.push({ storeName, price, url: productUrl })
  }
  if (prices.length > 0) return prices

  // フォールバック: 価格エンティティのみ
  const seen = new Set<number>()
  const fallback = /&#165;([\d,]+)/g
  let pm: RegExpExecArray | null
  while ((pm = fallback.exec(html)) !== null && prices.length < 5) {
    const p = parseInt(pm[1].replace(/,/g, ''), 10)
    if (p > 100 && p < 10_000_000 && !seen.has(p)) {
      seen.add(p)
      prices.push({ storeName: `店舗${prices.length + 1}`, price: p, url: productUrl })
    }
  }
  return prices
}

// ============================================================
// ルート2: バーコード検索 → 直接価格リスト
//   priceNum + icon_mall ID + shopName の組み合わせ
// ============================================================

function parseSearchPage(html: string, searchUrl: string): StorePrice[] {
  const prices: StorePrice[] = []
  // priceNum → icon_mall のブロック単位で抽出
  const blockRegex =
    /class="priceNum">([\d,]+)[\s\S]{0,500}?icon_mall\/(\w+)\.png/g
  let m: RegExpExecArray | null
  while ((m = blockRegex.exec(html)) !== null && prices.length < 10) {
    const price = parseInt(m[1].replace(/,/g, ''), 10)
    const mallId = m[2]
    if (price <= 0) continue
    const mallName = MALL_ICON[mallId] ?? `ショップ${prices.length + 1}`
    prices.push({ storeName: mallName, price, url: searchUrl })
  }
  if (prices.length > 0) return prices

  // フォールバック: priceNum だけ
  const priceOnly = /class="priceNum">([\d,]+)/g
  const seen = new Set<number>()
  let pm: RegExpExecArray | null
  while ((pm = priceOnly.exec(html)) !== null && prices.length < 8) {
    const p = parseInt(pm[1].replace(/,/g, ''), 10)
    if (p > 100 && p < 10_000_000 && !seen.has(p)) {
      seen.add(p)
      prices.push({ storeName: `ショップ${prices.length + 1}`, price: p, url: searchUrl })
    }
  }
  return prices
}

// ============================================================
// メイン
// ============================================================

export async function searchKakaku(keyword: string): Promise<KakakuResult> {
  const searchUrl = `https://${SEARCH_PRICE_SITE_HOST}/${encodeURIComponent(keyword)}/`
  let searchHtml: string
  try {
    searchHtml = await fetchLatin1(searchUrl)
  } catch {
    return { productName: null, productUrl: null, stores: [] }
  }

  // ルート1: K番号が見つかれば詳細ページへ
  const itemUrl = findItemUrl(searchHtml)
  if (itemUrl) {
    let detailHtml: string
    try {
      detailHtml = await fetchLatin1(itemUrl)
    } catch {
      return { productName: null, productUrl: itemUrl, stores: [] }
    }
    const titleRaw = detailHtml.match(/<title>([^<]+)/)
    const productName = titleRaw ? asciiOnly(titleRaw[1]).replace(/[-|].*/, '').trim() || null : null
    const stores = parseItemPage(detailHtml, itemUrl)
    return { productName, productUrl: itemUrl, stores }
  }

  // ルート2: バーコード → 直接パース
  const stores = parseSearchPage(searchHtml, searchUrl)
  if (stores.length > 0) {
    return { productName: null, productUrl: searchUrl, stores }
  }

  return { productName: null, productUrl: null, stores: [] }
}
