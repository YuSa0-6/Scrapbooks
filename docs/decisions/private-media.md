---
type: Decision
title: 持ち主の写真と絵の置き場所
description: 持ち主の写真・絵は公開リポジトリに入れず、.private-media/（gitignore）から EmDash の API で読み込む。
tags: [decisions, privacy]
generated: { by: claude-code/2.1.284, at: 2026-09-29T11:00:00Z }
verified: { by: "human:YuSa0-6", at: 2026-09-29T10:40:00Z }
---

# 結論

| 項目 | 決めたこと |
| --- | --- |
| 置き場所 | `.private-media/`（gitignore）。公開リポジトリには入れない |
| サイトへの載せ方 | `scripts/load-favorites.mjs`（[favorites](/architecture/favorites.md)）で EmDash の API から入れる。本番は公開のあと、同じスクリプトかトークンつきの管理画面で入れる |
| 写真が写ったもの | README などのスクリーンショットにも入れない。見本だけのデータで撮る |
| 油絵 | 右の「夕焼けの海」が持ち主の作品。説明に「描いた」と書く。左の「夕暮れのロンドン」は別の人の作品なので、単独の作品としては載せず、アトリエの写真の中に写るだけにする（キャプションで作者が違うことを書く） |

# 理由

2026-09-29 に持ち主が「写真は一旦入れないで OK。油絵は右が自分」と答えた。

# まだ決まっていないこと

- ダムの写真（人の後ろ姿）を公開サイトに載せるか。今は開発用のサイトにだけ入れている
