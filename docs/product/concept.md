---
type: Requirement
title: コンセプト
description: 絵とコードを「机の上に広げたスクラップブック」として見せ、触って遊べるポートフォリオにする。
tags: [product]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# 一言でいうと

**机の上に広げた、絵とコードのスクラップブック。** 見た目ははちゃめちゃ、操作はまじめ、動きは速い。

# 誰のためか

| 人 | したいこと |
| --- | --- |
| 持ち主（作者） | 描いた絵・好きなコードを、並べ方ごと自分らしく見せたい。管理画面で並べ方を決めて公開したい |
| 見る人 | 作品を手に取るように眺めたい。スマホでも軽く、迷わず見たい |

# 「遊び道具」を生かすところ

| 遊び道具 | 使い方 |
| --- | --- |
| EmDash の本文ブロック（native プラグイン） | 本文にステッカーを貼る（[sticker-plugin](/architecture/sticker-plugin.md)） |
| EmDash の sandboxed プラグイン（ブログで紹介された仕組み） | ボードの並べ方を CMS に保存して公開する（[board-layout-plugin](/architecture/board-layout-plugin.md)） |
| ボード・ばね・形の変形 | 3D の机・裏返せるカードに発展させる（[desk-3d](/design/desk-3d.md)・[flip-cards](/design/flip-cards.md)） |
| 動くコード | 見えている間だけ動かす（[live-code](/architecture/live-code.md)） |

# 守ること

- 性能の予算（[performance](/architecture/performance.md)）を超える機能は入れない
- 整頓モード・動きを減らす設定・スマホでは、3D と自由配置を止める
- 読み上げと Tab の順番は、いつも HTML の順番のまま
