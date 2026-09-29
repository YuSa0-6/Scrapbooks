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
| `pnpm perf` | 性能の予算を測る（開発サーバーが動いている必要あり） |
| `pnpm verify` | typecheck ＋ check:docs |
| `pnpm build` | 本番用のビルド（プラグインのビルドも含む） |

# 見本データ

開発サーバーを起動して http://127.0.0.1:4321/_emdash/api/setup/dev-bypass?redirect=/ を開くと、見本の絵とコードが入り、管理者としてログインする。データを消したいときは `.wrangler/state` を消してから起動し直す。
