import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createPluginRuntimeTestHost, type PluginRuntimeTestHost } from "@emdash-cms/plugin-test";

/** 実際の ID と同じ形（26 文字の Crockford base32）の ULID を作る */
const ulid = (n: number) => `01J8Z${String(n).padStart(21, "0")}`;
const ART_1 = ulid(1);
const ART_2 = ulid(2);
const CODE_1 = ulid(3);
const DRAFT_1 = ulid(4);
const MISSING = ulid(9);

const CSRF = { "x-emdash-request": "1" };

interface SaveData {
	ok: boolean;
	saved: string[];
	failed: Array<{ id: string; reason: string }>;
	error?: string;
}

let host: PluginRuntimeTestHost;
let users: Map<string, Awaited<ReturnType<PluginRuntimeTestHost["fixtures"]["user"]>>>;

beforeEach(async () => {
	host = await createPluginRuntimeTestHost();
	users = new Map();
	const fields = [
		{ slug: "title", label: "Title", type: "string" as const },
		{ slug: "board_x", label: "x", type: "integer" as const },
		{ slug: "board_y", label: "y", type: "integer" as const },
	];
	await host.fixtures.collection({ slug: "projects", label: "Projects", fields });
	await host.fixtures.collection({ slug: "snippets", label: "Snippets", fields });
	await host.fixtures.content("projects", {
		id: ART_1,
		slug: "art-1",
		status: "published",
		data: { title: "絵 1", board_x: 10, board_y: 20 },
	});
	await host.fixtures.content("projects", {
		id: ART_2,
		slug: "art-2",
		status: "published",
		data: { title: "絵 2", board_x: 30, board_y: 40 },
	});
	await host.fixtures.content("snippets", {
		id: CODE_1,
		slug: "code-1",
		status: "published",
		data: { title: "コード 1", board_x: 50, board_y: 60 },
	});
	await host.fixtures.content("projects", {
		id: DRAFT_1,
		slug: "draft-1",
		status: "draft",
		data: { title: "下書き", board_x: 70, board_y: 80 },
	});
});

afterEach(async () => {
	await host.dispose();
});

/** 編集者として save ルートを HTTP の入口から呼ぶ */
async function save(body: unknown, options: { role?: "author" | "editor" | "admin"; headers?: Record<string, string>; method?: string } = {}) {
	const role = options.role ?? "editor";
	// 同じ役割のユーザーは 1 人だけ作る（メールアドレスは重複できない）
	if (!users.has(role)) {
		users.set(role, await host.fixtures.user({ email: `${role}@example.com`, role }));
	}
	const user = users.get(role)!;
	const response = await host.actions.routes.request("save", {
		method: options.method ?? "POST",
		user,
		headers: options.headers ?? CSRF,
		body,
	});
	const json = (await response.json()) as { success: boolean; data?: SaveData };
	return { status: response.status, json, data: json.data };
}

async function positionOf(collection: string, id: string) {
	const item = await host.inspect.content.get(collection, id);
	return { x: item?.data.board_x, y: item?.data.board_y, status: item?.status };
}

describe("マニフェスト", () => {
	it("求める権限は内容の読み書きと公開だけ", () => {
		expect(host.manifest.capabilities).toEqual(["content:read", "content:write", "content:publish"]);
		expect(host.manifest.allowedHosts).toEqual([]);
	});
});

