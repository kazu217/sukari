# API調査レポート — PriceLens（仮）

## サマリー

| API | 費用 | 申請難度 | データ品質 | 利用可否 |
|-----|------|---------|-----------|---------|
| Amazon PA-API v5 | 無料（アソシエイト必須） | 中 | 高 | ✅ |
| 楽天市場API | 無料 | 低 | 高 | ✅ |
| Google Vision API | 有料（従量課金） | 低 | 高 | ✅ |
| メルカリ（スクレイピング） | 無料 | 低 | 中 | ⚠️ 法的リスクあり |
| ヤフオク（スクレイピング） | 無料 | 低 | 中 | ⚠️ 法的リスクあり |
| Yahoo!ショッピングAPI | 無料 | 低 | 高 | ✅（v1.1で追加） |

---

## 1. Amazon Product Advertising API v5（PA-API 5.0）

### 概要
Amazonアフィリエイトプログラム（Amazon Associates）メンバー向けに提供される商品データAPIです。

### 前提条件
- **Amazonアソシエイト（アフィリエイト）アカウントが必須**
- アカウント開設後、PA-APIの利用申請が必要
- 申請後に Access Key ID / Secret Access Key / Associate Tag が発行される

### 利用制限
| 制限項目 | 内容 |
|---------|------|
| レート制限 | 1秒1リクエスト（デフォルト）|
| 売上ノルマ | 開設後180日以内に3件以上の売上が必要（未達でアカウント停止）|
| データキャッシュ | 最大24時間キャッシュ可（ただし表示時に鮮度表示必要）|
| 表示ルール | Amazonロゴ・価格情報の表示方法にガイドライン有り |

### 取得できるデータ
- 商品名・ASIN・ISBN
- 新品・中古・コレクター品の価格
- カテゴリ・ランキング
- 商品画像URL
- アフィリエイトリンク（タグ付き）

### 費用
**無料**（ただしアフィリエイト収入がAPIのコストに相当）

### 申請方法
1. Amazonアソシエイトに登録（既存アカウントを使用）
2. アソシエイト管理画面 → 「ツール」→「Product Advertising API」から申請
3. PA-APIポータルでアクセスキーを作成

### サンプルコード（TypeScript）
```typescript
import { SearchItemsCommand, ProductAdvertisingAPIClient } from 'paapi5-typescript-sdk'

const client = new ProductAdvertisingAPIClient({
  AccessKey: process.env.AMAZON_ACCESS_KEY!,
  SecretKey: process.env.AMAZON_SECRET_KEY!,
  PartnerTag: process.env.AMAZON_ASSOCIATE_TAG!,
  PartnerType: 'Associates',
  Marketplace: 'www.amazon.co.jp',
})

const response = await client.searchItems({
  Keywords: 'iPhone 15',
  Resources: ['Offers.Listings.Price', 'ItemInfo.Title', 'Images.Primary.Small'],
})
```

---

## 2. 楽天市場API（楽天ウェブサービス）

### 概要
楽天が無料で提供するEC系API群。登録不要で即利用可能。

### 主要エンドポイント
| API | 機能 |
|-----|------|
| 楽天商品検索API | キーワード・ジャンルで商品検索 |
| 楽天商品コードサーチAPI | JANコードから商品検索（バーコードと相性◎）|

### 利用制限
| 制限項目 | 内容 |
|---------|------|
| レート制限 | 1秒1リクエスト |
| 日次上限 | アプリID1つで50,000リクエスト/日 |
| 商業利用 | 可（アフィリエイト利用も可）|

### 取得できるデータ
- 商品名・価格（税込）・在庫状況
- 商品URL（アフィリエイトリンク設定可）
- ショップ名・評価
- 商品画像URL

### 費用
**完全無料**

### 申請方法
1. 楽天ウェブサービスに登録（楽天アカウントで可）
2. アプリIDを即日取得
3. アフィリエイト利用する場合は楽天アフィリエイトにも別途登録

### サンプルコード（TypeScript）
```typescript
const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID!

const searchByJan = async (janCode: string) => {
  const url = new URL('https://app.rakuten.co.jp/services/api/Product/Search/20170426')
  url.searchParams.set('applicationId', RAKUTEN_APP_ID)
  url.searchParams.set('keyword', janCode)
  url.searchParams.set('hits', '10')
  url.searchParams.set('sort', '+itemPrice')

  const res = await fetch(url.toString())
  return res.json()
}
```

