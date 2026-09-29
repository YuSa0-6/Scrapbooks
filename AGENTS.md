This is an EmDash site -- a CMS built on Astro with a full admin UI.

## Commands

```bash
pnpm dev              # Start the Astro dev server
npx emdash types      # Regenerate TypeScript types from a running site
```

The admin UI is at `http://localhost:4321/_emdash/admin`.

## Key Files

| File                     | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `astro.config.mjs`       | Astro config with `emdash()` integration, database, and storage                    |
| `src/live.config.ts`     | EmDash loader registration (boilerplate -- don't modify)                           |
| `seed/seed.json`         | Schema definition + demo content (collections, fields, taxonomies, menus, widgets) |
| `emdash-env.d.ts`        | Generated types for collections (auto-regenerated on dev server start)             |
| `src/layouts/Base.astro` | Base layout with EmDash wiring (menus, search, page contributions)                 |
| `src/pages/`             | Astro pages -- all server-rendered                                                 |

## Skills

Agent skills are in `.agents/skills/`. Load them when working on specific tasks:

- **building-emdash-site** -- Querying content, rendering Portable Text, schema design, seed files, site features (menus, widgets, search, SEO, comments, bylines). Start here.
- **creating-plugins** -- Building EmDash plugins with hooks, storage, admin UI, API routes, and Portable Text block types.
- **emdash-cli** -- CLI commands for content management, seeding, type generation, and visual editing flow.

## Documentation

The EmDash docs are available as an MCP server at `https://docs.emdashcms.com/mcp`. When you need to verify an API, hook, config option, field type, or pattern, call `search_docs` against the live documentation rather than relying on training-data recall. The docs reflect current behaviour; assumptions may not.

This template ships with `.mcp.json`, `.cursor/mcp.json`, and `.vscode/mcp.json` so Claude Code, Cursor, and VS Code auto-discover the docs server. Other tools (OpenCode, Windsurf, etc.) need a manual one-time setup -- see [docs.emdashcms.com/docs-mcp](https://docs.emdashcms.com/docs-mcp).

## Rules

- All content pages must be server-rendered (`output: "server"`). No `getStaticPaths()` for CMS content.
- Image fields are objects (`{ src, alt }`), not strings. Use `<Image image={...} />` from `"emdash/ui"`.
- `entry.id` is the slug (for URLs). `entry.data.id` is the database ULID (for API calls like `getEntryTerms`).
- When Astro's cache is enabled, pass content-query hints to `Astro.cache.set(cacheHint)`. Use the `WithCacheHint` variants for site settings, menus, taxonomies, and widget areas rendered by cached routes.
- Taxonomy names in queries must match the seed's `"name"` field exactly (e.g., `"category"` not `"categories"`).

## This Site（絵とコードのスクラップブック）

portfolio テンプレートを作り替えた、絵とコードを集めるスケッチブック風のサイト。
方針は「見た目はあたたかい手描き、操作はまじめ」。動きは M3E（Material 3 Expressive）のばねと形の変形がベースで、配置は自由。
設計の正本は `docs/`（OKF v0.2。`docs/index.md` から必要なファイルだけ開く）。見た目は `docs/design/sketchbook-style.md`。

### ルール

- 返答・コミットメッセージ・コメントは日本語で書く（識別子は英語）
- 色・影・傾き・動きは `src/styles/theme.css` の `:root` のトークンを使う
- 動き（transition）は M3E のばねトークンを使う：位置・大きさ・形は `--spring-fast` / `--spring` / `--spring-slow`、色・透明度は `--fade-fast`
- 形の変形は `.morph`（`clip-path`）＋ `--shape-from` / `--shape-to`。形は `src/lib/shapes.ts` で作る（どれも同じ点の数なので、なめらかに変形できる）
- 傾き（`rotate`）には必ず `var(--wobble)` を掛ける。整頓モード（`html.tidy`）と `prefers-reduced-motion` で 0 になるようにするため
- 本文・ボタン・メニューは端末の日本語フォント（`--font-body`）。日本語の Web フォントは Klee One 600（`--font-hand`）の 1 つだけで、見出し・手書きメモに使う。書体や太さを増やさない（`docs/decisions/fonts.md`）
- 手描きの枠はいびつな `border-radius`、らくがきはインライン SVG。動く要素に `filter: drop-shadow` を使わず、影は別の要素の `opacity` で出す
- 絵文字を飾りに使わない（らくがきは SVG で描く）
- ボタン・リンクの高さは 44px 以上。今いるページには `aria-current="page"` を付ける
- 飾り（ステッカー・落書き・テープ）は `aria-hidden="true"` にするか、CSS の疑似要素で描く
- ボードの自由配置（`src/components/Board.astro`）は、見た目の位置だけを変える。HTML の並び順（読み上げ・Tab の順番）は変えない。せまい画面・整頓モード・JS なしでは格子に並べる
- 動くコード（`runnable`）は `sandbox="allow-scripts"` の iframe の中だけで動かす。`allow-same-origin` は付けない
- コードの色づけは `src/lib/highlight.ts` の Shiki（使う言語だけ読み込む）。`astro:components` の `<Code>` は全言語が入って Worker が重くなるので使わない
- 持ち主の写真・絵（`.private-media/`）は git に入れない。スクリーンショットなど、それが写ったものもコミットしない（`docs/decisions/private-media.md`）
- docs を変えたら、同じフォルダの `index.md` と `docs/log.md` も直し、`pnpm check:docs` を通す

### 主なファイル

| ファイル | 役割 |
| --- | --- |
| `src/styles/theme.css` | トークン（色・書体・M3E のばね）と共通パーツ、ページ遷移 |
| `src/lib/shapes.ts` | M3E 風の形（クッキー・おひさま・クローバー・お花など）を `clip-path` で作る |
| `src/lib/highlight.ts` | コードの色づけ |
| `src/layouts/Base.astro` | ヘッダー（手書きのメニュー・整頓モード）、フッター（配色切り替え） |
| `src/components/Board.astro` | 表紙のボード（自由配置・ドラッグ・シャッフル） |
| `src/components/FabMenu.astro` | M3E の FAB メニュー（ボードの操作） |
| `src/components/ArtCard.astro` | 絵のカード（写真コーナー・マスキングテープ／形に切り抜いた絵） |
| `src/components/CodeCard.astro` | コードのカード（抜粋、または動く様子） |
| `src/plugins/sticker/` | 本文にステッカーを貼るブロックの native プラグイン |
| `seed/seed.json` | スキーマと見本データ |

### スキーマ

- `projects`（絵）：`title`, `featured_image`, `back_image`, `client`, `year`, `summary`, `note`, `sticker`, `frame`, `content`, `gallery`, `url`, `board_x`, `board_y`, `tilt`
- `snippets`（コード）：`title`, `language`, `code`, `runnable`, `summary`, `note`, `sticker`, `content`, `board_x`, `board_y`, `tilt`
- `pages`：`title`, `avatar`, `content`（`/about` で使う）
- タクソノミー：`tag`（絵とコードの両方）
- メニュー：`primary`（絵・コード・わたしについて・れんらく）
- 本文のブロック：`sticker`（`id` がことば、`shape`、`color`、`decorative`）