describe("save ルート", () => {
	it("board_x / board_y を書き換えて公開する（絵とコードの両方）", async () => {
		const { status, data } = await save({
			items: [
				{ collection: "projects", id: ART_1, x: 55, y: 300 },
				{ collection: "snippets", id: CODE_1, x: 0, y: 20000 },
			],
		});
		expect(status).toBe(200);
		expect(data).toEqual({ ok: true, saved: [ART_1, CODE_1], failed: [] });

		expect(await positionOf("projects", ART_1)).toEqual({ x: 55, y: 300, status: "published" });
		expect(await positionOf("snippets", CODE_1)).toEqual({ x: 0, y: 20000, status: "published" });

		// 公開まで進んでいる（下書きの版が残っていない）
		const art = await host.inspect.content.get("projects", ART_1);
		expect(art?.liveRevisionId).toBeTruthy();
		expect(art?.draftRevisionId ?? art?.liveRevisionId).toBe(art?.liveRevisionId);

		// 送っていないカードは動かない
		expect(await positionOf("projects", ART_2)).toEqual({ x: 30, y: 40, status: "published" });
	});

	it("失敗した件は理由を返し、ほかは続ける", async () => {
		const { data } = await save({
			items: [
				{ collection: "projects", id: MISSING, x: 1, y: 1 },
				{ collection: "projects", id: DRAFT_1, x: 2, y: 2 },
				{ collection: "projects", id: ART_2, x: 3, y: 4 },
			],
		});
		expect(data).toEqual({
			ok: false,
			saved: [ART_2],
			failed: [
				{ id: MISSING, reason: "NOT_FOUND" },
				{ id: DRAFT_1, reason: "NOT_PUBLISHED" },
			],
		});
		expect(await positionOf("projects", ART_2)).toEqual({ x: 3, y: 4, status: "published" });
		// 公開前の下書きは、書き換えも公開もしない
		expect(await positionOf("projects", DRAFT_1)).toEqual({ x: 70, y: 80, status: "draft" });
	});

	it("同じ操作を 2 回送っても結果は同じ", async () => {
		const body = { items: [{ collection: "projects", id: ART_1, x: 12, y: 34 }] };
		expect((await save(body)).data?.ok).toBe(true);
		expect((await save(body)).data?.ok).toBe(true);
		expect(await positionOf("projects", ART_1)).toEqual({ x: 12, y: 34, status: "published" });
	});

	it.each([
		["items がない", {}],
		["items が配列でない", { items: "x" }],
		["空の配列", { items: [] }],
		["許可しないコレクション", { items: [{ collection: "pages", id: ART_1, x: 1, y: 1 }] }],
		["ULID でない id", { items: [{ collection: "projects", id: "abc", x: 1, y: 1 }] }],
		["I・L・O・U を含む id", { items: [{ collection: "projects", id: `${ART_1.slice(0, 25)}U`, x: 1, y: 1 }] }],
		["x が範囲外（101）", { items: [{ collection: "projects", id: ART_1, x: 101, y: 1 }] }],
		["x が負", { items: [{ collection: "projects", id: ART_1, x: -1, y: 1 }] }],
		["x が整数でない", { items: [{ collection: "projects", id: ART_1, x: 1.5, y: 1 }] }],
		["y が範囲外（20001）", { items: [{ collection: "projects", id: ART_1, x: 1, y: 20001 }] }],
		["y が文字列", { items: [{ collection: "projects", id: ART_1, x: 1, y: "5" }] }],
		["同じカードが 2 回", { items: [{ collection: "projects", id: ART_1, x: 1, y: 1 }, { collection: "projects", id: ART_1, x: 2, y: 2 }] }],
		["項目がオブジェクトでない", { items: [null] }],
	])("入力が正しくないと何も書かない：%s", async (_name, body) => {
		const { data } = await save(body);
		expect(data).toEqual({ ok: false, saved: [], failed: [], error: "INVALID_INPUT" });
		expect(await positionOf("projects", ART_1)).toEqual({ x: 10, y: 20, status: "published" });
	});

	it("100 件までは受け取り、101 件は断る", async () => {
		const many = (count: number) => ({
			items: Array.from({ length: count }, (_, i) => ({
				collection: "projects",
				id: ulid(1000 + i),
				x: 1,
				y: 1,
			})),
		});
		// 存在しない ID なので保存はされず NOT_FOUND になるが、入力としては受け取られる
		const ok = await save(many(100));
		expect(ok.data?.error).toBeUndefined();
		expect(ok.data?.failed).toHaveLength(100);
		const tooMany = await save(many(101));
		expect(tooMany.data?.error).toBe("INVALID_INPUT");
	});
});

describe("入口の守り", () => {
	it("X-EmDash-Request がないと断る", async () => {
		const { status } = await save({ items: [{ collection: "projects", id: ART_1, x: 1, y: 1 }] }, { headers: {} });
		expect(status).toBe(403);
		expect(await positionOf("projects", ART_1)).toEqual({ x: 10, y: 20, status: "published" });
	});

	it("公開の権限がない人（投稿者）は断る", async () => {
		const { status } = await save(
			{ items: [{ collection: "projects", id: ART_1, x: 1, y: 1 }] },
			{ role: "author" },
		);
		expect(status).toBe(403);
		expect(await positionOf("projects", ART_1)).toEqual({ x: 10, y: 20, status: "published" });
	});

	it("POST 以外は断る", async () => {
		const { status } = await save(undefined, { method: "GET" });
		expect(status).toBe(405);
	});

	it("管理者は使える", async () => {
		const { data } = await save({ items: [{ collection: "projects", id: ART_1, x: 5, y: 6 }] }, { role: "admin" });
		expect(data?.ok).toBe(true);
	});
});
