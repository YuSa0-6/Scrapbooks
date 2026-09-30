# board-layout

ボードで並べたカードの位置を、絵（`projects`）とコード（`snippets`）の `board_x` / `board_y` に書き込んで公開する、EmDash の sandboxed プラグイン。
設計は `docs/architecture/board-layout-plugin.md`。

## 権限

| 権限 | 使いみち |
| --- | --- |
| `content:read` | 対象の絵・コードが公開済みかを確かめる |
| `content:write` | `board_x` / `board_y` を書き換える |
| `content:publish` | 書き換えたものを公開する（`_rev` を渡す） |

## ルート

`POST /_emdash/api/plugins/board-layout/save`（非公開。`content:publish_any` と `X-EmDash-Request: 1` が要る）

```json
{ "items": [{ "collection": "projects", "id": "<ULID>", "x": 50, "y": 300 }] }
```

## 開発

```sh
pnpm install
pnpm run typecheck
pnpm run test    # 検証 + workerd の Worker Loader で本物のコンテンツ処理を通す
pnpm run build   # dist/ を作る（サイトの predev / prebuild / pretypecheck が呼ぶ）
```

権限（`capabilities`）を変えるときは、`package.json` の `version` を上げる。
