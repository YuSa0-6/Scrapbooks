import type { PluginContext, SandboxedPlugin } from "emdash/plugin";

/** 並べ替えを受け付けるコレクション（この 2 つだけ） */
const COLLECTIONS = ["projects", "snippets"] as const;
type Collection = (typeof COLLECTIONS)[number];

/** 1 回に受け取る件数の上限 */
const MAX_ITEMS = 100;
/** x は 0〜100（ボードの幅のうちの位置）、y は 0〜20000（px） */
const X_MAX = 100;
const Y_MAX = 20000;
/** ULID：26 文字の Crockford base32（I・L・O・U は使わない） */
const ULID = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;

interface LayoutItem {
	collection: Collection;
	id: string;
	x: number;
	y: number;
}

interface SaveFailure {
	id: string;
	reason: string;
}

interface SaveResult {
	ok: boolean;
	saved: string[];
	failed: SaveFailure[];
	/** 入力そのものが正しくないときだけ付く */
	error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIntegerIn(value: unknown, max: number): value is number {
	return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max;
}

function isCollection(value: unknown): value is Collection {
	return COLLECTIONS.some((name) => name === value);
}

/** 入力を検証して、正しい項目の配列にする。1 つでも正しくなければ null（何も書かない） */
function parseItems(input: unknown): LayoutItem[] | null {
	if (!isRecord(input) || !Array.isArray(input.items)) return null;
	const raw: unknown[] = input.items;
	if (raw.length === 0 || raw.length > MAX_ITEMS) return null;

	const seen = new Set<string>();
	const items: LayoutItem[] = [];
	for (const entry of raw) {
		if (!isRecord(entry)) return null;
		const { collection, id, x, y } = entry;
		if (!isCollection(collection)) return null;
		if (typeof id !== "string" || !ULID.test(id)) return null;
		if (!isIntegerIn(x, X_MAX) || !isIntegerIn(y, Y_MAX)) return null;
		const key = `${collection}:${id}`;
		if (seen.has(key)) return null;
		seen.add(key);
		items.push({ collection, id, x, y });
	}
	return items;
}

/** 失敗の理由。例外の文章（パスや個人情報が入りうる）は返さず、決まった符号だけ返す */
function reasonOf(error: unknown): string {
	if (isRecord(error) && typeof error.code === "string" && /^[A-Z_]{3,40}$/.test(error.code)) {
		return error.code;
	}
	return "SAVE_FAILED";
}

/** 1 件を書き換えて公開する。失敗したときは理由の符号を返す */
async function saveOne(content: NonNullable<PluginContext["content"]>, item: LayoutItem) {
	const { collection, id } = item;
	if (!content.getVersioned || !content.update || !content.publish) return "NOT_AVAILABLE";

	const before = await content.getVersioned(collection, id);
	if (!before) return "NOT_FOUND";
	// 公開前の下書きは、ここで公開してしまわないように触らない
	if (before.item.status !== "published") return "NOT_PUBLISHED";

	await content.update(collection, id, { board_x: item.x, board_y: item.y });
	// 更新で版（_rev）が進むので、公開の直前に取り直す
	const after = await content.getVersioned(collection, id);
	if (!after) return "NOT_FOUND";
	await content.publish(collection, id, { _rev: after._rev });
	return null;
}

const plugin: SandboxedPlugin = {
	routes: {
		/**
		 * ボードで並べた位置を、絵とコードの board_x / board_y に書いて公開する。
		 * 非公開ルート：ログインした編集者以上（content:publish_any）だけが呼べる。
		 */
		save: {
			permission: "content:publish_any",
			methods: ["POST"],
			handler: async (routeCtx, ctx): Promise<SaveResult> => {
				const items = parseItems(routeCtx.input);
				if (!items) return { ok: false, saved: [], failed: [], error: "INVALID_INPUT" };
				if (!ctx.content) return { ok: false, saved: [], failed: [], error: "NOT_AVAILABLE" };

				const saved: string[] = [];
				const failed: SaveFailure[] = [];
				// 1 件ずつ。失敗した件は理由を残して、ほかは続ける
				for (const item of items) {
					try {
						const reason = await saveOne(ctx.content, item);
						if (reason) failed.push({ id: item.id, reason });
						else saved.push(item.id);
					} catch (error) {
						ctx.log.warn("board-layout: 1 件の保存に失敗", {
							collection: item.collection,
							id: item.id,
							reason: reasonOf(error),
						});
						failed.push({ id: item.id, reason: reasonOf(error) });
					}
				}
				return { ok: failed.length === 0, saved, failed };
			},
		},
	},
};

export default plugin;
