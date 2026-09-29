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
| `src/components/ArtCard.astro` | 絵のカード（白いふちの写真／形に切り抜いた絵）と、罫線の紙の裏 |
| `src/components/CodeCard.astro` | コードのカード（罫線ノートの切れ端。抜粋／動く様子） |
| `src/components/FlipCard.astro` | 表と裏を持つ入れ物と「裏返す」ボタン（両方のカードで使う）。面の紙 `.flip-sheet` の見た目もここで決める |
| `src/scripts/flip.ts` | 裏返しボタンの動き（`aria-pressed`・`inert` の切り替え） |

# 決まり

- カード全体のリンク：タイトルの `<a>` に `::after { inset: 0 }` を付けて広げる。ボタンはその上（`z-index`）に置く
- 裏返し：[flip-cards](/design/flip-cards.md) のとおり
- 絵の裏の 2 枚目：`ArtCard` の `backImage`（`projects.back_image`）。`Board.astro` と各ページのデータの受け渡しに `backImage` を足した。alt は画像の alt
- 面は `grid` の同じマスに重ねる。高いほうの面がカードの高さを決めるので、裏返しても高さは変わらない
- 面の紙は `.flip-sheet`。右下のボタンに隠れないよう、面の下に `--flip-btn-space`（56px）を空ける。切り抜きのシールのように紙を貼らない面は `.flip-sheet--bare`
- ホバーの影は、紙の `::before` に `--shadow-lift` を置いて `opacity` だけを動かす。`box-shadow` そのものは動かさない
- 絵の写真の留め方：`mountFor(dbId)` が id から「マスキングテープ」か「写真コーナー」を決める（表示のたびに変わらない）。テープは記事（`article`）の `.tape`、コーナーは写真を包む `.card-photo` の `.photo-corners`。コーナーを見せるため、`.card-photo` に `overflow: hidden` を付けない
- 絵の裏：罫線の間隔と文字の行の高さを 28px にそろえ、左の赤い余白線の右から書く。`back_image` は 8 行ぶんの高さ（224px）で、余白線の上にも貼る
- コードのカードの紙と影：`clip-path` は自分の `box-shadow` を切るので、面（`.code-sheet`、`flip-sheet--bare`）の疑似要素 2 枚で作る。`::after` が破れた紙（`clip-path: var(--paper-tear)`、罫線と赤い余白線）、`::before` が同じ形の影（ずらして、`opacity` だけ動かす）。罫線の間隔と行の高さは 24px。動く様子の枠は 8 行、抜粋は 9 行＋「…」
- 回る箱の直接の子（面 `.flip-face`）には `clip-path` などを付けない。紙の形は、その中の `.flip-sheet` の疑似要素に付ける
- 裏の「詳しく見る」リンク：裏返すと表のタイトルのリンクが `inert` になるため、どのカードの裏にも置く
- 裏返しボタンは `html.js` のときだけ表示する（JS なしでは押せないボタンを置かない）
- 切り抜きの絵（ArtCard の `.die`）は 4 つの層を重ねる：影（`.die-shadow`：同じ形をずらした半透明の層）・手描きの線（`.die-line`：同じ形をさらに大きくして、わずかに傾けた層）・ふち（`.die-edge`：同じ形を少し大きくした紙の色の層）・写真（`.photo-shape`）。線を傾けるので、ふちとの間が均一にならず手で引いた線に見える（整頓モードでは傾きが 0 になり同じ中心に重なる）。`filter: drop-shadow` は使わない。写真の形は変形させない
- 切り抜きの絵の表は、絵を面の縦の真ん中に置き、題名の紙を下に寄せる（裏のほうが高くても、裏返しボタンが紙のそばに来る）
- 切り抜きシールの下の紙（`.card-body`）は傾けない。`rotate` が包含ブロックを作り、タイトルの `::after` が面いっぱいに広がらなくなるため
- View Transitions の名前（`view-transition-name`）は表の写真／コードに付ける（詳細ページへの移り変わり）
