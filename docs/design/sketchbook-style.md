---
type: Design
title: スケッチブックの見た目
description: クリーム色の画用紙に、手描きの線・水彩のにじみ・マスキングテープ・写真コーナーで貼る、あたたかい見た目の決まり。
tags: [design, visual]
generated: { by: claude-code/2.1.284, at: 2026-09-29T10:00:00Z }
sources:
  - id: mockup
    resource: https://claude.ai/artifact/Tt3s6BFKnYQkxLzD4GZjBT
    title: デザインのキャンバス（Sketchbook.dc.html）
---

# ひとことで

**スケッチブックに、描いた絵と好きなものを貼って、余白にらくがきをしたページ。** 見本はデザインのキャンバスの「あたたかい案」。

# 色（`src/styles/theme.css` の `:root`）

| トークン | 昼 | 夜（夜のスケッチブック） | 用途 |
| --- | --- | --- | --- |
| `--color-bg` | `#efe6d2` | `#1d1a17` | 机（ページの外） |
| `--color-paper` | `#f8f2e4` | `#26221e` | 画用紙（ページ） |
| `--color-surface` | `#fffdf8` | `#2f2a25` | 貼った紙・写真のふち |
| `--color-text` | `#3b3128` | `#efe6d6` | インク（本文） |
| `--color-muted` | `#6b5b4d` | `#c9bba8` | 鉛筆（補足） |
| `--color-accent` | `#b5543c` | `#f0a58a` | 赤ペン（手書きメモ・現在地の丸） |
| `--wash-lilac` | `rgb(201 182 228 / 0.35)` | `rgb(201 182 228 / 0.10)` | 水彩のにじみ（紫陽花・夕暮れ） |
| `--wash-peach` | `rgb(242 168 138 / 0.28)` | `rgb(242 168 138 / 0.08)` | 水彩のにじみ（夕焼け） |
| `--wash-sage` | `rgb(169 191 154 / 0.22)` | `rgb(169 191 154 / 0.07)` | 水彩のにじみ（葉） |
| `--crayon-yellow` / `--crayon-blue` / `--crayon-pink` / `--crayon-sage` | `#f4d58d` / `#cfe0f3` / `#eeb4b4` / `#cfe0c3` | 同じ（上に乗る文字は `#3b3128`） | ボタン・テープ・シール |
| `--crayon-peach` / `--crayon-lilac` | `#f5c9b0` / `#ddd0ef` | 同じ | 古い色名（`--c-orange`・`--c-purple`）の行き先 |
| `--crayon-ink` | `#3b3128` | 同じ | クレヨンの上に乗る文字。夜も暗いまま |
| `--hl-yellow` / `--hl-blue` / `--hl-pink` / `--hl-sage` | クレヨンと同じ色 | 同じ色を 24〜30% に透かす | 文字の下に引く蛍光ペン（夜は文字が明るいので、透かして読めるようにする） |
| `--hl-line` | `#e9a23b` | 同じ | `HandTitle` の下線 |
| `--paper-grain` / `--rule-line` / `--rule-margin` | 昼夜で別の値 | | 紙の質感・罫線ノートの青い線と赤い余白線 |
| `--ring-a` / `--ring-b` / `--ring-hole` | 金具のふち・ハイライト・穴 | 暗い金具 | 上端のリング綴じ |
| `--font-body` | `system-ui, "Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", sans-serif` | 同じ | 本文・ボタン・メニュー |
| `--font-heading` | `var(--font-hand)`（Klee One 600） | 同じ | 見出し |
| `--hand-radius` / `--hand-radius-alt` | いびつな角の 2 種類 | 同じ | 手描きの枠・ボタン |

- 色は持ち主の絵と写真（夕暮れのロンドン・夕焼けの海・紫陽花）から取った
- 夜の値は `@media (prefers-color-scheme: dark)` の `:root:not(.light)` と `:root.dark` の 2 か所に書く（`light-dark()` は使わない。Chromium が取り直さないため）
- 文字と背景のコントラストは 4.5:1 以上（赤ペン `#b5543c` × 画用紙で約 4.7）。水彩のにじみの上に直接置く小さな文字は、赤ペンではなくインク色にする（にじみの上では約 3.9 に下がるため）
- 古い色名（`--c-pink`・`--c-yellow`・`--c-cyan`・`--c-green`・`--c-orange`・`--c-purple`・`--c-ink`・`--color-brand`・`--color-border`）は、まだ置きかえていないカードなどのために新しい色へ向けてある。新しい所では使わない

