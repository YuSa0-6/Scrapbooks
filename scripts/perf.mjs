// 性能の予算（docs/architecture/performance.md）を測る。
//   pnpm build && pnpm preview --host 127.0.0.1 --port 4322   ← 数値は本番ビルドで測る
//   pnpm perf                     表で出す（予算超えがあれば終了コード 1）
//   pnpm perf --json              JSON で出す
//   pnpm perf --strict            「未対応」も失敗として扱う
//   BASE_URL=http://127.0.0.1:4321 pnpm perf   開発サーバーで測る（JS の大きさは対象外）
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";

const require = createRequire(import.meta.url);
const { chromium } = loadPlaywright();

/** グローバルに入っている Playwright を読む（playwright install はしない） */
function loadPlaywright() {
	try {
		return require("playwright");
	} catch {
		const globalRoot = require("node:child_process")
			.execSync("npm root -g", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
			.trim();
		return require(`${globalRoot}/playwright`);
	}
}

const args = new Set(process.argv.slice(2));
const asJson = args.has("--json");
const strict = args.has("--strict");
const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:4322").replace(/\/$/, "");

// ---- 予算（docs/architecture/performance.md と同じ数値） ----
const BUDGET = {
	jsHome: 25 * 1024,
	jsOther: 15 * 1024,
	cls: 0.05,
	longTaskMs: 300,
	frameP95Ms: 20,
};
const ROUTES = ["/", "/work", "/code", "/code/wavy-lines", "/work/meridian-brand"];
const SETTLE_MS = 5000; // 読み込みから測る時間
const PHASE_MS = 1000; // 操作 1 つあたりの時間

const kb = (bytes) => `${(bytes / 1024).toFixed(1)}KB`;
const ms = (value) => `${value.toFixed(1)}ms`;
const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));
const isBudgetedScript = (url) =>
	new URL(url).origin === baseUrl && !new URL(url).pathname.startsWith("/_emdash");

function log(...message) {
	if (!asJson) console.log(...message);
}

// ---- 1. JS の大きさ：HTML から集めて gzip ----
async function measureJs(context, route, observed) {
	const response = await context.request.get(baseUrl + route);
	const html = await response.text();
	const page = await context.newPage();
	// DOMParser で読む（スクリプトは動かない）。属性の中の <script> と本物を取り違えない
	await page.setContent("<!doctype html><title>x</title>");
	const found = await page.evaluate((source) => {
		const doc = new DOMParser().parseFromString(source, "text/html");
		const external = [...doc.querySelectorAll("script[src]")].map((el) => el.getAttribute("src"));
		const preload = [...doc.querySelectorAll('link[rel="modulepreload"]')].map((el) =>
			el.getAttribute("href"),
		);
		const inline = [...doc.querySelectorAll("script:not([src])")]
			.filter((el) => {
				const type = (el.getAttribute("type") ?? "").toLowerCase();
				return type === "" || type === "module" || type.includes("javascript");
			})
			.map((el) => el.textContent ?? "");
		return { external, preload, inline };
	}, html);
	await page.close();

	const urls = new Set(
		[...found.external, ...found.preload]
			.map((src) => new URL(src, baseUrl + route).href)
			.filter(isBudgetedScript),
	);
	const files = [];
	for (const url of urls) {
		const res = await context.request.get(url);
		if (!res.ok()) throw new Error(`${url} を取得できません（${res.status()}）`);
		files.push({ name: new URL(url).pathname, gzip: gzipSync(await res.body()).length });
	}
	// 実際に読み込まれたスクリプトのうち、HTML に書かれていないもの（静的 import など）も足す
	for (const [url, gzip] of observed ?? []) {
		if (!urls.has(url)) files.push({ name: new URL(url).pathname, gzip });
	}
	const inline = found.inline.map((code) => gzipSync(Buffer.from(code)).length);
	const gzip = files.reduce((sum, file) => sum + file.gzip, 0) + inline.reduce((a, b) => a + b, 0);
	return {
		route,
		files: files.length,
		inlineScripts: inline.length,
		gzip,
		budget: route === "/" ? BUDGET.jsHome : BUDGET.jsOther,
	};
}

// ---- 2. CLS と長いタスク：スマホ幅・CPU 4 倍遅く ----
async function measureVitals(browser, route) {
	const context = await browser.newContext({
		viewport: { width: 390, height: 844 },
		isMobile: true,
		hasTouch: true,
	});
	const page = await context.newPage();
	const cdp = await context.newCDPSession(page);
	await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

	const observed = new Map();
	page.on("response", async (res) => {
		if (res.request().resourceType() !== "script" || !isBudgetedScript(res.url())) return;
		try {
			observed.set(res.url(), gzipSync(await res.body()).length);
		} catch {
			// 途中で中断された読み込みは数えない
		}
	});
	await page.addInitScript(() => {
		const state = { cls: 0, tasks: [] };
		window.__vitals = state;
		try {
			new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (!entry.hadRecentInput) state.cls += entry.value;
				}
			}).observe({ type: "layout-shift", buffered: true });
			new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					state.tasks.push({ start: entry.startTime, duration: entry.duration });
				}
			}).observe({ type: "longtask", buffered: true });
		} catch {
			// 対応していないブラウザでは 0 のまま
		}
	});

	const startedAt = Date.now();
	await page.goto(baseUrl + route, { waitUntil: "load" });
	await sleep(Math.max(0, SETTLE_MS - (Date.now() - startedAt)));
	const result = await page.evaluate((limit) => {
		const tasks = window.__vitals.tasks.filter((task) => task.start <= limit);
		return {
			cls: window.__vitals.cls,
			longTaskMs: tasks.reduce((sum, task) => sum + task.duration, 0),
			longTaskCount: tasks.length,
			dev: !!document.querySelector('script[src^="/@vite/client"]'),
		};
	}, SETTLE_MS);
	await context.close();
	return { route, ...result, observed };
}

