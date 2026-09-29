---
type: Decision
title: 書体の数を絞る
description: 日本語の Web フォントは Klee One 600 の 1 つだけにし、本文は端末の日本語フォントで出す。
tags: [decisions, performance, fonts]
generated: { by: claude-code/2.1.284, at: 2026-09-29T09:20:00Z }
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
