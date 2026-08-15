# 技術仕様書 — PriceLens（仮）

## アーキテクチャ概要

```
┌─────────────────────────────────────────────┐
│                Mobile App                    │
│         React Native + Expo (TS)             │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Barcode  │  │ Camera   │  │  Text    │  │
│  │ Scanner  │  │ + Vision │  │  Search  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼─────────────┼─────────────┼─────────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
              ┌───────▼────────┐
              │  Supabase      │
              │  Edge Function │  ← APIゲートウェイ兼キャッシュ
              └───┬────────────┘
                  │
     ┌────────────┼────────────────────┐
     ▼            ▼                    ▼
┌─────────┐ ┌──────────┐    ┌──────────────────┐
│ Amazon  │ │ 楽天     │    │ Google Vision    │
│ PA-API  │ │ API      │    │ API              │
└─────────┘ └──────────┘    └──────────────────┘
                         ┌─────────────────────┐
                         │ メルカリ / ヤフオク  │
                         │ （スクレイピング）   │
                         └─────────────────────┘
```

---

## 技術スタック

### フロントエンド（モバイル）

| 技術 | バージョン | 理由 |
|------|----------|------|
| React Native | 0.74+ | iOS/Android両対応 |
| Expo | SDK 51+ | 開発速度向上、EAS Build |
| TypeScript | 5.x | 型安全性 |
| Expo Camera | latest | バーコード + 写真撮影 |
| Expo Barcode Scanner | latest | JAN/EANコード対応 |
| React Query (TanStack) | v5 | APIキャッシュ・同期 |
| Zustand | v4 | 軽量グローバルState管理 |
| React Navigation | v6 | 画面遷移 |
| NativeWind | v4 | Tailwind CSS for RN |
| RevenueCat | latest | 課金・サブスク管理 |

### バックエンド

| 技術 | 用途 |
|------|------|
| Supabase | DB（PostgreSQL）+ 認証 + Edge Functions |
| Supabase Edge Functions (Deno) | 外部API呼び出し・スクレイピング実行 |
| Supabase Realtime | 価格アラート通知 |

### 外部API

詳細は [API_RESEARCH.md](API_RESEARCH.md) を参照。

---

## データベース設計

### テーブル構成

```sql
-- ユーザー（Supabase Authが自動生成するauth.usersを参照）
users (
  id          uuid PRIMARY KEY references auth.users,
  plan        text DEFAULT 'free',  -- 'free' | 'standard' | 'pro'
  scan_count_today int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
)

-- スキャン履歴
scan_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid references users(id),
  query       text,              -- 検索キーワード or バーコード値
  query_type  text,              -- 'barcode' | 'image' | 'text'
  result      jsonb,             -- 価格結果スナップショット
  purchase_price int,            -- 仕入れ値（入力した場合）
  created_at  timestamptz DEFAULT now()
)

-- ウォッチリスト（価格アラート）
watchlist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid references users(id),
  product_id  text,              -- Amazon ASIN or 商品識別子
  product_name text,
  alert_price int,               -- アラート発火価格（円）
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
)

-- 価格キャッシュ（APIコスト削減）
price_cache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key   text UNIQUE,       -- バーコード値 or 検索ワードのハッシュ
  result      jsonb,
  expires_at  timestamptz,       -- 15分TTL
  created_at  timestamptz DEFAULT now()
)
```

---

## API設計（Edge Functions）

### POST `/functions/v1/search`

商品検索のメインエンドポイント。全サイトへの並列リクエストを実行してキャッシュ。

**Request:**
```json
{
  "query": "978-4-00-001234-5",
  "queryType": "barcode"
}
```

**Response:**
```json
{
  "productName": "吾輩は猫である",
  "results": {
    "amazon": {
      "newPrice": 880,
      "usedPrice": 200,
      "fbaPrice": 950,
      "url": "https://amazon.co.jp/dp/XXXXXXXXXX?tag=xxx"
    },
    "rakuten": {
      "price": 990,
      "url": "https://..."
    },
    "mercari": {
      "soldPrice": 650,
      "listingPrice": 700,
      "url": "https://..."
    },
    "yahuoku": {
      "avgSoldPrice": 580,
      "url": "https://..."
    }
  },
  "cachedAt": "2026-06-12T10:30:00Z"
}
```

### POST `/functions/v1/vision`

Google Vision APIへのプロキシ。APIキーをサーバー側に秘匿。

**Request:**
```json
{
  "imageBase64": "..."
}
```

**Response:**
```json
{
  "keywords": ["iPhone 15 Pro", "Apple", "MU703J/A"],
  "barcodes": ["4549995xxxxxx"]
}
```

---

## キャッシュ戦略

| データ | TTL | 理由 |
|-------|-----|------|
| Amazon価格 | 15分 | PA-APIの利用制限対策 |
| 楽天価格 | 15分 | 頻繁な変動なし |
| メルカリ成約価格 | 1時間 | 変動が緩やか |
| ヤフオク落札相場 | 1時間 | 集計データのため |

---

## セキュリティ

- APIキーは全て Supabase Edge Functions の環境変数に配置（クライアントに露出しない）
- Supabase RLS（Row Level Security）でユーザーは自分のデータのみアクセス可能
- スキャン回数制限は Edge Function で検証（クライアント側検証は信頼しない）
- RevenueCatのWebhookでプラン変更を検証

---

## スクレイピングに関する法的注意事項

メルカリ・ヤフオクの価格データ取得はスクレイピングによる実装を想定しているが、以下のリスクがある:

**リスク:**
1. 利用規約違反 → サービス停止・アカウントBAN
2. 不正競争防止法 / 著作権法の問題（可能性）
3. IP制限・CAPTCHA対応コストの増加

**対策:**
1. User-Agentを偽装しない（誠実な実装）
2. クロール間隔を十分に空ける（1秒以上）
3. robots.txtを遵守
4. 利用規約を定期的（月1回）に確認し、禁止記載があれば即停止
5. 代替として公式API申請を並行して進める
6. 法的グレーゾーンであることをユーザーへの利用規約に明記

**フォールバック:** メルカリ・ヤフオク非対応でも Amazon + 楽天 だけでMVPとして成立する。

---

## 開発環境セットアップ

```bash
# 必要なツール
node >= 20.x
npm >= 10.x
expo-cli (EAS CLI)

# インストール
npm install

# Supabaseローカル環境
npx supabase start

# アプリ起動
npx expo start

# iOSシミュレータ
npx expo run:ios

# Androidエミュレータ
npx expo run:android
```

---

## デプロイ

| 環境 | 方法 |
|------|------|
| モバイルアプリ | EAS Build → TestFlight / Google Play Console |
| Edge Functions | `supabase functions deploy` |
| 本番DB | Supabase Cloud（Pro plan） |
| CI/CD | GitHub Actions + EAS CLI |