// ---- 3. フレーム時間・4. 画面外の動くコード：1280x900 の表紙 ----
function percentile(values, p) {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)];
}

async function measureCover(browser) {
	const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	const page = await context.newPage();
	await page.addInitScript(() => {
		const rec = { on: false, phase: "", frames: {} };
		window.__rec = rec;
		let last = 0;
		const loop = (now) => {
			if (rec.on) {
				(rec.frames[rec.phase] ??= []).push(now);
			}
			last = now;
			requestAnimationFrame(loop);
		};
		requestAnimationFrame(loop);
		void last;
	});
	await page.goto(baseUrl + "/", { waitUntil: "load" });
	await sleep(1500);

	const phases = {};
	const notes = [];
	const record = async (name, action) => {
		await page.evaluate((phase) => {
			window.__rec.phase = phase;
			window.__rec.on = true;
		}, name);
		try {
			await action();
		} catch (error) {
			notes.push(`${name}: ${String(error.message ?? error).split("\n")[0]}`);
		}
		await page.evaluate(() => {
			window.__rec.on = false;
		});
	};

	const card = page.locator("[data-board] > li").first();
	const box = await card.boundingBox();
	if (!box) throw new Error("ボードのカードが見つかりません");
	const cx = box.x + box.width / 2;
	const cy = box.y + Math.min(box.height / 2, 60);

	// ドラッグ：カードを 1 秒つかんで円を描く
	await page.mouse.move(cx, cy);
	await record("ドラッグ", async () => {
		await page.mouse.down();
		const steps = 50;
		for (let i = 1; i <= steps; i++) {
			const angle = (i / steps) * Math.PI * 2;
			await page.mouse.move(cx + Math.sin(angle) * 120, cy + (1 - Math.cos(angle)) * 60);
			await sleep(PHASE_MS / steps);
		}
		await page.mouse.up();
	});

	// シャッフル：FAB を開いて「シャッフル」を押し、動きが落ち着くまでの 1 秒
	await record("シャッフル", async () => {
		await page.locator("[data-fab-toggle]").click({ timeout: 3000 });
		await page.locator('[data-action="shuffle"]').click({ timeout: 3000 });
		await sleep(PHASE_MS);
	});

	// ボード上でマウスを 1 秒動かす（視差）
	await record("マウス移動", async () => {
		const board = await page.locator("[data-board]").boundingBox();
		const region = board ?? { x: 0, y: 0, width: 1280, height: 900 };
		const steps = 50;
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			await page.mouse.move(
				region.x + region.width * (0.1 + 0.8 * t),
				Math.min(880, region.y + 40 + Math.sin(t * Math.PI * 4) * 120 + 200),
			);
			await sleep(PHASE_MS / steps);
		}
	});

	const frames = await page.evaluate(() => window.__rec.frames);
	const all = [];
	for (const [name, times] of Object.entries(frames)) {
		const intervals = times.slice(1).map((time, i) => time - times[i]);
		phases[name] = { p95: percentile(intervals, 0.95), frames: intervals.length };
		all.push(...intervals);
	}
	const frame = { p95: percentile(all, 0.95), samples: all.length, phases, notes };

	// 画面外の動くコード：表紙の一番上に戻して確かめる
	await page.evaluate(() => window.scrollTo(0, 0));
	await sleep(600);
	const offscreen = await page.evaluate(() => {
		const inView = (el) => {
			const r = el.getBoundingClientRect();
			return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
		};
		const frames = [...document.querySelectorAll("iframe[data-srcdoc], iframe[srcdoc]")];
		const hidden = frames.filter((el) => !inView(el));
		return {
			total: frames.length,
			offscreen: hidden.length,
			mechanism: frames.some((el) => el.hasAttribute("data-srcdoc")),
			running: hidden.filter((el) => (el.getAttribute("srcdoc") ?? "") !== "").length,
		};
	});
	await context.close();
	return { frame, offscreen };
}

