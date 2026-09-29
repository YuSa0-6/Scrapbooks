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
| `src/components/FlipCard.astro` | 表と裏を持つ入れ物と「裏返す」ボタン（両方のカードで使う）。面の紙 `.flip-sheet` の見た目もここで決める |
| `src/scripts/flip.ts` | 裏返しボタンの動き（`aria-pressed`・`inert` の切り替え） |

# 決まり

- カード全体のリンク：タイトルの `<a>` に `::after { inset: 0 }` を付けて広げる。ボタンはその上（`z-index`）に置く
- 裏返し：[flip-cards](/design/flip-cards.md) のとおり
- 絵の裏の 2 枚目：`ArtCard` の `backImage`（`projects.back_image`）。`Board.astro` と各ページのデータの受け渡しに `backImage` を足した。alt は画像の alt
- 面は `grid` の同じマスに重ねる。高いほうの面がカードの高さを決めるので、裏返しても高さは変わらない
- 面の紙は `.flip-sheet`。右下のボタンに隠れないよう、面の下に `--flip-btn-space`（56px）を空ける。切り抜きのシールのように紙を貼らない面は `.flip-sheet--bare`
- ホバーの影は、紙の `::before` に `--shadow-lift` を置いて `opacity` だけを動かす。`box-shadow` そのものは動かさない
- 裏の「詳しく見る」リンク：裏返すと表のタイトルのリンクが `inert` になるため、どのカードの裏にも置く
- 裏返しボタンは `html.js` のときだけ表示する（JS なしでは押せないボタンを置かない）
- 切り抜きの絵（ArtCard の `.die`）は 3 つの層を重ねる：影（`.die-shadow`：同じ形をずらした半透明の層）・白いふち（`.die-edge`：同じ形を少し大きくした白い層）・写真（`.photo-shape`）。`filter: drop-shadow` は使わない。写真の形は変形させない
- 切り抜きシールの下の紙（`.card-body`）は傾けない。`rotate` が包含ブロックを作り、タイトルの `::after` が面いっぱいに広がらなくなるため
- View Transitions の名前（`view-transition-name`）は表の写真／コードに付ける（詳細ページへの移り変わり）
