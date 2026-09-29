/** この端末（localStorage）に、動かしたカードの位置を保存する */

const STORAGE_KEY = "scrapbook:board:v1";

/** x はボードの幅に対する割合（0〜1）、y は px */
export type Saved = Record<string, { x: number; y: number }>;

/** 保存された値を確かめて読む。形が違うもの（null・配列・数でない x/y）は捨てる */
export function loadSaved(): Saved {
	let parsed: unknown;
	try {
		parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
	} catch {
		return {};
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
	const saved: Saved = {};
	for (const [id, value] of Object.entries(parsed)) {
		if (!value || typeof value !== "object") continue;
		const { x, y } = value as { x?: unknown; y?: unknown };
		if (typeof x === "number" && Number.isFinite(x) && typeof y === "number" && Number.isFinite(y)) {
			saved[id] = { x, y };
		}
	}
	return saved;
}

export function saveAll(saved: Saved): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
	} catch {
		// 保存できない環境（プライベートモードなど）では、その場限りにする
	}
}

export function clearSaved(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// 何もしない
	}
}
