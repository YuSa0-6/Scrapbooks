---
type: Architecture
title: 好きなものの読み込み
description: 持ち主の写真と絵を、git に入れずに EmDash の API で読み込む仕組み。
tags: [architecture, content]
generated: { by: claude-code/2.1.284, at: 2026-09-29T11:00:00Z }
---

# 仕組み

| 部分 | 場所 |
| --- | --- |
| 画像と題名の一覧 | `.private-media/`（gitignore）の `*.webp` と `favorites.json` |
| 読み込み | `scripts/load-favorites.mjs`（`pnpm load:favorites`） |
| 使う道具 | EmDash の CLI（`media upload`・`content create/update/get/unpublish`・`taxonomy add-term`）。タグの付け替えだけは CLI に無いので、CLI と同じ `EmDashClient`（`emdash/client`）で API を呼ぶ |
| 認証 | `--token`（または `EMDASH_TOKEN`）があればトークン。なければ開発サーバーの dev-bypass |

# 使い方

| 引数 | 意味 | 既定 |
| --- | --- | --- |
| `--url` | 読み込み先のサイト | `http://127.0.0.1:4321` |
| `--token` | 認証のトークン（本番のとき） | なし（開発用の認証） |
| `--dir` | 画像と `favorites.json` の場所 | `.private-media/` |

- 本番へ入れるときは `pnpm load:favorites -- --url <サイト> --token <トークン>`
- 終わると、画像・絵・そのほかの 3 つの表で「何を入れたか」を出す

# 動き

| # | すること | 何度実行しても同じになる理由 |
| --- | --- | --- |
| 1 | 画像を 1 枚ずつ `media upload` する | 同じファイル名の画像があれば使い回す（表に「使い回し」と出る） |
| 2 | `tag` の term が無ければ日本語のラベルで作る（`drawing`＝らくがき・`painting`＝油絵・`photo`＝写真・`generative`＝ジェネラティブ・`color`＝色） | 同じ slug の term があれば作らない |
| 3 | `projects` に作る（題名・絵・裏の絵・説明・メモ・枠・ギャラリー・タグ） | 同じ slug があれば更新し、中身が同じなら何もしない |
| 4 | `replace_samples` の見本（Unsplash の写真）を下書きに戻す | 消さない。下書きのものは触らない |
| 5 | `pages` の `about` の `avatar` に `fox-mask.webp` を入れる | 同じ画像なら何もしない |

- 表紙は新しい順に並ぶので、`favorites.json` の上にあるものが上に来るよう、下から作る
- 絵の `back_image` があれば、カードの裏に大きく出す（[flip-cards](/design/flip-cards.md)）
- 画像の説明（alt）は `favorites.json` の `alt`・`back_alt` を、項目の値に入れる

# スキーマの追加

| コレクション | 項目 | 型 | 用途 |
| --- | --- | --- | --- |
| `projects` | `back_image` | image（任意） | 裏返したときに出す 2 枚目（お面を外した顔など） |
| `pages` | `avatar` | image（任意） | 「わたしについて」の似顔絵（手描きの丸の中に出す） |

- 新しい環境は `seed/seed.json` から作られるので、最初から項目がある
- すでに動いている開発用の DB へは、seed を流し直さず CLI で足す（[development](/guides/development.md)）
- 画像は長辺 1200〜1600px の WebP、位置情報などのメタデータは消してある
- 持ち主の写真を git に入れるかは確認中（[private-media](/decisions/private-media.md)）
