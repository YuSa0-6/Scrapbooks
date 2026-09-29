/** この端末（localStorage）に、動かしたカードの位置を保存する */

const STORAGE_KEY = "scrapbook:board:v1";

/** x はボードの幅に対する割合（0〜1）、y は px */
export type Saved = Record<string, { x: number; y: number }>;

export function loadSaved(): Saved {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Saved;
	} catch {
		return {};
	}
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
