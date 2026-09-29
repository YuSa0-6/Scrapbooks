---
type: Architecture
title: ボード
description: 表紙のボード。自由配置・ドラッグ・シャッフル・3D の机を、transform だけで動かす。
tags: [architecture, board, 3d]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# ファイル

| ファイル | 役割 |
| --- | --- |
| `src/components/Board.astro` | マークアップと見た目（CSS） |
| `src/scripts/board/*.ts` | 配置・ドラッグ・視差・保存のスクリプト（役割ごとに分ける） |
| `src/components/FabMenu.astro` | 右下のメニュー。ボードにイベント（`board:shuffle` など）を送るだけ |

# 配置

| 条件 | 表示 |
| --- | --- |
| 幅 761px 以上・整頓モードでない・JS あり | 自由配置（`.board.is-free`） |
| それ以外 | 格子（`display: grid`） |

- 位置は **`translate`（transform）で置く**。`left` / `top` は 0 に固定し、動かさない
- 位置の優先順位：この端末で動かした位置（localStorage）→ CMS の `board_x` / `board_y` → 自動配置
- 初めの表示で跳ねないように、JS が並べ終わるまでボードを `visibility: hidden` にする。`<head>` の小さなスクリプトで `html.js` を付け、`html.js .board[data-pending]` だけを隠す（JS がなければ格子で見える）
- 幅やカードの高さが変わったとき（画像・フォントの読み込み、画面の幅の変更）は、`ResizeObserver` が見つけて配置をやり直す。動かして保存した位置と CMS の位置はそのまま、自動配置のカードだけが並べ直される。ドラッグ中はやり直さない
- 4 秒たっても JS が並べ終わらないときは、`<head>` のスクリプトが `data-pending` を外し、格子で見えるようにする（保険）

# ドラッグ

- `pointer: fine` のときだけ。6px 動いたらドラッグ開始、直後のクリックは打ち消す
- ドラッグ中は `translateZ(var(--lift-drag))`（60px）で手前に浮かせ、影の要素の `opacity` を上げる。離すと `--spring` で戻る
- ドラッグの直後に来るクリックは打ち消す。クリックが来ないときに次のクリックを消さないよう、80ms で解除する

# 3D の机（[desk-3d](/design/desk-3d.md)）

- 3D は、自由配置・`pointer: fine`・動きを減らす設定なし、の 3 つがそろったときだけ。JS が `.board-wrap` と `.board` に `.is-3d` を付け、CSS の `@media` も同じ条件で守る
- `.board-wrap.is-3d` に `perspective: var(--desk-perspective)`（1800px）、`.board.is-free.is-3d` に `transform: rotateX(...) rotateY(...)`。角度は `--rx` / `--ry`（-1〜1）に `--desk-tilt` と `--wobble` を掛けて決める
- 各カードの奥行きは `transform: translateZ(var(--z) + var(--lift))`。位置の `translate` とは別のプロパティなので、位置のばねと奥行きは別々に動く
- `--rx` / `--ry` / `--z` / `--lift` は `theme.css` で `@property`（`inherits: false`）にしてある。値が変わってもカードの中身のスタイル再計算が起きない
- `--rx` / `--ry` は pointermove を `requestAnimationFrame` でまとめ、目標値に少しずつ近づける（lerp）。近づき切ったらループを止める
- `FabMenu` は `.board-wrap` の外に置く。`perspective` を持つ要素の中では `position: fixed` が効かなくなるため

# 外から使う入り口

`src/scripts/board/index.ts` の `getBoardLayout()` は、今の各カードの位置 `{ collection, id, x, y }[]` を返す。`x` は 0〜100（CMS の `board_x` と同じ意味）、`y` は px。格子表示のときは空の配列。`li` には `data-collection` と `data-piece-id`（`dbId`）が付いている。FAB の項目のうち自由配置のときだけ使うものは `data-free-only` を付けると、格子で隠れる。

# 公開（持ち主だけ）

ログインしている管理者には、FAB に「この並べ方を公開する」が出る。押すと [並べ方の公開プラグイン](/architecture/board-layout-plugin.md) に位置を送る（送る処理は [Effect](/architecture/effect.md) の Micro）。
