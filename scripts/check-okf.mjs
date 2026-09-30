// docs/ が OKF v0.2 の形になっているか確かめる（依存なし・Node 標準機能のみ）。
// 確かめること：
//   1. index.md と log.md 以外の .md に、type が空でないフロントマターがある
//   2. 根の docs/index.md に okf_version がある
//   3. log.md の見出し（##）が「## YYYY-MM-DD」の形
// 違反はファイル名つきで出し、1 件でもあれば終了コード 1。
import { readdirSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "../..");
const docsDir = join(root, "docs");

/** docs/ 以下の .md をすべて集める */
function collect(dir) {
	const files = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) files.push(...collect(path));
		else if (entry.name.endsWith(".md")) files.push(path);
	}
	return files.sort();
}

/** 先頭の --- ブロックを取り出す。なければ null */
function frontMatter(text) {
	const match = text.replace(/^﻿/, "").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	return match ? match[1] : null;
}

/** フロントマターからトップレベルの key: value を読む（コメントと引用符は外す） */
function readKey(block, key) {
	const line = block.split(/\r?\n/).find((l) => l.startsWith(`${key}:`));
	if (!line) return undefined;
	return line
		.slice(key.length + 1)
		.replace(/\s+#.*$/, "")
		.trim()
		.replace(/^(["'])(.*)\1$/, "$2");
}

const problems = [];
const report = (file, message) => problems.push(`${relative(root, file)}: ${message}`);

const files = collect(docsDir);
for (const file of files) {
	const name = basename(file);
	const text = readFileSync(file, "utf8");
	const isRootIndex = file === join(docsDir, "index.md");

	if (isRootIndex) {
		const block = frontMatter(text);
		if (block === null || !readKey(block, "okf_version")) {
			report(file, "根の index.md に okf_version がありません");
		}
		continue;
	}

	if (name === "log.md") {
		text.split(/\r?\n/).forEach((line, i) => {
			if (/^##(?!#)/.test(line) && !/^## \d{4}-\d{2}-\d{2}\s*$/.test(line)) {
				report(file, `${i + 1} 行目の見出しが「## YYYY-MM-DD」の形ではありません（${line}）`);
			}
		});
		continue;
	}

	if (name === "index.md") continue;

	const block = frontMatter(text);
	if (block === null) {
		report(file, "フロントマター（先頭の --- ブロック）がありません");
	} else if (!readKey(block, "type")) {
		report(file, "フロントマターの type が空です");
	}
}

if (problems.length > 0) {
	console.error(`OKF の違反が ${problems.length} 件あります。`);
	for (const p of problems) console.error(`  - ${p}`);
	process.exit(1);
}
console.log(`OKF チェック OK（${files.length} ファイル）`);
