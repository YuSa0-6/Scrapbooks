---
type: Design
title: M3E の動き
description: Material 3 Expressive のばね（spatial / effects）と形の変形を、CSS のトークンで使う。
tags: [design, motion]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# ばねのトークン

ばねの式を数値計算して `linear()` にしたもの。`src/styles/theme.css` にある。

| トークン | 用途 | 時間 |
| --- | --- | --- |
| `--spring-fast` | 押す・離す・小さな形の変化 | 413ms |
| `--spring` | ホバー・メニュー・裏返し | 477ms |
| `--spring-slow` | シャッフル・大きな移動・形の変形 | 631ms |
| `--fade-fast` | 色・透明度（行き過ぎない） | 197ms |

# 形の変形（シェイプモーフ）

- 形は `src/lib/shapes.ts` が `clip-path: polygon()` で作る。どれも 60 点なので互いに変形できる
- 変形は小さい要素（ステッカー・ボタン）だけ。大きな写真は形を固定し、変形させない（再描画が重いため）

# してはいけないこと

- `left` / `top` / `width` / `height` / `box-shadow` / `filter` を動かす（毎フレーム再計算・再描画になる）
- 影を動かしたいときは、影用の要素を置いてその `opacity` を動かす
