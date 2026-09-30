---
type: Decision
title: 書体の数を絞る
description: 日本語の Web フォントは Klee One 600 の 1 つだけにし、本文は端末の日本語フォントで出す。
tags: [decisions, performance, fonts]
generated: { by: claude-code/2.1.284, at: 2026-09-29T10:00:00Z }
---

# 結論

| 役割 | 書体 |
| --- | --- |
| 本文 | 端末の日本語フォント（Web フォントなし） |
| 見出し・手書き | Klee One 600（`config/slim-fonts.mjs` で漢字の面を絞る） |

# 理由

- 作業 6 の測定で、日本語の Web フォント 3 書体（Dela Gothic One・Zen Maru Gothic・Yomogi）が、CPU 4 倍遅くした読み込みの長いタスクの大半を占めた（フォントを外すと表紙が約 1400ms → 約 570ms）
- 書体を 1 つにすれば、フォントの面の数がおよそ 1/3 になる
- 長いタスクの予算は、この構成で測り直して決め直す（[performance](/architecture/performance.md)）

## 実測（第 3 段階の作業 1）

同じ環境（ヘッドレス Chromium・390px・CPU 4 倍遅く）で、本番ビルドを 3 回ずつ測った。

| 項目 | 前（3 書体） | 後（Klee One 600 だけ） |
| --- | --- | --- |
| 表紙の長いタスク（3 回） | 1434・1529・1784ms | 764・787・791ms |
| ほかのページの長いタスク | 801〜1238ms | 292〜609ms |
| 表紙の CLS | 0.021 | 0.000 |
| `dist/client/_astro/fonts` のファイル数 | 148 | 49 |
| 表紙の `@font-face` | 約 110 枚 | 36 枚 |
| 表紙の HTML | 約 143KB | 約 103KB |

- 太さを 1 つ（600）にしたので、太字の合成（疑似ボールド）も起きない。見出しの `font-weight` は `--font-weight-heading`（600）にそろえる
- 長いタスクの予算は 1800ms から 950ms に決め直した
