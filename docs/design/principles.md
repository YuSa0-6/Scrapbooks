---
type: Design
title: デザインの原則
description: 見た目ははちゃめちゃ、操作はまじめ。遊びは足し算、読みやすさは引かない。
tags: [design]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# 原則

| 原則 | 具体的には |
| --- | --- |
| 見た目は自由に | テープ・ステッカー・傾き・切り抜き文字・3D の奥行き |
| 操作はまじめに | 押せる範囲 44px 以上、現在地の表示、太い点線のフォーカス、Esc で閉じる |
| いつでも整頓できる | 整頓モード（`html.tidy`）で傾き・3D・自由配置・動きを止める |
| 順番は変えない | 見た目の位置を変えても、HTML の順番（読み上げ・Tab）は変えない |
| 速さも見た目のうち | 動かすのは `transform` と `opacity` だけ（[performance](/architecture/performance.md)） |

# トークン

色・影・傾きの強さ（`--wobble`）・ばねは `src/styles/theme.css` の `:root` にまとめる。傾きと 3D の角度には必ず `var(--wobble)` を掛ける。
