---
type: Architecture
title: Effect の使い方
description: サーバーでの内容の読み込みは Effect、ブラウザでの保存は Effect の Micro で書く。
tags: [architecture, effect, async]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# サーバー（`effect`）

| 場所 | 内容 |
| --- | --- |
| `src/lib/content.ts` | EmDash の読み込み（`getEmDashCollection` など）を Effect にくるむ。失敗は `ContentLoadError`（`Data.TaggedError`）で表す |
| ページ | `Effect.all([...], { concurrency: "unbounded" })` で並行に読み、`Effect.timeout("5 seconds")` を付ける |
| エラー | ページの境目で `runPage`（`src/lib/content.ts`）が 500 の Response に変える |

- Worker の大きさへの影響は小さい（上限 10MB に対して約 70KB）
- `cacheHint` も Effect の結果として返し、ページで `Astro.cache.set` する

# ブラウザ（`effect/Micro`）

- 使うのは「並べ方の公開」だけ（`src/scripts/board/publish.ts`）
- 管理者が FAB の項目を押したときに `import()` で読み込む。見る人には読み込ませない
- `Micro.tryPromise` → `Micro.retry({ times: 2 })` → `Micro.timeout(5000)`
- 大きさは約 11KB（gzip）。フルの `effect` はブラウザに入れない（約 74KB のため）
