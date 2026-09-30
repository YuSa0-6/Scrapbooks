---
type: Architecture
title: 初期設定のロック
description: 本番では、合言葉（SETUP_KEY）を知っている人だけが EmDash の初期設定を進められる。
tags: [architecture, security]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# 困ること

EmDash は、初期設定が終わるまで「最初に管理画面を開いた人」が管理者を作れる。公開した直後に知らない人が管理者になれてしまう。

# 仕組み（`src/middleware.ts`）

| リクエスト | 本番での扱い |
| --- | --- |
| `/_emdash/api/setup/*`（`status` を除く） | Cookie `scrapbook_setup` が Worker の秘密 `SETUP_KEY` と一致しないと 403 |
| `/_emdash/admin*?setup_key=…` | 合言葉が一致したら Cookie を付けて、同じ URL（クエリなし）へ移動 |
| `SETUP_KEY` が未設定 | 初期設定は一切できない（閉じた側に倒す） |

- 初期設定の前は、EmDash 自身のミドルウェア（`order: "pre"`）が先に動き、`/_emdash/admin` をクエリを落として `/_emdash/admin/setup` へ移す。そのため、合言葉つきの URL は **`/_emdash/admin/setup?setup_key=…`** の形で開く（ロック側は `/_emdash/admin*` のどれでも `setup_key` を受けて Cookie を付ける）
- 開発中（`import.meta.env.DEV`）はロックしない
- 比べるときは長さをそろえた定数時間の比較にする
- 秘密は `cf` で Worker に入れる（[公開の手順](/guides/deploy.md)）
