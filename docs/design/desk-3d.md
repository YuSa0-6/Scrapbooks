---
type: Design
title: 3D の机
description: 表紙のボードを、少し傾いた机として CSS の 3D 変形で見せる。持ち上げた紙は手前に浮く。
tags: [design, 3d]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# 見え方

| 要素 | 3D の動き |
| --- | --- |
| ボード全体 | `perspective` の中で、ポインターに合わせて最大 ±2.5° 傾く（視差） |
| 貼られた紙 | 重なり順に応じて `translateZ` で数 px ずつ浮く。ホバーで 20px、ドラッグ中は 60px 手前へ |
| 影 | 紙ごとに影用の要素を持ち、浮いた量に合わせて `opacity` と `transform` だけを変える |
| ステッカー | ホバーで角がめくれる（`rotate3d`） |

# 止める条件（1 つでも当てはまれば 3D なし・平らな表示）

- 整頓モード（`html.tidy`）
- `prefers-reduced-motion: reduce`
- 細かく指せない入力（`pointer: coarse`）またはボードが自由配置でない（幅 760px 以下）

# 性能の決まり

- 視差はポインターが動いたときだけ `requestAnimationFrame` で 1 フレームに 1 回更新。止まったら何もしない
- 更新するのは CSS 変数（`--rx` / `--ry`）だけで、変形は `transform` に限る
- `will-change` は操作中の要素にだけ付け、終わったら外す
- `transform-style: preserve-3d` はボードが自由配置のときだけ
- WebGL は使わない（[css-3d](/decisions/css-3d.md)）
