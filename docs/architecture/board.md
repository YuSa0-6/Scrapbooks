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
- 画像の読み込みで高さが変わったときは、`ResizeObserver` でボードの高さだけ直す

# ドラッグ

- `pointer: fine` のときだけ。6px 動いたらドラッグ開始、直後のクリックは打ち消す
- ドラッグ中は `translateZ(60px)` で手前に浮かせ、影の要素の `opacity` を上げる。離すと `--spring` で戻る

# 3D の机（[desk-3d](/design/desk-3d.md)）

- `.board-wrap` に `perspective`、`.board.is-free` に `transform: rotateX(var(--rx)) rotateY(var(--ry))`
- `--rx` / `--ry` は pointermove を `requestAnimationFrame` でまとめ、目標値に少しずつ近づける（lerp）。近づき切ったらループを止める

# 公開（持ち主だけ）

ログインしている管理者には、FAB に「この並べ方を公開する」が出る。押すと [並べ方の公開プラグイン](/architecture/board-layout-plugin.md) に位置を送る（送る処理は [Effect](/architecture/effect.md) の Micro）。
