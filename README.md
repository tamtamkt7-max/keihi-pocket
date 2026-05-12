# 経費ポケット

経費ポケットは、レシートを撮って、経費と売上をまとめて管理するスマホ向けの記録アプリです。

基本の流れは `撮る → 確認 → 保存` です。

## セットアップ

1. 依存関係を入れます。

```bash
npm install
```

2. 環境変数ファイルを作ります。

```bash
cp .env.example .env.local
```

3. 開発サーバーを起動します。

```bash
npm run dev
```

4. ブラウザで `http://localhost:3000` を開きます。

## 開発サーバーが不安定なとき

Windows で `.next` 配下のファイルが見つからないエラーが出る場合は、いったん消してから起動し直してください。

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

同じことは次のコマンドでもできます。

```bash
npm run clean
npm run dev
```

日本語ユーザー名のパスで開発サーバーが不安定になる場合は、安定起動を使います。

```bash
npm run clean
npm run dev:stable -- -p 3001
```

スマホ実機では、表示された `Network URL` を開きます。

## Firebase の設定

ログインしたユーザーの記録を保存する場合は、`.env.local` に次の値を入れます。

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ENABLE_CLOUD_IMAGES=false
```

今の方針では、記録本体の保存を優先します。  
`NEXT_PUBLIC_ENABLE_CLOUD_IMAGES=false` のままなら、画像保存は必須になりません。

### お試しで使うとき

- ログインしない場合は、この端末だけに保存されます
- 画像は保存されないことがあります
- あとからログインして使い始めることもできます

### ログインして使うとき

- 記録はログインしたアカウントに保存されます
- スマホやPCで同じ記録を見られます
- 画像保存は今の段階では任意です

## Firestore ルール

記録は `users/{uid}/records/{recordId}` に保存する前提です。  
ルールを反映するときは、次を実行します。

```bash
firebase deploy --only firestore:rules
```

現在のルールでは次を守るようにしています。

- `users/{uid}/records/{recordId}` は本人だけ読み書き可能
- 他のユーザーの記録は読めない
- 未ログインの状態では Firestore に保存しない
- お試し利用はブラウザ内だけで完結

## Storage について

画像保存は将来使える形を残していますが、今は必須ではありません。  
Spark プランでは無理に使わず、必要になった段階で有料プランと運用を見直す前提です。

ルールを反映するときは、必要な場合だけ次を実行します。

```bash
firebase deploy --only storage
```

## レシート読み取り設定

読み取り精度を上げる場合は、Google Cloud Vision API を使います。

```env
GOOGLE_CLOUD_VISION_API_KEY=
```

サービスアカウントで接続する場合は、次の値も使えます。

```env
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_CLIENT_EMAIL=
GOOGLE_CLOUD_PRIVATE_KEY=
```

`GOOGLE_CLOUD_PRIVATE_KEY` は、改行を `\n` のまま入れてください。

設定がない場合でもアプリは起動し、簡易読み取りで動きます。  
開発中だけ読み取り結果を画面で確認したい場合は、次を使います。

```env
NEXT_PUBLIC_SHOW_RECEIPT_DEBUG=true
```

## 広告の設定

AdSense を使うときは、`.env.local` に次の値を入れます。

```env
NEXT_PUBLIC_ADSENSE_ENABLED=false
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADSENSE_SLOT_HOME_BOTTOM=
NEXT_PUBLIC_ADSENSE_SLOT_REPORTS_BOTTOM=
NEXT_PUBLIC_ADSENSE_SLOT_SETTINGS=
```

今の実装では、次の条件を満たすときだけ広告スクリプトを読み込みます。

- 本番環境
- `NEXT_PUBLIC_ADSENSE_ENABLED=true`
- `NEXT_PUBLIC_ADSENSE_CLIENT` が入っている

広告を出す場所:

- ホーム下部
- 集計画面下部
- 設定画面

広告を出さない場所:

- 撮影画面
- 登録画面
- 保存前後の確認画面
- ログイン画面
- 詳細編集画面
- 読み取り中の画面

開発環境では広告を出さない方針です。  
広告を減らすプランは将来用の置き場だけ用意しており、まだ課金処理は入っていません。

## ads.txt

`public/ads.txt` を用意しています。  
AdSense の管理画面で表示された行を、そのまま `public/ads.txt` に貼り付けてください。

開発中の確認:

```text
http://127.0.0.1:3001/ads.txt
http://localhost:3001/ads.txt
```

公開後は、ルートの `/ads.txt` で見える必要があります。

## ログイン確認

- PC: `http://localhost:3001/login`
- スマホ: `http://192.168.1.90:3001/login`

確認したい内容:

- Google で続ける
- メールアドレスとパスワードでログイン
- 新規登録
- パスワード再設定
- お試しで使う

ローカル IP ではブラウザや認証設定の影響で Google ログインが不安定になることがあります。  
その場合は、まず PC の `localhost` で確認してから、スマホではメールアドレスでのログインも試してください。

## 公開前ページ

最低限の案内ページを用意しています。

- `/terms`
- `/privacy`
- `/contact`

設定画面から移動できます。ログインしなくても開けます。

## PWA の確認

土台として次を入れています。

- アプリ名: `経費ポケット`
- `manifest.webmanifest`
- テーマカラー
- ホーム画面追加用のアイコン

確認するときは、スマホでブラウザの共有メニューからホーム画面に追加して、名前や色味が自然かを見ます。

## Firebase Hosting を使う場合

まだ `firebase.json` を作っていない場合は、先に初期化します。

```bash
firebase init hosting
```

公開前に確認したいこと:

- `npm run build` が通る
- Firestore ルールが反映されている
- ログイン後の保存が一覧と集計に出る
- 利用規約、プライバシーポリシー、お問い合わせが開ける
- `ads.txt` がルートで見られる

## 確認コマンド

公開前に次を実行します。

```bash
npm run build
npm run typecheck
```