---

## 3. Google Vision API

### 概要
Googleが提供する画像解析AI。テキスト検出（OCR）・ロゴ検出・バーコード検出が可能。

### 主要機能（PriceLensでの使用目的）

| 機能 | 用途 |
|------|------|
| TEXT_DETECTION | 商品名・型番・価格などのテキスト抽出 |
| PRODUCT_SEARCH | 商品画像から類似商品検索（※要設定） |
| LOGO_DETECTION | ブランドロゴ検出 |

### 料金（2026年時点）

| 機能 | 最初の1,000回/月 | 1,001〜5,000,000回/月 |
|------|----------------|---------------------|
| TEXT_DETECTION | 無料 | $1.50/1,000件 |
| LOGO_DETECTION | 無料 | $1.50/1,000件 |

**月1万スキャン想定のコスト試算:**
- 1,000件: 無料
- 残り9,000件 × $1.50/1,000 = $13.5（約2,000円）
- ✅ 初期は非常に安い

### 申請方法
1. Google Cloud Console でプロジェクト作成
2. Vision API を有効化
3. APIキーを作成（またはサービスアカウント）
4. 費用上限アラートを設定（予算超過対策）

### 重要: APIキーはサーバー側（Edge Function）に配置
クライアント（モバイルアプリ）に直接埋め込むと漏洩リスクがあるため、Supabase Edge Functions でプロキシする。

---

## 4. メルカリ（スクレイピング）

### 現状
- **公式APIは非公開**（2026年6月時点）
- スクレイピングによる価格取得のみ可能

### 取得できるデータ
- 「売り切れ」商品の成約価格（=実際に売れた価格）
- 出品中の最安値

### 実装方法
```typescript
// Supabase Edge Function（Deno）でのスクレイピング例
const searchMercari = async (keyword: string) => {
  const url = `https://jp.mercari.com/search?keyword=${encodeURIComponent(keyword)}&status=sold_out`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PriceLensBot/1.0)',
    }
  })
  const html = await res.text()
  // HTMLパース → 価格抽出
  // ...
}
```

### リスク詳細
| リスク | 発生確率 | 影響 |
|-------|---------|------|
| 利用規約違反 | 中 | 機能停止、最悪法的措置 |
| IP制限 | 高 | スクレイピングが機能しなくなる |
| HTML構造変更 | 高 | パーサー修正が必要（保守コスト）|
| CAPTCHA | 中 | 自動取得不可能になる |

### 対策
- Supabaseのサーバー（東京リージョン）から実行
- 取得間隔: 同一キーワードは15分以上空ける（キャッシュ活用）
- HTMLパーサーの変更耐性を高める設計にする
- 代替: 将来的にメルカリAPIの公開を待つ or メルカリShopsの公式連携を検討

---

## 5. ヤフオク（スクレイピング）

### 現状
- Yahoo!オークションAPIは廃止済み（2019年）
- スクレイピングによる「落札相場」取得が主流

### 取得できるデータ
- 過去の落札価格（終了した商品）
- 現在出品中の価格

### 実装方法
ヤフオクの落札履歴検索ページをパース。

### リスク
メルカリと同様。Yahoo! JAPANの利用規約で自動アクセスを禁止している記載がある。

---

## 6. Yahoo!ショッピングAPI（v1.1で追加予定）

### 概要
Yahoo!が無料で提供するショッピングAPIです。

### 利用制限
| 制限項目 | 内容 |
|---------|------|
| レート制限 | 1秒1リクエスト |
| 費用 | 無料 |
| 申請 | Yahoo! JAPAN デベロッパーネットワークに登録 |

---

## API統合コスト試算

| ユーザー数 | 月スキャン数 | Vision API費用 | Supabase費用 | 合計 |
|-----------|------------|--------------|-------------|------|
| ~500人 | ~30,000回 | ~$44（約6,600円）| 25,000円 | ~3.2万円/月 |
| ~3,000人 | ~180,000回 | ~$268（約40,000円）| 100,000円 | ~14万円/月 |
