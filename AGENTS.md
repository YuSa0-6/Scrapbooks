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

## This Site（スクラップブック風ポートフォリオ）

portfolio テンプレートを、スクラップブック風に作り替えたサイト。方針は「見た目ははちゃめちゃ、操作はまじめ」。
テンプレート元の「控えめ・モノクロ」の方針は使わない。詳しくは `README.md`。

### ルール

- 返答・コミットメッセージ・コメントは日本語で書く（識別子は英語）
- 色・影・傾きの強さは `src/styles/theme.css` の `:root` のトークンを使う
- 傾き（`rotate`）には必ず `var(--wobble)` を掛ける。整頓モード（`html.tidy`）と `prefers-reduced-motion` で 0 になるようにするため
- 小さい文字（ボタン・メニュー・ラベル）は `--font-body` の太字。`--font-heading`（Dela Gothic One）は大きい見出しだけ
- ボタン・リンクの高さは 44px 以上。今いるページには `aria-current="page"` を付ける
- 飾り（ステッカー・落書き・テープ）は `aria-hidden="true"` にするか、CSS の疑似要素で描く
- 作品カードは polaroid（`src/components/ProjectCard.astro`）。並び順は DOM の順番のままにし、位置を `absolute` でばらまかない（読み上げ・タブ移動の順番を守るため）

### 主なファイル

| ファイル | 役割 |
| --- | --- |
| `src/styles/theme.css` | トークンと共通パーツ（`.tape` `.paper` `.sticker` `.btn-label` `.label-tape` `.marker` `.prose`） |
| `src/layouts/Base.astro` | ヘッダー（ラベルシールのメニュー・整頓モード）、フッター（配色切り替え） |
| `src/components/RansomTitle.astro` | 1 文字ずつ切り抜いたようなタイトル |
| `src/components/ProjectCard.astro` | ポラロイド風の作品カード |
| `seed/seed.json` | スキーマと見本データ。作品に `note`（手書きメモ）と `sticker`（絵文字）を追加 |

### スキーマ

- `projects`：`title`, `featured_image`, `client`, `year`, `summary`, `note`, `sticker`, `content`, `gallery`, `url`
- `pages`：`title`, `content`（`/about` で使う）
- タクソノミー：`tag`
- メニュー：`primary`（作品・わたしについて・れんらく）
