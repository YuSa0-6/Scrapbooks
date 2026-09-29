---
type: Architecture
title: ステッカープラグイン
description: 本文（Portable Text）にステッカーのブロックを足す native プラグイン。
tags: [architecture, plugin]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# 仕組み

| 部分 | ファイル |
| --- | --- |
| 登録情報（astro.config から読む） | `src/plugins/sticker/descriptor.ts` |
| 管理画面のブロック定義 | `src/plugins/sticker/index.ts` |
| 表示 | `src/plugins/sticker/astro/Sticker.astro` |

- 本文ブロックの追加は native プラグインだけができるので、サイトの中に置いている（資料：`.agents/skills/creating-plugins/references/portable-text-blocks.md`）
- ブロックの主な値（`id`）がことば。ほかに `shape`・`color`・`decorative`
