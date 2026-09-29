---
type: Playbook
title: ドキュメントの書き方
description: docs/ を Open Knowledge Format（OKF）v0.2 の形で追加・更新する手順。
tags: [docs, okf]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
sources:
  - id: okf-spec
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
    title: Open Knowledge Format Specification
---

# 考え方

| 原則 | やり方 |
| --- | --- |
| 1 つの概念＝1 ファイル | 設計・決定・手順をそれぞれ 1 ファイルにする |
| 場所＝ID | `docs/design/desk-3d.md` の ID は `design/desk-3d` |
| 段階的に開示する | 各フォルダの `index.md` に一覧と 1 行説明 |
| 関係はリンクで | `/` から始まる絶対パス（docs/ が根） |

# ファイルの形

```markdown
---
type: Architecture   # 必須
title: ボード
description: 1 文の要約。
tags: [architecture]
status: draft        # 省略時は stable
generated: { by: claude-code/<バージョン>, at: 2026-09-29T07:15:00Z }
---
```

- `generated.by` には `claude-code/<バージョン>` か `human:<名前>` を書く。モデル名は書かない
- `index.md` と `log.md` にはフロントマターを付けない（根の `index.md` の `okf_version` だけは例外）

# type の一覧

| type | 使う場面 | 置き場所 |
| --- | --- | --- |
| `Requirement` | 何を作るか | `product/` |
| `Design` | 見た目・動き | `design/` |
| `Architecture` | どう作るか | `architecture/` |
| `Policy` | 守る決まり・数値 | どこでも |
| `Decision` | 決めたこと | `decisions/` |
| `Open Question` | 確認待ち | `decisions/` |
| `Playbook` | 手順書 | `guides/` |
| `Task List` | 作業の一覧 | `tasks/` |

# 手順

1. フォルダを決め、英小文字とハイフンでファイル名を付ける
2. フロントマターと本文を書く
3. 同じフォルダの `index.md` に 1 行足す
4. [log.md](/log.md) の今日の日付に 1 行足す
5. `pnpm check:docs` で形を確かめる
