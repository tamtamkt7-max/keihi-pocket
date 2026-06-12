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

## Firebase の設定

`.env.local` に次の値を入れます。

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ENABLE_CLOUD_IMAGES=false
```

### authDomain の方針

- Vercel 本番では `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=keihi-pocket.vercel.app` を使います
- ローカル開発では `keihi-pocket.firebaseapp.com` のままでも構いません

Safari などで Google ログインのリダイレクトを安定させるため、アプリ側では ` /__/auth/* ` を Firebase の handler へ rewrite しています。

### Firebase / Google Cloud で手動設定する内容

Firebase Authentication の承認済みドメイン:

- `keihi-pocket.vercel.app`

Google Cloud OAuth クライアント:

- 承認済み JavaScript 生成元
  - `https://keihi-pocket.vercel.app`
- 承認済みリダイレクト URI
  - `https://keihi-pocket.vercel.app/__/auth/handler`
  - `https://keihi-pocket.firebaseapp.com/__/auth/handler`

## Firestore ルール

記録は `users/{uid}/records/{recordId}` に保存する前提です。

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

```bash
firebase deploy --only storage
```

## レシート読み取り設定

読み取り精度を上げる場合は、Google Cloud Vision API を使います。

```env
GOOGLE_CLOUD_VISION_API_KEY=
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_CLIENT_EMAIL=
GOOGLE_CLOUD_PRIVATE_KEY=
```

`GOOGLE_CLOUD_PRIVATE_KEY` は、改行を `\n` のまま入れてください。

### 高精度読み取り

写真登録では、ログインユーザー向けに高精度読み取りを標準で使います。
未設定時や上限到達時は、通常の読み取りまたは手入力に切り替わります。

使う場合は `.env.local` に次を設定します。

```env
HIGH_ACCURACY_ENABLED=true
HIGH_ACCURACY_DAILY_LIMIT=20
OPENAI_API_KEY=
OPENAI_RECEIPT_MODEL=
```

`OPENAI_API_KEY` が未設定の場合でも、通常の読み取りと手入力はそのまま使えます。

高精度読み取りはログインユーザー向けで、標準では 1 日 20 回までです。

本番では必要に応じて `HIGH_ACCURACY_DAILY_LIMIT` を調整してください。

一時的に止めたい場合は `HIGH_ACCURACY_ENABLED=false` にします。

本番運用では、写真撮影中・読み取り中・入力フォーム内には広告を出さず、ホーム、一覧、集計、保存後の詳細、設定など作業を邪魔しない画面で広告収益を補う方針です。

## ログイン確認

- PC: `http://localhost:3001/login`
- スマホ: `http://192.168.1.90:3001/login`

確認したい内容:

- Google で続ける
- メールアドレスとパスワードでログイン
- 新規登録
- パスワード再設定
- お試しで使う

Google ログインがうまく戻らないときは、次を確認します。

- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` が本番ドメインになっているか
- `https://keihi-pocket.vercel.app/__/auth/handler` が使えるか
- Firebase Authentication の承認済みドメインに `keihi-pocket.vercel.app` が入っているか
- Google Cloud OAuth の生成元とリダイレクト URI が追加されているか

## 広告の設定

AdSense を使うときは、`.env.local` に次の値を入れます。

```env
NEXT_PUBLIC_ADSENSE_ENABLED=false
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADSENSE_SLOT_HOME_BOTTOM=
NEXT_PUBLIC_ADSENSE_SLOT_REPORTS_BOTTOM=
NEXT_PUBLIC_ADSENSE_SLOT_SETTINGS=
```

開発環境では広告を出さない方針です。

## ads.txt

`public/ads.txt` を用意しています。  
公開後はルートの `/ads.txt` で見える必要があります。

## 公開前ページ

- `/terms`
- `/privacy`
- `/contact`

設定画面から移動できます。ログインしなくても開けます。

## PWA の確認

- アプリ名: `経費ポケット`
- `manifest.webmanifest`
- テーマカラー
- ホーム画面追加用のアイコン

## Firebase Hosting を使う場合

まだ `firebase.json` を作っていない場合は、先に初期化します。

```bash
firebase init hosting
```

## 確認コマンド

```bash
npm run build
npm run typecheck
```
