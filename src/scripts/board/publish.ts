/**
 * 「この並べ方を公開する」の処理。管理者が FAB の項目を押したときだけ、
 * FabMenu.astro が import() で読み込む（見る人の JS には入らない）。
 *
 * 流れ：getBoardLayout() の今の位置 → POST /_emdash/api/plugins/board-layout/save
 * 非同期は effect/Micro：tryPromise → retry（一時的な失敗だけ 2 回）→ timeout（全体で 5 秒）。
 * フルの effect は 74KB あるので、ブラウザには 11KB の Micro だけを入れる（docs/architecture/effect.md）。
 */
import { Micro } from "effect";
import { getBoardLayout, type BoardLayoutItem } from "./index";

const ENDPOINT = "/_emdash/api/plugins/board-layout/save";
/** プラグインが受け取る件数の上限（plugins/board-layout） */
const MAX_ITEMS = 100;
const TIMEOUT_MS = 5000;
/** 結果を出しておく時間（ms） */
const MESSAGE_MS = 8000;

interface SaveFailure {
	id: string;
	reason: string;
}

interface SaveData {
	ok: boolean;
	saved: string[];
	failed: SaveFailure[];
	error?: string;
}

/** 通信の失敗。retry してよいかどうかを retryable で持つ */
class PublishError {
	readonly _tag = "PublishError";
	constructor(
		readonly kind: "network" | "forbidden" | "invalid" | "server",
		readonly retryable: boolean,
	) {}
}

export type PublishResult =
	| { status: "empty" }
	| { status: "done"; saved: number; failed: SaveFailure[] }
	| { status: "error"; kind: PublishError["kind"] | "timeout" };

/** プラグインの入力（x・y は整数、x は 0〜100、y は 0〜20000）に合わせる */
function toPayload(items: BoardLayoutItem[]) {
	const clamp = (value: number, max: number) => Math.min(max, Math.max(0, Math.round(value)));
	return {
		items: items.slice(0, MAX_ITEMS).map((item) => ({
			collection: item.collection,
			id: item.id,
			x: clamp(item.x, 100),
			y: clamp(item.y, 20000),
		})),
	};
}

function isSaveData(value: unknown): value is SaveData {
	if (typeof value !== "object" || value === null) return false;
	return Array.isArray((value as SaveData).saved) && Array.isArray((value as SaveData).failed);
}

const post = (body: unknown) =>
	Micro.tryPromise({
		try: async (signal) => {
			const response = await fetch(ENDPOINT, {
				method: "POST",
				credentials: "same-origin",
				headers: { "Content-Type": "application/json", "X-EmDash-Request": "1" },
				body: JSON.stringify(body),
				signal,
			});
			if (response.status === 401 || response.status === 403) {
				throw new PublishError("forbidden", false);
			}
			if (response.status >= 500) throw new PublishError("server", true);
			if (!response.ok) throw new PublishError("invalid", false);
			const json: unknown = await response.json();
			const data = (json as { data?: unknown }).data;
			if (!isSaveData(data)) throw new PublishError("invalid", false);
			return data;
		},
		catch: (error) => (error instanceof PublishError ? error : new PublishError("network", true)),
	});

/** 今の並べ方を公開する。失敗しても reject せず、結果の種類を返す */
export async function publishLayout(): Promise<PublishResult> {
	const items = getBoardLayout();
	if (items.length === 0) return { status: "empty" };

	const program = post(toPayload(items)).pipe(
		Micro.retry({ times: 2, while: (error) => error.retryable }),
		Micro.timeout(TIMEOUT_MS),
		Micro.map((data): PublishResult => {
			if (data.error) return { status: "error", kind: "invalid" };
			return { status: "done", saved: data.saved.length, failed: data.failed };
		}),
		Micro.catchAll((error): Micro.Micro<PublishResult> => {
			const kind = error instanceof PublishError ? error.kind : "timeout";
			return Micro.succeed({ status: "error", kind });
		}),
	);
	return Micro.runPromise(program);
}

/** 結果を、利用者に見せる短い日本語にする */
export function describeResult(result: PublishResult): string {
	switch (result.status) {
		case "empty":
			return "自由配置のときだけ公開できます（広い画面で、整頓モードを切ってください）";
		case "done": {
			if (result.failed.length === 0) return `${result.saved} 枚の並べ方を公開しました`;
			return `${result.saved} 枚を公開しました。${result.failed.length} 枚は公開できませんでした（公開前の下書きなど）`;
		}
		case "error":
			if (result.kind === "forbidden") return "公開する権限がありません（編集者以上でログインしてください）";
			if (result.kind === "timeout") return "時間がかかりすぎたので止めました。もう一度どうぞ";
			if (result.kind === "network") return "つながりませんでした。通信を確かめて、もう一度どうぞ";
			return "公開できませんでした。もう一度どうぞ";
	}
}

let clearTimer = 0;

/** FAB の近くの role="status" に、進み具合と結果を出す */
export async function publishBoardLayout(status: HTMLElement | null): Promise<PublishResult> {
	window.clearTimeout(clearTimer);
	if (status) status.textContent = "公開しています…";
	const result = await publishLayout();
	if (status) {
		status.textContent = describeResult(result);
		clearTimer = window.setTimeout(() => {
			status.textContent = "";
		}, MESSAGE_MS);
	}
	return result;
}
