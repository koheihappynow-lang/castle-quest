# おてがみ サーバー（サンタさん・パパと はなす）

こどもの iPad と パパの スマホの あいだで おてがみを あずかる、小さな サーバーです。
Cloudflare Workers の **無料わく** で うごきます（1日 10万回まで。家族で つかうには 十分）。

## いまの せってい（2026-11-17 設定ずみ）
- アドレス：`https://endogame-letters.endogame-kids.workers.dev`
- かぎ：`C:\Users\works\.endogame_family_key`（GitHub には のせない）
- おてがみの 一覧：D1 データベース `endogame-letters`（つねに 最新）。声・絵・つなぐ ばんごう：KV
- 更新：`server` フォルダで `npx wrangler deploy`
- テーブルの つくりかた：`schema.sql`

## じゅんび（1回だけ・15分くらい）

1. **Cloudflare の アカウントを つくる**（無料）：https://dash.cloudflare.com/sign-up
2. **KV（データの おきば）を つくる**
   - 左メニュー「ストレージとデータベース → Workers KV」→「作成」→ 名前：`endogame-letters`
3. **Worker を つくる**
   - 左メニュー「Workers & Pages」→「作成」→「Hello World から開始」→ 名前：`endogame-letters` →「デプロイ」
   - 「コードを編集」→ 中身を ぜんぶ けして、このフォルダの `worker.js` を はりつけ →「デプロイ」
4. **つなぐ**（Worker の「設定」）
   - 「バインディング → 追加 → KV 名前空間」：変数名 `LETTERS`、KV は 2. の `endogame-letters`
   - 「変数とシークレット → 追加」
     - `FAMILY_KEY`（種類：**シークレット**）：かぞくの かぎ。`C:\Users\works\.endogame_family_key` の 中身を はりつける
     - `ALLOW_ORIGINS`（種類：テキスト）：`https://koheihappynow-lang.github.io`
   - 「デプロイ」
5. **アドレスを ひかえる**：`https://endogame-letters.<あなたの名前>.workers.dev`
6. **こどもの iPad（2台とも）**：EndoGame →「おうちのひと」→「💌 おてがみ」（あんしょうばんごう）→ アドレスと かぎを いれて「ほぞんして つながるか ためす」
7. **パパの スマホ**：`https://koheihappynow-lang.github.io/castle-quest/papa.html` を ひらいて、おなじ アドレスと かぎを いれる → 共有ボタン →「ホーム画面に追加」

## しくみ
- おてがみ（文字・こえ）は 180日で 自動で きえます。
- かぎを しらない ひとは よめません（かぎは コードや GitHub には のせない）。
- サーバーが つながらない ときは、iPad の なかに ためておき、つながったら おくります。
