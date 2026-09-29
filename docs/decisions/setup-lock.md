---
type: Decision
title: 初期設定のロック
description: 本番の初期設定は、Worker の秘密 SETUP_KEY を知っている人だけが進められるようにする。
tags: [decisions, security]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# 結論

`src/middleware.ts` で初期設定の API を合言葉で守る（[setup-lock](/architecture/setup-lock.md)）。

# 理由

- EmDash 1.0.1 の `/_emdash/api/setup/admin` は「利用者が 0 人なら誰でも管理者を作れる」作り（`node_modules/emdash/dist/astro/routes/api/setup/admin.mjs`）
- Cloudflare Access で全体を守る方法もあるが、ポートフォリオは誰でも見られる必要がある
