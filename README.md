# スキャリ — バーコード価格比較アプリ

**App Store：** https://apps.apple.com/jp/app/id6779504958

店頭で商品のバーコードを読み取るだけで、楽天市場・Yahoo!ショッピングなど複数のECサイトの価格を一覧で比較できる iOS / Android アプリ。
仕入れ値を入力すると利益率も自動で計算し、「その場で買うかどうか」を判断できる。

## 主な機能

- カメラでバーコード（JAN）をスキャンして価格を検索。商品名のテキスト検索にも対応
- 楽天市場・Yahoo!ショッピングの価格を並列で取得し、最安値を表示
- Amazon・メルカリ・ヤフオクは検索結果ページへワンタップで移動
- 仕入れ値と販売価格から利益率を計算
- 検索履歴を端末内に保存（ログイン不要）

## 技術情報

| 項目 | 内容 |
|---|---|
| アプリ | React Native 0.85 / Expo SDK 56 / TypeScript |
| 状態管理 | Zustand（AsyncStorage で永続化） |
| バーコード読み取り | expo-camera |
| 価格データ | 楽天ウェブサービス API / Yahoo!ショッピング API |
| リリース | EAS Build / fastlane（ストア情報・スクリーンショットをコード管理） |
| サポートページ | GitHub Pages（`docs/`） |

## 設計の工夫

- **応答速度：** 楽天とYahoo!を `Promise.all` で並列に問い合わせ、片方で商品が見つからない場合は、もう片方で取れた商品名を使って再検索する
- **タイムアウト：** すべての外部通信に `AbortController` で上限時間を設け、1つのサイトが遅くても画面が固まらないようにした
- **プライバシー：** アカウント登録なし。検索履歴は端末内のみに保存し、サーバーへ送らない

## セットアップ

```bash
npm install
cp .env.example .env   # 楽天アプリID・Yahoo!クライアントIDを記入
npx expo start
```

`.env` はGit管理外。楽天・Yahoo!のIDは公開クライアント向けのIDのみを使い、秘密鍵が必要なAPIはアプリに含めない。

## 企画資料

| ファイル | 内容 |
|---------|------|
| [BUSINESS_PLAN.md](docs/BUSINESS_PLAN.md) | 収益モデル・費用試算・マーケティング戦略 |
| [COMPETITIVE_ANALYSIS.md](docs/COMPETITIVE_ANALYSIS.md) | 競合比較（PLUG / Keepa 等） |
| [PRD.md](docs/PRD.md) | 製品要件定義（全機能仕様） |
| [TECH_SPEC.md](docs/TECH_SPEC.md) | 技術アーキテクチャ・API設計 |
| [API_RESEARCH.md](docs/API_RESEARCH.md) | 使用API一覧・制限・料金 |
| [MVP_SCOPE.md](docs/MVP_SCOPE.md) | 最初にリリースする最小構成 |

## License

MIT