# 文字（[fonts](/decisions/fonts.md)）

| 役割 | 書体 |
| --- | --- |
| 本文・ボタン・メニュー | 端末の日本語フォント（`system-ui` と日本語の総称の並び）。Web フォントは読み込まない |
| 見出し・手書きメモ・吹き出し・サイト名 | **Klee One 600 だけ**（日本語の Web フォントは 1 書体 1 太さ） |
| コード | 端末の等幅フォント |

# 線と形

| 部品 | 作り方 | 重さ |
| --- | --- | --- |
| 手描きの枠 | `border: 2px solid` ＋ いびつな `border-radius`（例 `255px 15px 225px 15px / 15px 225px 15px 255px`） | 0（CSS だけ） |
| 手描きの丸・下線・らくがき | インライン SVG の `path`（`stroke-linecap: round`）。飾りは `aria-hidden` | 小 |
| 蛍光ペンの下線 | SVG の太い線、`opacity: 0.75` | 小 |
| 紙の質感・水彩のにじみ | `body` の固定背景（`radial-gradient` の重ね）。動かさない | 0（1 回だけ描く） |
| リング綴じ | ページ上端の繰り返し背景 | 0 |
| 影 | 影用の要素（疑似要素）を置き、`opacity` だけを動かす。`filter: drop-shadow` は動く要素に使わない | 0 |

# 共通パーツ（`src/styles/theme.css`）

| クラス | 見た目 |
| --- | --- |
| `.hand-frame`（`--alt`） | 手描きの枠（2px の線・いびつな角） |
| `.btn-label`（`--alt`） | クレヨンで塗った手描きの枠のボタン。押すと少し小さくなる（`scale` だけ） |
| `.tape` | 淡い縞のマスキングテープ。色は `--tape-color` |
| `.photo-corners` | 写真の 4 すみの三角。色は `--corner-color` |
| `.paper`（`--ruled`） | 貼った紙。罫線ノートは青い罫線と赤い余白線つき |
| `.marker` | 蛍光ペンで引いた強調。色は `--marker` |
| `.label-tape` | 手描きの枠に黄色を塗った小見出しのラベル |
| `.prose` | 本文。見出しは蛍光ペンでなぞり、引用は黄色のふせん、写真は白いふち |
| `HandTitle`（部品） | Klee One 600 の大見出し ＋ 蛍光ペンの下線。下線は `scale` だけで引かれる |

- ページの背景（画用紙・水彩のにじみ・紙の質感）は `body::before` の固定レイヤー 1 枚。上端のリング綴じは `Base.astro` の `.binding`（繰り返し背景）
- 現在のページは、メニューの文字を赤ペンの手描きの丸（`aria-hidden` の SVG）で囲む。`aria-current="page"` はリンクに付いたまま

# 部品の置きかえ（第 1 段階の見た目から）

| 前 | スケッチブック |
| --- | --- |
| 切り抜き文字のタイトル（`RansomTitle`） | Klee One のサイト名 ＋ 蛍光ペンの下線（`HandTitle`） |
| 方眼ノートの背景 | 画用紙 ＋ 水彩のにじみ ＋ 上端のリング綴じ |
| ラベルシールのメニュー | 手書きの文字。今いるページは赤ペンの丸で囲む |
| テープ付きポラロイド | 白いふちの写真 ＋ 写真コーナー（4 すみの三角）か、マスキングテープ（淡い縞） |
| M3E の形の切り抜き（クッキーなど） | 残す。ふちは細い手描きの線 |
| コードの印刷用紙 | 罫線ノート（左に赤い余白線、下が破れた紙。破れは `clip-path`、影は別の要素） |
| 絵文字のステッカー | 手描きのらくがき（星・矢印・ハート・うずまき）。絵文字は使わない |
| 太い見出し書体 | Klee One 600 |

# 変えないもの

- 3D の机・裏返し・ばね・形の変形・整頓モード・FAB（[desk-3d](/design/desk-3d.md)・[flip-cards](/design/flip-cards.md)・[motion-m3e](/design/motion-m3e.md)）
- 押せる範囲 44px 以上、太い点線のフォーカス（色は赤ペン）