// ---- 実行 ----
const browser = await chromium.launch();
const rows = { js: [], vitals: [] };
let cover;
let dev = false;
try {
	const check = await fetch(baseUrl + "/").catch(() => null);
	if (!check?.ok) {
		console.error(`${baseUrl} に応答がありません。pnpm build のあと pnpm preview --host 127.0.0.1 --port 4322 で起動してください。`);
		process.exit(2);
	}

	for (const route of ROUTES) {
		log(`測定中：${route}`);
		const vitals = await measureVitals(browser, route);
		dev ||= vitals.dev;
		rows.vitals.push(vitals);
	}
	cover = await measureCover(browser);

	// 開発サーバーは JS が細かく分かれていて本番と比べられないので、JS の大きさは測らない
	if (!dev) {
		const context = await browser.newContext();
		for (const vitals of rows.vitals) {
			rows.js.push(await measureJs(context, vitals.route, vitals.observed));
		}
		await context.close();
	}
} finally {
	await browser.close();
}

// ---- 判定 ----
const failures = [];
for (const row of rows.js) {
	row.ok = row.gzip <= row.budget;
	if (!row.ok) failures.push(`JS ${row.route}: ${kb(row.gzip)} > ${kb(row.budget)}`);
}
for (const row of rows.vitals) {
	row.clsOk = row.cls <= BUDGET.cls;
	row.longTaskOk = row.longTaskMs <= BUDGET.longTaskMs;
	if (!row.clsOk) failures.push(`CLS ${row.route}: ${row.cls.toFixed(3)} > ${BUDGET.cls}`);
	if (!row.longTaskOk)
		failures.push(`長いタスク ${row.route}: ${Math.round(row.longTaskMs)}ms > ${BUDGET.longTaskMs}ms`);
}
const frameOk = cover.frame.p95 <= BUDGET.frameP95Ms && cover.frame.notes.length === 0;
if (!frameOk) {
	failures.push(
		cover.frame.notes.length > 0
			? `フレーム時間: 操作に失敗（${cover.frame.notes.join(" / ")}）`
			: `フレーム p95: ${ms(cover.frame.p95)} > ${BUDGET.frameP95Ms}ms`,
	);
}
const off = cover.offscreen;
let offscreenStatus;
if (off.total === 0) offscreenStatus = "対象なし";
else if (!off.mechanism) offscreenStatus = "未対応";
else offscreenStatus = off.running === 0 ? "OK" : "NG";
if (offscreenStatus === "NG") failures.push(`画面外の動くコード: srcdoc が入った画面外 iframe が ${off.running} 個`);
if (offscreenStatus === "未対応" && strict) failures.push("画面外の動くコード: 未対応（--strict）");

const summary = {
	baseUrl,
	dev,
	budget: BUDGET,
	js: rows.js.map(({ route, files, inlineScripts, gzip, budget, ok }) => ({
		route, files, inlineScripts, gzipBytes: gzip, budgetBytes: budget, ok,
	})),
	vitals: rows.vitals.map(({ route, cls, longTaskMs, longTaskCount, clsOk, longTaskOk }) => ({
		route, cls, longTaskMs, longTaskCount, clsOk, longTaskOk,
	})),
	frame: { ...cover.frame, ok: frameOk },
	offscreen: { ...off, status: offscreenStatus },
	failures,
	ok: failures.length === 0,
};

if (asJson) {
	console.log(JSON.stringify(summary, null, 2));
} else {
	const mark = (ok) => (ok ? "OK" : "NG");
	console.log(`\n測定先：${baseUrl}${dev ? "（開発サーバー：JS の大きさは対象外）" : "（本番ビルド）"}\n`);
	console.log("| 項目 | ルート | 値 | 予算 | 判定 |\n| --- | --- | --- | --- | --- |");
	for (const row of rows.js) {
		console.log(`| JS（gzip） | ${row.route} | ${kb(row.gzip)}（外部 ${row.files}・インライン ${row.inlineScripts}） | ${kb(row.budget)} 以下 | ${mark(row.ok)} |`);
	}
	if (dev) console.log("| JS（gzip） | 全ルート | 測定せず | - | 対象外 |");
	for (const row of rows.vitals) {
		console.log(`| CLS | ${row.route} | ${row.cls.toFixed(3)} | ${BUDGET.cls} 以下 | ${mark(row.clsOk)} |`);
	}
	for (const row of rows.vitals) {
		console.log(`| 長いタスク合計 | ${row.route} | ${Math.round(row.longTaskMs)}ms（${row.longTaskCount} 回） | ${BUDGET.longTaskMs}ms 以下 | ${mark(row.longTaskOk)} |`);
	}
	const detail = Object.entries(cover.frame.phases)
		.map(([name, phase]) => `${name} ${ms(phase.p95)}`)
		.join("・");
	console.log(`| フレーム p95 | / | ${ms(cover.frame.p95)}（${detail}） | ${BUDGET.frameP95Ms}ms 以下 | ${mark(frameOk)} |`);
	console.log(`| 画面外の動くコード | / | iframe ${off.total} 個中 画面外 ${off.offscreen} 個・動作中 ${off.running} 個 | srcdoc が空 | ${offscreenStatus} |`);
	if (cover.frame.notes.length > 0) console.log(`\n操作の失敗：${cover.frame.notes.join(" / ")}`);
	console.log(failures.length === 0 ? "\n予算内です。" : `\n予算超え ${failures.length} 件：\n${failures.map((f) => `  - ${f}`).join("\n")}`);
}
process.exit(failures.length === 0 ? 0 : 1);
