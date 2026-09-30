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

# 見た目（`Sticker.astro`）

| 形 | 作り方 |
| --- | --- |
| 丸・クッキー・おひさま・お花 | 影・手描きの線・淡いクレヨン色の 3 層。どれも同じ形の `clip-path` で、ホバーで同時に別の形へ変形する。線の層は少し大きい。文字は Klee One で、クレヨンの上に乗る濃い色 |
| 吹き出し | 手描きの枠（`--hand-radius-soft`）、紙の色、クレヨン色のずらした影。しっぽも同じ線 |
| ラベル | マスキングテープ。淡い縞と、切れた端のぎざぎざ（`clip-path`） |

- 色の選択肢（`options.ts`）は `--crayon-*` のトークンを指す
- `filter: drop-shadow` は使わない。角がめくれる動き（`rotate3d`）は幅 761px 以上・細かく指せる入力・動きを減らさない設定のときだけで、角度には `--wobble` を掛ける
