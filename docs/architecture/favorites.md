---
type: Architecture
title: 好きなものの読み込み
description: 持ち主の写真と絵を、git に入れずに EmDash の API で読み込む仕組み。
tags: [architecture, content]
generated: { by: claude-code/2.1.284, at: 2026-09-29T09:20:00Z }
---

# 仕組み

| 部分 | 場所 |
| --- | --- |
| 画像と題名の一覧 | `.private-media/`（gitignore）の `*.webp` と `favorites.json` |
| 読み込み | `scripts/load-favorites.mjs`（`pnpm load:favorites -- --url <サイト>`） |
| 使う API | EmDash の CLI（`emdash media upload`・`emdash content create/update`）。開発中は dev-bypass、本番はトークン |

# 動き

1. `favorites.json` を読み、画像を 1 枚ずつ `media upload` する（同じファイル名があれば使い回す）
2. `projects` に作る。同じ slug があれば更新する（何度実行してもよい）
3. `back_image` があれば、カードの裏に出す（[flip-cards](/design/flip-cards.md)）
4. `replace_samples` の見本（Unsplash の写真）は下書きに戻して、表に出さない
5. `pages` の `about` の `avatar` に `fox-mask.webp` を入れる

# スキーマの追加

| コレクション | 項目 | 型 | 用途 |
| --- | --- | --- | --- |
| `projects` | `back_image` | image | 裏返したときに出す 2 枚目（お面を外した顔など） |
| `pages` | `avatar` | image | 「わたしについて」の似顔絵 |

- 画像は長辺 1200〜1600px の WebP、位置情報などのメタデータは消してある
- 持ち主の写真を git に入れるかは確認中（[private-media](/decisions/private-media.md)）
