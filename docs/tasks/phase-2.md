---
type: Task List
title: 第 2 段階の作業
description: 3D の机と裏返し、性能の改善、並べ方の公開プラグイン、Effect、初期設定のロック、公開。
tags: [tasks]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# 作業

| # | 作業 | 仕様 | 触るファイル |
| --- | --- | --- | --- |
| 1 | 測る道具と基準値 | [performance](/architecture/performance.md) | `scripts/`、`package.json` の scripts |
| 2 | 初期設定のロックと Effect の読み込み | [setup-lock](/architecture/setup-lock.md)・[effect](/architecture/effect.md) | `src/middleware.ts`、`src/lib/content.ts`、`src/pages/**` |
| 3 | ボードの 3D と性能 | [board](/architecture/board.md)・[desk-3d](/design/desk-3d.md) | `src/components/Board.astro`、`src/components/FabMenu.astro`、`src/scripts/board/`、`src/styles/theme.css`、`src/layouts/Base.astro` |
| 4 | 裏返せるカードと動くコード | [cards](/architecture/cards.md)・[flip-cards](/design/flip-cards.md)・[live-code](/architecture/live-code.md) | `src/components/ArtCard.astro`、`CodeCard.astro`、`FlipCard.astro`、`src/scripts/flip.ts`、`src/scripts/live-frames.ts`、`src/pages/code/[slug].astro` の実行画面 |
| 5 | 並べ方の公開プラグイン | [board-layout-plugin](/architecture/board-layout-plugin.md) | `plugins/board-layout/`、`astro.config.mjs`、`wrangler.jsonc`、`pnpm-workspace.yaml`、`src/scripts/board/publish.ts` |
| 6 | 全体の確認 | 予算と型とビルド | — |
| 7 | 公開 | [deploy](/guides/deploy.md) | `wrangler.jsonc` |
