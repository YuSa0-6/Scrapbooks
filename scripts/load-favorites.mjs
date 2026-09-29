#!/usr/bin/env node
/**
 * 持ち主の好きなもの（写真と絵）を、EmDash の CLI と API で読み込む。
 *
 *   pnpm load:favorites                       開発サーバー（http://127.0.0.1:4321）へ
 *   pnpm load:favorites -- --url https://...  ほかのサイトへ（--token か EMDASH_TOKEN が要る）
 *
 * 何度実行しても同じ結果になる：
 * - 同じファイル名の画像は使い回す（アップロードし直さない）
 * - 同じ slug の絵があれば更新する（中身が同じなら何もしない）
 * - タグの term が無ければ作る
 * - replace_samples の見本は、消さずに下書きへ戻す
 *
 * 画像と favorites.json は .private-media/（gitignore）に置く。git には入れない。
 * 仕様：docs/architecture/favorites.md、docs/decisions/private-media.md
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EmDashClient } from "emdash/client";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(root, "node_modules/emdash/dist/cli/index.mjs");

/** タグの日本語ラベル（term が無いときだけ、この名前で作る） */
const TAG_LABELS = {
	drawing: "らくがき",
	painting: "油絵",
	photo: "写真",
	generative: "ジェネラティブ",
	color: "色",
};

/** 「わたしについて」の似顔絵に使う画像 */
const AVATAR_FILE = "fox-mask.webp";

// ---------- 引数 ----------

function parseArgs(argv) {
	const opts = {
		url: "http://127.0.0.1:4321",
		token: process.env.EMDASH_TOKEN || "",
		dir: join(root, ".private-media"),
	};
	// `pnpm load:favorites -- --url ...` の「--」は読み飛ばす
	const args = argv.filter((a) => a !== "--");
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		const [key, inline] = arg.split(/=(.*)/s);
		const value = () => inline ?? args[++i];
		if (key === "--url") opts.url = value();
		else if (key === "--token") opts.token = value();
		else if (key === "--dir") opts.dir = resolve(value());
		else if (key === "--help" || key === "-h") {
			console.log("使い方: pnpm load:favorites -- [--url <サイト>] [--token <トークン>] [--dir <画像の置き場>]");
			process.exit(0);
		} else fail(`知らない引数です: ${arg}`);
	}
	opts.url = opts.url.replace(/\/+$/, "");
	return opts;
}

function fail(message) {
	console.error(`エラー: ${message}`);
	process.exit(1);
}

const opts = parseArgs(process.argv.slice(2));

// ---------- EmDash の CLI ----------

