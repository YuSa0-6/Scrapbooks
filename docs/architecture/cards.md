---
type: Architecture
title: カード
description: 絵（ArtCard）とコード（CodeCard）のカード。全体がリンクで、裏返しボタンを持つ。
tags: [architecture, cards]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# ファイル

| ファイル | 役割 |
| --- | --- |
| `src/components/ArtCard.astro` | 絵のカード（ポラロイド／形に切り抜いたシール） |
| `src/components/CodeCard.astro` | コードのカード（抜粋／動く様子） |
| `src/components/FlipCard.astro` | 表と裏を持つ入れ物と「裏返す」ボタン（両方のカードで使う） |
| `src/scripts/flip.ts` | 裏返しボタンの動き（`aria-pressed`・`inert` の切り替え） |

# 決まり

- カード全体のリンク：タイトルの `<a>` に `::after { inset: 0 }` を付けて広げる。ボタンはその上（`z-index`）に置く
- 裏返し：[flip-cards](/design/flip-cards.md) のとおり
- 切り抜きの絵：白いふちは「同じ形を少し大きくした白い層」、影は「同じ形をずらした半透明の層」で描く。`filter: drop-shadow` は使わない。写真の形は変形させない
- View Transitions の名前（`view-transition-name`）は表の写真／コードに付ける（詳細ページへの移り変わり）
