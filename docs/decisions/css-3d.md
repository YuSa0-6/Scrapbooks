---
type: Decision
title: 3D は CSS の 3D 変形で作る
description: 3D の机と裏返しは CSS の perspective と transform で作り、WebGL（three.js など）は使わない。
tags: [decisions, 3d, performance]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# 結論

3D は CSS の `perspective`・`translateZ`・`rotateX/Y` だけで作る。WebGL は使わない。

# 理由

| 比べたこと | CSS 3D | WebGL（three.js） |
| --- | --- | --- |
| 追加の JS | 0KB | 約 150KB 以上（gzip） |
| 文字・リンク・読み上げ | そのまま HTML | 別に作り直しが必要 |
| 動き | GPU で合成（transform のみ） | 毎フレーム描画 |
| 整頓モード | CSS 変数を 0 にするだけ | 別の画面が必要 |

作品（絵とコード）は HTML のまま見せたいので、HTML を奥行きに並べる CSS 3D が合う。