/** emdash の CLI を呼び、--json の結果を返す。失敗したら止める */
function cli(args) {
	const full = [cliPath, ...args, "--url", opts.url, "--json"];
	if (opts.token) full.push("--token", opts.token);
	const result = spawnSync(process.execPath, full, {
		encoding: "utf8",
		maxBuffer: 64 * 1024 * 1024,
		env: { ...process.env, NODE_NO_WARNINGS: "1" },
	});
	if (result.status !== 0) {
		fail(`emdash ${args.slice(0, 3).join(" ")} が失敗しました\n${result.stderr || result.stdout}`);
	}
	const out = result.stdout;
	const start = out.search(/[{[]/);
	if (start < 0) return null;
	try {
		return JSON.parse(out.slice(start));
	} catch {
		fail(`emdash ${args.slice(0, 3).join(" ")} の結果が JSON ではありません\n${out}`);
	}
}

/** 一覧を最後まで読む（nextCursor をたどる） */
function cliList(args) {
	const items = [];
	let cursor;
	do {
		const page = cli([...args, "--limit", "100", ...(cursor ? ["--cursor", cursor] : [])]);
		items.push(...(page?.items ?? []));
		cursor = page?.nextCursor || undefined;
	} while (cursor);
	return items;
}

// terms の付け替えだけは CLI に無いので、CLI と同じ EmDashClient で API を呼ぶ
const client = new EmDashClient({
	baseUrl: opts.url,
	...(opts.token ? { token: opts.token } : { devBypass: true }),
});

// ---------- 画像 ----------

/** 画像の項目に入れる値（provider・id・寸法など）を作る */
function mediaValue(item, alt) {
	return {
		provider: "local",
		id: item.id,
		alt: alt ?? item.alt ?? "",
		width: item.width ?? undefined,
		height: item.height ?? undefined,
		mimeType: item.mimeType,
		filename: item.filename,
		meta: { storageKey: item.storageKey },
	};
}

/** 同じ画像かどうか比べるための短い形（id と alt） */
const imageKey = (v) => (v && typeof v === "object" ? `${v.id}|${v.alt ?? ""}` : "");
const galleryKey = (list) =>
	(Array.isArray(list) ? list : []).map((g) => `${imageKey(g.image)}|${g.caption ?? ""}`).join(";");

// ---------- 読み込み ----------

const manifestPath = join(opts.dir, "favorites.json");
if (!existsSync(manifestPath)) fail(`${manifestPath} がありません（.private-media/ に置いてください）`);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const projects = manifest.projects ?? [];
const replaceSamples = manifest.replace_samples ?? [];

console.log(`読み込み先: ${opts.url}（${opts.token ? "トークン" : "開発用の認証"}）`);

// 1. 画像：同じファイル名があれば使い回し、なければアップロードする
const wantedFiles = new Map(); // ファイル名 → 最初に出てきた alt
for (const p of projects) {
	if (p.image && !wantedFiles.has(p.image)) wantedFiles.set(p.image, p.alt);
	if (p.back_image && !wantedFiles.has(p.back_image)) wantedFiles.set(p.back_image, p.back_alt);
	for (const g of p.gallery ?? []) if (!wantedFiles.has(g.image)) wantedFiles.set(g.image, g.alt);
}
wantedFiles.set(AVATAR_FILE, wantedFiles.get(AVATAR_FILE));

const mediaByName = new Map(cliList(["media", "list"]).map((m) => [m.filename, m]));
const mediaResult = new Map(); // ファイル名 → "アップロード" | "使い回し"
for (const [file, alt] of wantedFiles) {
	if (mediaByName.has(file)) {
		mediaResult.set(file, "使い回し");
		continue;
	}
	const path = join(opts.dir, file);
	if (!existsSync(path)) fail(`画像がありません: ${path}`);
	const uploaded = cli(["media", "upload", path, ...(alt ? ["--alt", alt] : [])]);
	mediaByName.set(file, uploaded);
	mediaResult.set(file, "アップロード");
}
const media = (file) => {
	const item = mediaByName.get(file);
	if (!item) fail(`画像が見つかりません: ${file}`);
	return item;
};

// 2. タグ：term が無ければ日本語のラベルで作る
const wantedTags = [...new Set(projects.flatMap((p) => p.tags ?? []))];
const termBySlug = new Map(cliList(["taxonomy", "terms", "tag"]).map((t) => [t.slug, t]));
const createdTerms = [];
for (const slug of wantedTags) {
	if (termBySlug.has(slug)) continue;
	const name = TAG_LABELS[slug] ?? slug;
	const term = cli(["taxonomy", "add-term", "tag", "--name", name, "--slug", slug]);
	termBySlug.set(slug, term?.term ?? term);
	createdTerms.push(`${slug}（${name}）`);
}

// 3. 絵：同じ slug があれば更新、なければ作る。
// 表紙は新しい順に並ぶので、favorites.json の上のものが上に来るよう、下から作る
const existing = new Map(cliList(["content", "list", "projects"]).map((c) => [c.slug, c]));
const rows = new Map();

for (const p of [...projects].reverse()) {
	const data = {
		title: p.title,
		featured_image: mediaValue(media(p.image), p.alt),
		summary: p.summary,
		note: p.note,
		frame: p.frame,
		...(p.year ? { year: p.year } : {}),
		...(p.client ? { client: p.client } : {}),
		...(p.back_image ? { back_image: mediaValue(media(p.back_image), p.back_alt) } : {}),
		...(p.gallery?.length
			? {
					gallery: p.gallery.map((g) => ({
						image: mediaValue(media(g.image), g.alt),
						caption: g.caption ?? "",
					})),
				}
			: {}),
	};

	let result;
	let id;
	const found = existing.get(p.slug);
	if (!found) {
		const created = cli(["content", "create", "projects", "--slug", p.slug, "--data", JSON.stringify(data)]);
		id = created?.id ?? created?.item?.id;
		result = "作成";
	} else {
		id = found.id;
		const current = cli(["content", "get", "projects", id, "--raw"]);
		const cd = current.data ?? {};
		const same =
			current.status === "published" &&
			cd.title === data.title &&
			cd.summary === data.summary &&
			cd.note === data.note &&
			cd.frame === data.frame &&
			imageKey(cd.featured_image) === imageKey(data.featured_image) &&
			imageKey(cd.back_image) === imageKey(data.back_image) &&
			galleryKey(cd.gallery) === galleryKey(data.gallery);
		if (same) {
			result = "変更なし";
		} else {
			cli(["content", "update", "projects", id, "--rev", current._rev, "--data", JSON.stringify(data)]);
			result = "更新";
		}
	}
	if (!id) fail(`${p.slug} の ID が読めませんでした`);

	// タグ：今と同じなら何もしない
	const wantIds = (p.tags ?? []).map((t) => termBySlug.get(t)?.id).filter(Boolean);
	const now = await client.request("GET", `/content/projects/${id}/terms/tag`);
	const nowIds = (now.terms ?? []).map((t) => t.id);
	if (wantIds.length !== nowIds.length || wantIds.some((t) => !nowIds.includes(t))) {
		await client.request("POST", `/content/projects/${id}/terms/tag`, { termIds: wantIds });
		if (result === "変更なし") result = "タグを更新";
	}
	rows.set(p.slug, { slug: p.slug, title: p.title, result, back: p.back_image ? "あり" : "-", tags: (p.tags ?? []).join(",") });
}

// 4. 見本は消さずに下書きへ戻す（表に出さない）
const sampleRows = [];
for (const slug of replaceSamples) {
	const found = existing.get(slug);
	if (!found) {
		sampleRows.push({ slug, title: "-", result: "見つからない（何もしない）", back: "-", tags: "" });
		continue;
	}
	if (found.status === "draft") {
		sampleRows.push({ slug, title: found.title, result: "下書きのまま", back: "-", tags: "" });
		continue;
	}
	cli(["content", "unpublish", "projects", found.id]);
	sampleRows.push({ slug, title: found.title, result: "下書きに戻した", back: "-", tags: "" });
}

// 5. 「わたしについて」の似顔絵
const about = cli(["content", "get", "pages", "about", "--raw"]);
const avatarValue = mediaValue(media(AVATAR_FILE), wantedFiles.get(AVATAR_FILE));
let avatarResult = "変更なし";
if (imageKey(about.data?.avatar) !== imageKey(avatarValue)) {
	cli(["content", "update", "pages", about.id, "--rev", about._rev, "--data", JSON.stringify({ avatar: avatarValue })]);
	avatarResult = "更新";
}

// ---------- 結果の表 ----------

function printTable(header, body) {
	const width = (s) => [...String(s)].reduce((n, c) => n + (c.charCodeAt(0) > 0x7f ? 2 : 1), 0);
	const cols = header.map((h, i) => Math.max(width(h), ...body.map((r) => width(r[i]))));
	const line = (r) => `| ${r.map((c, i) => String(c) + " ".repeat(cols[i] - width(c))).join(" | ")} |`;
	console.log(line(header));
	console.log(`| ${cols.map((n) => "-".repeat(n)).join(" | ")} |`);
	for (const r of body) console.log(line(r));
}

console.log("\n画像");
printTable(
	["ファイル", "結果"],
	[...mediaResult].map(([f, r]) => [f, r]),
);

console.log("\n絵（projects）");
printTable(
	["slug", "題名", "結果", "裏の絵", "タグ"],
	[...projects.map((p) => rows.get(p.slug)), ...sampleRows].map((r) => [r.slug, r.title, r.result, r.back, r.tags]),
);

console.log("\nそのほか");
printTable(
	["対象", "結果"],
	[
		["タグの term を作成", createdTerms.length ? createdTerms.join("、") : "なし"],
		["about の似顔絵", `${AVATAR_FILE}（${avatarResult}）`],
	],
);
