// Google Fonts の日本語フォントは、文字の範囲ごとに約 120 枚の @font-face に分かれて届く。
// 全部を HTML に入れると、最初のレイアウトが重くなる（CPU 4 倍で約 1.7 秒）ため、
// 「基本の文字」と「よく使う漢字」の面だけを残す。残りの漢字は端末の日本語フォントで表示する。
// 理由と数値は docs/architecture/performance.md の「フォント」にある。

import { fontProviders } from "astro/config";

// 漢字を含む面かどうかの判定に使う、JIS X 0208 第 1 水準の漢字（約 2,965 字）
const commonKanji = (() => {
	const decoder = new TextDecoder("euc-jp");
	const set = new Set();
	for (let row = 16; row <= 47; row++) {
		for (let cell = 1; cell <= 94; cell++) {
			const ch = decoder.decode(new Uint8Array([0xa0 + row, 0xa0 + cell]));
			if (ch.length === 1 && ch !== "\uFFFD") set.add(ch.codePointAt(0));
		}
	}
	return set;
})();

/** "U+3040-30ff, U+30fb" を [[開始, 終了], ...] にする */
const parseRanges = (ranges) =>
	(ranges ?? []).flatMap((part) => {
		const m = /^U\+([0-9a-f]+)(?:-([0-9a-f]+))?$/i.exec(part.trim());
		if (!m) return [];
		const lo = Number.parseInt(m[1], 16);
		return [[lo, m[2] ? Number.parseInt(m[2], 16) : lo]];
	});

const covers = (ranges, cp) => ranges.some(([lo, hi]) => cp >= lo && cp <= hi);

/** 面の種類：latin（半角）・kana（かな・記号）・kanji（第 1 水準の漢字を含む）・other */
function classify(ranges) {
	if (ranges.length === 0) return "latin";
	if (covers(ranges, 0x41)) return "latin";
	if (covers(ranges, 0x3042) || covers(ranges, 0x30a2)) return "kana";
	for (const cp of commonKanji) if (covers(ranges, cp)) return "kanji";
	return "other";
}

/**
 * Google のプロバイダーを包み、面を絞る。
 *
 * Google の日本語フォントは、漢字の面が「よく使う順」に並んでいる（あとの面ほどよく使う。
 * 「日」「本」「人」「見」などは最後のほうの 1 枚に入っている）。
 * そこで、漢字の面は太さ・スタイルごとに、うしろから数えて kanjiSlices 枚だけ残す。
 *
 * @param {{ kanjiSlices: number }} options 残す「漢字の面」の数
 */
export function slimGoogle({ kanjiSlices }) {
	const google = fontProviders.google();
	return {
		...google,
		async resolveFont(options) {
			const result = await google.resolveFont(options);
			if (!result) return result;
			const fonts = Array.isArray(result) ? result : result.fonts;
			const tagged = fonts.map((font) => ({
				font,
				kind: classify(parseRanges(font.unicodeRange)),
				key: `${font.weight}|${font.style}`,
			}));
			// 漢字の面は、あとから数えて何枚目か（0 が最後）
			const fromEnd = new Map();
			const counters = new Map();
			for (let i = tagged.length - 1; i >= 0; i--) {
				const { kind, key } = tagged[i];
				if (kind !== "kanji") continue;
				const n = counters.get(key) ?? 0;
				counters.set(key, n + 1);
				fromEnd.set(i, n);
			}
			const kept = tagged
				.filter(
					({ kind }, i) =>
						kind === "latin" || kind === "kana" || (kind === "kanji" && fromEnd.get(i) < kanjiSlices),
				)
				.map(({ font, kind }) =>
					kind === "latin" || kind === "kana" ? { ...font, meta: { ...font.meta, subset: kind } } : font,
				);
			return Array.isArray(result) ? kept : { ...result, fonts: kept };
		},
	};
}
