---
type: Task List
title: 第 3 段階の作業
description: スケッチブックの見た目に変え、書体を絞って性能の予算を決め直し、持ち主の好きなものを載せる。
tags: [tasks]
generated: { by: claude-code/2.1.284, at: 2026-09-29T10:00:00Z }
---

# 作業

| # | 作業 | 仕様 | 触るファイル |
| --- | --- | --- | --- |
| 1 | 見た目の土台と書体 | [sketchbook-style](/design/sketchbook-style.md)・[fonts](/decisions/fonts.md)・[performance](/architecture/performance.md) | `src/styles/theme.css`、`astro.config.mjs` の fonts、`config/slim-fonts.mjs`、`src/layouts/Base.astro`、`src/components/HandTitle.astro`（新規。`RansomTitle` を置きかえ）、各ページの見出しの部分、`src/components/Board.astro` の案内文、`scripts/perf.mjs` の予算 |
| 2 | 好きなものと項目の追加 | [favorites](/architecture/favorites.md) | `seed/seed.json`（スキーマ）、`scripts/load-favorites.mjs`（新規）、`package.json` の scripts、`src/pages/about.astro` の似顔絵 |
| 3 | カードと部品の見た目 | [sketchbook-style](/design/sketchbook-style.md)・[cards](/architecture/cards.md)・[flip-cards](/design/flip-cards.md) | `src/components/ArtCard.astro`・`CodeCard.astro`・`FlipCard.astro`・`FabMenu.astro`、`src/plugins/sticker/astro/Sticker.astro`、詳細ページ・about・contact・404 の見た目 |
| 4 | 全体の確認 | 予算・a11y・docs | 直すための最小限、docs、README（持ち主の写真が写った画像は入れない） |
| 5 | 公開 | [deploy](/guides/deploy.md) | Cloudflare の Git 連携（持ち主の操作が要る） |

# 進み具合

| # | 状態 | メモ |
| --- | --- | --- |
| 1 | 完了 | Klee One 600 だけの書体、スケッチブックの色トークンと共通パーツ、`Base.astro` の画用紙・リング綴じ・手書きのメニュー、`HandTitle`。表紙の長いタスクは約 790ms（3 書体のときは 1434〜1784ms）。予算は 950ms |
