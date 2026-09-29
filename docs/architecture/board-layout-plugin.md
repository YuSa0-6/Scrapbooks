---
type: Architecture
title: 並べ方の公開プラグイン
description: 持ち主がボードで並べた位置を、絵とコードの board_x / board_y に書き込んで公開する sandboxed プラグイン。
tags: [architecture, plugin, sandbox]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# なぜ sandboxed か

EmDash のプラグインレジストリで配れる形（sandboxed）で作り、Worker Loader の隔離された中で動かす。サイトの権限すべてではなく、宣言した権限（`content:read`・`content:write`・`content:publish`）だけを持つ。

# 場所と作り方

| 項目 | 内容 |
| --- | --- |
| 場所 | `plugins/board-layout/`（pnpm ワークスペースのパッケージ） |
| ひな形 | `emdash-plugin init`（`@emdash-cms/plugin-cli`） |
| ビルド | `emdash-plugin build` で `dist/` を作る。サイトのビルド前に実行する |
| 登録 | `astro.config.mjs` の `sandboxed: [boardLayout()]` と `sandboxRunner: sandbox()` |
| Worker Loader | `wrangler.jsonc` の `worker_loaders: [{ binding: "LOADER" }]` |

# ルート

| ルート | 公開 | 権限 | 入力 | すること |
| --- | --- | --- | --- | --- |
| `save` | 非公開（管理者） | `content:publish` 相当 | `{ items: [{ collection: "projects" \| "snippets", id: ULID, x: 0〜100, y: 0〜20000 }] }`（最大 100 件） | 各項目の `board_x` / `board_y` を書き換えて公開する |

- 入力はハンドラの中で検証する（コレクション名は 2 つだけ許可、数値は整数に丸めて範囲内に収める）
- 1 件ずつ `getVersioned` → 更新 → `publish`（`_rev` を渡す）。失敗した件は結果に理由を返し、ほかは続ける
- ブラウザからは `X-EmDash-Request: 1` を付けて `POST /_emdash/api/plugins/board-layout/save`
