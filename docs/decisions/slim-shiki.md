---
type: Decision
title: コードの色づけ
description: Shiki の core と JavaScript 正規表現エンジンに、使う言語とテーマだけを読み込む。
tags: [decisions, performance]
generated: { by: claude-code/2.1.284, at: 2026-09-29T07:15:00Z }
---

# 結論

`src/lib/highlight.ts` で `shiki/core` ＋ `createJavaScriptRegexEngine` を使い、html・css・javascript・typescript・python・glsl・shellscript と github-light / github-dark だけを読む。

# 理由

Astro の `<Code>` は全言語を含み、Worker が圧縮後 6.5MB になった。絞ると 4.6MB（色づけの分は約 90KB）。
