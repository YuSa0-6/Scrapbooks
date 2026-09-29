---
type: Decision
title: Effect の分け方
description: サーバーはフルの effect、ブラウザは必要なときだけ effect/Micro を読み込む。
tags: [decisions, effect, performance]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# 結論

| 場所 | 使うもの | 大きさ（gzip） |
| --- | --- | --- |
| サーバー（Worker） | `effect` | 約 74KB（Worker の上限 10MB に対して小さい） |
| ブラウザ | `effect/Micro`、管理者の操作のときだけ `import()` | 約 11KB |

# 理由

2026-09-29 に esbuild で同じ保存処理（再試行・時間切れ付き）を比べた。フルの `effect` は 224KB（gzip 74KB）、`Micro` は 31KB（gzip 11KB）。見る人の JS 予算（[performance](/architecture/performance.md)）を守るため、見る人には読み込ませない。
