---
type: Design
title: デザインの原則
description: 見た目はあたたかい手描きのスケッチブック、操作はまじめ。遊びは足し算、読みやすさと速さは引かない。
tags: [design]
generated: { by: claude-code/2.1.284, at: 2026-09-29T09:20:00Z }
---

# 原則

| 原則 | 具体的には |
| --- | --- |
| あたたかく | 画用紙・手描きの線・水彩のにじみ・マスキングテープ・らくがき（[sketchbook-style](/design/sketchbook-style.md)） |
| 作品が主役 | 持ち主の絵と写真がいちばん目立つ。飾りは余白に |
| 操作はまじめに | 押せる範囲 44px 以上、現在地の表示、太い点線のフォーカス、Esc で閉じる |
| いつでも整頓できる | 整頓モード（`html.tidy`）で傾き・3D・自由配置・動きを止める |
| 順番は変えない | 見た目の位置を変えても、HTML の順番（読み上げ・Tab）は変えない |
| 速さも見た目のうち | 動かすのは `transform` と `opacity` だけ。日本語の Web フォントは 1 つ（[performance](/architecture/performance.md)） |

# トークン

色・影・傾きの強さ（`--wobble`）・ばねは `src/styles/theme.css` の `:root` にまとめる。傾きと 3D の角度には必ず `var(--wobble)` を掛ける。
