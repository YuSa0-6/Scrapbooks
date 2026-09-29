---
type: Architecture
title: 並べ方の公開プラグイン
description: 持ち主がボードで並べた位置を、絵とコードの board_x / board_y に書き込んで公開する sandboxed プラグイン。
tags: [architecture, plugin, sandbox]
generated: { by: claude-code/2.1.284, at: 2026-09-29T08:20:00Z }
---

# なぜ sandboxed か

EmDash のプラグインレジストリで配れる形（sandboxed）で作り、Worker Loader の隔離された中で動かす。サイトの権限すべてではなく、宣言した権限（`content:read`・`content:write`・`content:publish`）だけを持つ。

# 場所と作り方

| 項目 | 内容 |
| --- | --- |
| 場所 | `plugins/board-layout/`（pnpm ワークスペースのパッケージ） |
| ひな形 | `emdash-plugin init`（`@emdash-cms/plugin-cli`） |
| ビルド | `emdash-plugin build` で `dist/` を作る。サイトの `predev`・`prebuild`・`pretypecheck` が先に実行する |
| 登録 | `astro.config.mjs` の `sandboxed: [boardLayout]`（ビルドされた descriptor をそのまま渡す）と `sandboxRunner: sandbox()` |
| Worker Loader | `wrangler.jsonc` の `worker_loaders: [{ binding: "LOADER" }]` |

# ルート

| ルート | 公開 | 権限 | 入力 | すること |
| --- | --- | --- | --- | --- |
| `save` | 非公開（`POST` のみ） | `content:publish_any`（EmDash の権限。編集者以上） | `{ items: [{ collection: "projects" \| "snippets", id: ULID, x: 0〜100, y: 0〜20000 }] }`（最大 100 件） | 各項目の `board_x` / `board_y` を書き換えて公開する |

- 入力はハンドラの中で検証する。1 つでも正しくなければ、何も書かずに `{ ok: false, error: "INVALID_INPUT" }` を返す
  - コレクション名は `projects` と `snippets` だけ、`id` は ULID の形、`x` は 0〜100 の整数、`y` は 0〜20000 の整数、同じカードは 1 回だけ
  - 整数への丸めは送る側（`src/scripts/board/publish.ts`）が行う
- 1 件ずつ `getVersioned` → `update`（`board_x` / `board_y`）→ `getVersioned` → `publish`（`_rev` を渡す）。更新で版が進むため、公開の直前に取り直す
- 公開前の下書きは触らない（結果は `NOT_PUBLISHED`）。ここで公開してしまわないため
- 結果は `{ ok, saved: [id], failed: [{ id, reason }] }`。失敗した件は理由の符号を返し、ほかは続ける
- ブラウザからは `X-EmDash-Request: 1` を付けて `POST /_emdash/api/plugins/board-layout/save`

# 開発サーバーでの動かし方

開発サーバー（`pnpm dev`）でも、sandboxed のまま Worker Loader（workerd）で動く。in-process への切り替えは使っていない。
