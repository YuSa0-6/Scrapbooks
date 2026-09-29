---
type: Decision
title: cf CLI の使い方
description: Cloudflare の操作は cf（1.0.0-beta）で行い、Worker のアップロードだけは Astro が対応している wrangler を使う。
tags: [decisions, cloudflare, tooling]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
sources:
  - id: cf-blog
    resource: https://blog.cloudflare.com/cloudflare-cf-cli-launch/
    title: "Introducing cf: the agentic CLI for the entire Cloudflare API"
---

# 結論

| 作業 | 使うもの |
| --- | --- |
| D1・R2 の作成、秘密の登録、Worker の確認・ログ | `cf`（devDependency に固定） |
| 開発サーバー | `pnpm dev`（Astro）。`cf dev` も Astro の dev を呼ぶ |
| Worker のアップロード | `wrangler deploy`（`pnpm deploy`） |

# 理由

- 2026-09-29 に `cf migrate` を別の作業ツリーで試した。移行そのものは成功したが、`cf deploy` が Build Output Specification（`.cloudflare/output/v0/config.json`）を求め、Astro の Cloudflare アダプターはそれを出さないため失敗した
- `cf` は beta なので、Astro が対応したら `cf deploy` に切り替える
