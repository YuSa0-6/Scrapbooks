/** 表紙のボードに並べる「切り抜き」（絵とコード）で共通の小さな道具 */

/** 文字列から 0 以上の整数を作る（毎回同じ値になる） */
export function hash(text: string): number {
	let h = 2166136261;
	for (const ch of text) {
		h ^= ch.codePointAt(0)!;
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

/** CMS の傾きが空なら、id から -4〜4 度の傾きを決める */
export function tiltFor(id: string, tilt?: number | null): number {
	if (typeof tilt === "number" && Number.isFinite(tilt)) return Math.max(-20, Math.min(20, tilt));
	return (hash(id) % 81) / 10 - 4;
}

const tapes = ["var(--c-yellow)", "var(--c-pink)", "var(--c-cyan)", "var(--c-green)"];
const stickers = ["var(--c-pink)", "var(--c-yellow)", "var(--c-green)", "var(--c-purple)"];

export function tapeColor(id: string): string {
	return tapes[hash(id) % tapes.length]!;
}

export function stickerColor(id: string): string {
	return stickers[hash(`${id}:s`) % stickers.length]!;
}

/** View Transitions で使う名前（ULID なので英数字だけ） */
export function transitionName(kind: "art" | "code", dbId: string): string {
	return `${kind}-${dbId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** 言語の表示名 */
export function languageLabel(language: string | undefined): string {
	const labels: Record<string, string> = {
		html: "HTML",
		css: "CSS",
		javascript: "JavaScript",
		typescript: "TypeScript",
		python: "Python",
		glsl: "GLSL",
		shell: "Shell",
	};
	return (language && labels[language]) || "コード";
}

/** 抜粋：先頭の数行だけ取り出す */
export function excerptLines(code: string, lines = 10): string {
	const all = code.replace(/\t/g, "  ").split("\n");
	const head = all.slice(0, lines).join("\n");
	return all.length > lines ? `${head}\n…` : head;
}
