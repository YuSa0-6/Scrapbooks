---
type: Architecture
title: 動くコード
description: runnable な HTML のコードを sandbox iframe で動かす。見えている間だけ読み込み、見えなくなったら止める。
tags: [architecture, performance, security]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# 安全

- `<iframe sandbox="allow-scripts" srcdoc="…">`。`allow-same-origin` は付けない（サイトの Cookie や DOM に触れさせない）
- 書けるのは管理画面の編集者だけ（`snippets.code`）

# 見えている間だけ動かす

| 状態 | すること |
| --- | --- |
| 画面に 10% 以上入った | `srcdoc` を入れて動かす |
| 画面から出た | `srcdoc` を空にして止める（`requestAnimationFrame` のループも止まる） |
| タブが隠れた（`visibilitychange`） | すべて止める。戻ったら見えているものだけ再開 |
| 裏返して `inert` な面に入った | 止める。表に戻ったら再開（`card:flip` イベントで知る） |

- 実装は `src/scripts/live-frames.ts`。1 つの `IntersectionObserver` で全部を見る
- HTML には `data-srcdoc` として持たせ、`srcdoc` 属性は最初は付けない
- 詳細ページの大きな実行画面も同じ仕組みを使う。「もう一度」ボタンは `reloadLiveFrame()`（いったん空にして入れ直す）
- 裏返しは `src/scripts/flip.ts` が `card:flip`（`.flip` から `bubbles: true` で送る `CustomEvent`）で知らせる。`IntersectionObserver` は面の入れ替わりに気づかないため
