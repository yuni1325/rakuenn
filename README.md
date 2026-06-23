# Rakuenn（楽園柏店 データ取得アプリ）

楽園柏店のパチスロデータを **アナスロ** / **みんレポ** から収集し、SQLite に保存・ダッシュボードで閲覧する Web アプリです。

## 機能

- **管理画面** (`/admin`) … 期間・データソースを指定してデータ取得
- **ダッシュボード** (`/dashboard`) … 台番・機種名・総回転数・差枚などを表示
- データソース: `ana_slo`（アナスロ）/ `min_repo`（みんレポ）
- みんレポは全台データのみ取得（BB/RB は取得しない）

## ローカル開発

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

### 環境変数（ローカル）

| 変数 | 説明 |
|------|------|
| `DATABASE_URL` | `file:./dev.db`（SQLite） |
| `PLAYWRIGHT_HEADLESS` | `false` でブラウザ表示（デバッグ向け） |

## GitHub へアップロード

1. [GitHub](https://github.com/new) で新しいリポジトリ `rakuenn` を作成（README は追加しない）
2. プロジェクト直下で:

```bash
git init
git add .
git commit -m "Initial commit: Rakuenn slot data scraper"
git branch -M main
git remote add origin https://github.com/<あなたのユーザー名>/rakuenn.git
git push -u origin main
```

## スマホから使う（Railway デプロイ）

Playwright を動かすため **Vercel ではなく Railway（Docker）** を推奨します。

### 1. Railway でプロジェクト作成

1. https://railway.app にログイン
2. **New Project** → **Deploy from GitHub repo** → `rakuenn` を選択
3. リポジトリ連携後、自動で Dockerfile からビルドされます

### 2. 永続ストレージ（SQLite）

1. Railway ダッシュボード → サービス → **Volumes**
2. **Add Volume** … マウントパス: `/data`
3. 環境変数を設定:

```
DATABASE_URL=file:/data/dev.db
PLAYWRIGHT_HEADLESS=true
NODE_ENV=production
```

### 3. 公開 URL を取得

1. **Settings** → **Networking** → **Generate Domain**
2. 表示された URL（例: `https://rakuenn-production.up.railway.app`）をスマホのブラウザで開く
3. **管理画面** からデータ取得、**ダッシュボード** で結果確認

### 注意

- 1回の取得は最大 31 日まで。日付ごとに約 5 秒の間隔があります
- アナスロは Cloudflare により連続アクセスが制限されることがあります
- URL を知っている人は誰でも操作できるため、必要なら Railway の非公開ネットワークや認証の追加を検討してください

## 技術スタック

- Next.js 15 / React 19
- Prisma + SQLite
- Playwright（スクレイピング）
- Tailwind CSS 4

## ライセンス

Private / 個人利用
