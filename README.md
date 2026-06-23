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
2. プロジェクト直下で（`YOUR_GITHUB_USERNAME` を自分の GitHub ユーザー名に置き換え。`<ユーザー名>` はそのまま入力しない）:

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/rakuenn.git
git push -u origin main
```

すでに誤った remote を登録した場合:

```bash
git remote remove origin
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/rakuenn.git
git push -u origin main
```

## スマホから使う（Railway デプロイ）

Playwright を動かすため **Vercel ではなく Railway（Docker）** を推奨します。

### 1. Railway アカウントと連携

1. https://railway.app を開き、**GitHub アカウントでログイン**
2. 初回は GitHub 連携の許可を求められるので **Authorize** する

### 2. プロジェクト作成

1. **New Project** をクリック
2. **GitHub Repo** を選択
3. リポジトリ一覧から **`yuni1325/rakuenn`** を選ぶ
4. デプロイが自動で始まる（Dockerfile からビルド、5〜10分かかることがあります）

### 3. 永続ストレージ（データベース用・重要）

再デプロイしてもデータが消えないよう、Volume を設定します。

1. デプロイされた **サービス**（rakuenn）をクリック
2. 上部タブの **Volumes** を開く
3. **Add Volume** をクリック
4. **Mount Path** に `/data` と入力して作成

### 4. 環境変数

同じサービス画面の **Variables** タブで以下を追加（なければ）:

| 変数名 | 値 |
|--------|-----|
| `DATABASE_URL` | `file:/data/dev.db` |
| `PLAYWRIGHT_HEADLESS` | `true` |
| `NODE_ENV` | `production` |
| `ACCESS_PASSWORD` | 任意のパスワード（自分だけアクセス用） |

`PORT` は Railway が自動設定するので **追加不要** です。

`ACCESS_PASSWORD` を設定すると、サイト全体にベーシック認証がかかります。スマホで URL を開いたときにユーザー名・パスワード入力が求められます（**ユーザー名は何でも可**、パスワードだけ一致すれば OK）。

### 5. 公開 URL を発行

1. **Settings** タブを開く
2. **Networking** → **Public Networking** → **Generate Domain**
3. 表示された URL（例: `https://rakuenn-production-xxxx.up.railway.app`）をコピー

### 6. スマホで開く

1. スマホのブラウザ（Safari / Chrome）で上記 URL を開く
2. **管理画面**（`/admin`）でデータ取得
3. **ダッシュボード**（`/dashboard`）で結果を確認

ホーム画面に追加したい場合は、ブラウザの「ホーム画面に追加」でアプリのように使えます。

### デプロイ後のコード更新

ローカルで変更して GitHub に push すると、Railway が自動で再デプロイします。

```bash
git add .
git commit -m "変更内容"
git push
```

---

## Railway でうまくいかないとき

### 「Deployments」が見つからない

Railway の新しい UI では、**プロジェクト画面の真ん中（キャンバス）** にサービス（箱）が1つ表示されます。

1. https://railway.com/dashboard を開く
2. プロジェクト名（例: `rakuenn`）をクリック
3. **キャンバス上のサービス（箱）をクリック**（`rakuenn` や GitHub アイコンの付いたカード）
4. 右側にパネルが開く → ここに **Deployments** またはビルド状況が出ます
5. 失敗している行をクリック → **Build Logs** / **Deploy Logs** を確認

別の見方:
- サービスをクリック → **Observability** タブ → **Logs**
- 画面上部の **Activity**（時計アイコン）からも履歴が見られる場合があります

### ビルドがそもそも始まらない

次を確認してください。

| 確認項目 | やること |
|----------|----------|
| リポジトリ連携 | **New Project** → **GitHub Repo** → `yuni1325/rakuenn` を選び **Deploy Now** |
| GitHub 権限 | https://github.com/settings/installations で **Railway** に `rakuenn` へのアクセスがあるか |
| 空のプロジェクト | キャンバスにサービスが無い → **+ New** → **GitHub Repo** で追加 |
| 手動デプロイ | サービス選択後、右上の **Deploy** ボタンを押す |

### 最初からやり直す場合

1. Railway ダッシュボード → 問題のプロジェクト → **Settings** → 一番下 **Delete Project**
2. **New Project** → **GitHub Repo**
3. `yuni1325/rakuenn` を検索して選択
4. **Deploy Now** をクリック
5. キャンバス上のサービスをクリックし、ビルドログを見る（5〜15分かかることあり）

### 注意

- 初回ビルドは Playwright イメージのため **数分** かかります
- データ取得は1日あたり数十秒〜数分。画面を閉じずに待ってください
- 1回の取得は最大 31 日まで
- `ACCESS_PASSWORD` を設定すれば、URL を知っていてもパスワードなしではアクセスできません

## 技術スタック

- Next.js 15 / React 19
- Prisma + SQLite
- Playwright（スクレイピング）
- Tailwind CSS 4

## ライセンス

Private / 個人利用
