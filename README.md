# PriceLens（仮）

> 写真を撮るだけで、Amazon・楽天・メルカリ・ヤフオクの相場が瞬時にわかる。転売・せどり業者のための仕入れ判断アプリ。

## コンセプト

リアル店舗で商品を見つけた時、「これいくらで売れる？」を3秒で解決する。

- バーコードをスキャン or 写真を撮る
- Amazon / 楽天 / メルカリ / ヤフオクの現在価格を一覧表示
- 仕入れ値を入力すると**利益率を自動計算**
- 「買い」か「スルー」かをその場で判断できる

## ターゲットユーザー

転売・せどり業者（Amazon販売者、フリマ出品者）

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| モバイルアプリ | React Native + Expo（iOS / Android） |
| 言語 | TypeScript |
| バックエンド | Supabase（PostgreSQL + 認証 + Edge Functions） |
| 商品認識 | Google Vision API（画像認識・OCR）|
| 価格データ | Amazon PA-API v5 / 楽天市場API / スクレイピング |
| 課金 | RevenueCat |
| CI/CD | GitHub Actions + EAS Build |

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [BUSINESS_PLAN.md](docs/BUSINESS_PLAN.md) | 収益モデル・費用試算・マーケティング戦略 |
| [COMPETITIVE_ANALYSIS.md](docs/COMPETITIVE_ANALYSIS.md) | 競合比較（PLUG / Keepa 等） |
| [PRD.md](docs/PRD.md) | 製品要件定義（全機能仕様） |
| [TECH_SPEC.md](docs/TECH_SPEC.md) | 技術アーキテクチャ・API設計 |
| [API_RESEARCH.md](docs/API_RESEARCH.md) | 使用API一覧・制限・料金 |
| [MVP_SCOPE.md](docs/MVP_SCOPE.md) | 最初にリリースする最小構成 |

## セットアップ（開発開始時に更新予定）

```bash
# リポジトリクローン後
npm install

# 環境変数設定
cp .env.example .env
# .env に各APIキーを設定

# 開発サーバー起動
npx expo start
```

## 環境変数

```
AMAZON_ACCESS_KEY=
AMAZON_SECRET_KEY=
AMAZON_ASSOCIATE_TAG=
RAKUTEN_APP_ID=
GOOGLE_VISION_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## ライセンス

Private / All Rights Reserved
