---
type: Playbook
title: 公開の手順
description: cf で D1・R2・秘密を用意し、wrangler で Worker を出す。
tags: [guides, deploy, cloudflare]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# 前提

- Cloudflare の Workers 有料プラン（Worker Loader と 10MB の上限のため）
- 環境変数 `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID`

# 手順

1. D1 と R2 を作る：`cf cli search` で D1 と R2 の作成コマンドを探して実行し、D1 の ID を `wrangler.jsonc` の `database_id` に書く
2. 合言葉を決めて Worker の秘密 `SETUP_KEY` に入れる
3. `pnpm deploy`（ビルドして wrangler でアップロード）
4. `https://<worker>.<subdomain>.workers.dev/_emdash/admin?setup_key=<合言葉>` を開いて初期設定をする
5. 初期設定が終わったら、合言葉は不要になる（EmDash が 2 回目以降の初期設定を断る）
