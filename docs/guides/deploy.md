---
type: Playbook
title: 公開の手順
description: cf で D1・R2・秘密を用意し、Worker を出す。この作業環境からは静的ファイルを上げられないので、Cloudflare の Git 連携で出す。
tags: [guides, deploy, cloudflare]
generated: { by: claude-code/2.1.284, at: 2026-09-29T09:20:00Z }
---

# 前提

- Cloudflare の Workers 有料プラン（Worker Loader と 10MB の上限のため）
- 環境変数 `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID`

# 手順

| # | すること | 状態 |
| --- | --- | --- |
| 1 | D1（`scrapbooks`）と R2（`scrapbooks-media`）を `cf d1 create` / `cf r2 buckets create` で作り、D1 の ID を `wrangler.jsonc` に書く | 済み（2026-09-29） |
| 2 | Worker を出す（下の「出し方」） | 待ち |
| 3 | 合言葉を Worker の秘密 `SETUP_KEY` に入れる：`cf workers secrets update SETUP_KEY --worker scrapbooks --text <合言葉> --type secret_text` | 2 のあと |
| 4 | `https://scrapbooks.<subdomain>.workers.dev/_emdash/admin/setup?setup_key=<合言葉>` を開いて初期設定をする（`/_emdash/admin?…` の形だとクエリが消える） | 3 のあと |
| 5 | 好きなものを読み込む：`pnpm load:favorites -- --url <サイト> --token <トークン>` | 4 のあと |

合言葉がまだ入っていない間は、初期設定は閉じたまま（だれも管理者になれない）。

# 出し方

この作業環境（Claude Code のクラウド）では、`wrangler deploy` と `cf deploy` の静的ファイルのアップロードが 401 になる。アップロード専用の一時トークンを、環境のプロキシが API トークンで上書きするため（2026-09-29 に確認）。

| 方法 | すること |
| --- | --- |
| Cloudflare の Git 連携（おすすめ） | ダッシュボードの Workers & Pages で、このリポジトリのブランチを取り込む。ビルドは `pnpm build`、出すのは `npx wrangler deploy` |
| 手元の PC | `CLOUDFLARE_API_TOKEN` を入れて `pnpm deploy` |
