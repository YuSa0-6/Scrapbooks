---
type: Policy
title: 性能の予算
description: 表紙と詳細ページで守る数値と、測り方（scripts/perf.mjs）。
tags: [architecture, performance]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# 予算

| 項目 | 条件 | 予算 |
| --- | --- | --- |
| ページの JS（gzip、サイト本体のみ） | 表紙 | 25KB 以下 |
| ページの JS（gzip） | そのほかのページ | 15KB 以下 |
| CLS | 390px・CPU 4 倍遅く | 0.05 以下 |
| 長いタスク（50ms 超）の合計 | 390px・CPU 4 倍遅く・読み込みから 5 秒 | 300ms 以下 |
| フレーム時間の p95 | 1280px・ドラッグ／シャッフル／視差の間 | 20ms 以下 |
| 画面外の動くコード | 表紙を一番上に戻した状態 | iframe の `srcdoc` が空 |

# 測り方

`pnpm perf`（`scripts/perf.mjs`）が開発サーバー（`http://127.0.0.1:4321`）に Playwright でつないで測り、表にして出す。予算を超えたら終了コード 1。

# 記録

| 日付 | 表紙 JS | CLS（表紙） | 長いタスク（表紙） | ドラッグ p95 | メモ |
| --- | --- | --- | --- | --- | --- |
| （ベースライン） | | | | | 変更前の値を `pnpm perf` で記録する |
