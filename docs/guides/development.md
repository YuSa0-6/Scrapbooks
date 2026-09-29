---
type: Playbook
title: 開発の進め方
description: 開発サーバーの起動、見本データの投入、確認のコマンド。
tags: [guides, development]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# コマンド

| コマンド | すること |
| --- | --- |
| `pnpm dev` | 開発サーバー（http://127.0.0.1:4321） |
| `pnpm typecheck` | 型チェック（astro check） |
| `pnpm check:docs` | docs/ が OKF の形になっているか確かめる |
| `pnpm perf` | 性能の予算を測る。`pnpm build` のあと `pnpm preview --host 127.0.0.1 --port 4322` で本番ビルドを動かしておく（見本データは先に開発サーバー 4321 で入れる） |
| `pnpm verify` | typecheck ＋ check:docs |
| `pnpm build` | 本番用のビルド（プラグインのビルドも含む） |
| `pnpm load:favorites` | 持ち主の写真と絵を読み込む。`--url`・`--token` を受ける（[favorites](/architecture/favorites.md)） |

# 見本データ

開発サーバーを起動して http://127.0.0.1:4321/_emdash/api/setup/dev-bypass?redirect=/ を開くと、見本の絵とコードが入り、管理者としてログインする。データを消したいときは `.wrangler/state` を消してから起動し直す。

# 動いている開発用の DB に項目を足す

`seed/seed.json` に項目を足しても、すでにできている DB には反映されない（seed は空の DB にだけ流れる）。開発サーバーを動かしたまま、EmDash の CLI で同じ項目を足す。

```bash
npx emdash schema add-field projects back_image --type image --label "裏の絵（裏返したときに出す）"
npx emdash schema add-field pages avatar --type image --label "似顔絵"
```

- 型は `emdash-env.d.ts` が自動で作り直される
- 作り直してもよいときは、`.wrangler/state` を消して開発サーバーを起動し直し、dev-bypass を開く
