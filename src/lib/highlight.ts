/**
 * コードの色づけ（シンタックスハイライト）。
 *
 * Shiki は全部の言語をまとめて読むと Worker が大きくなりすぎるので、
 * このサイトで使う言語とテーマだけを読み込む。
 * 正規表現エンジンは WebAssembly を使わない JavaScript 版にする（Workers で軽く動く）。
 */
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

let highlighter: Promise<HighlighterCore> | undefined;

function getHighlighter(): Promise<HighlighterCore> {
	highlighter ??= createHighlighterCore({
		themes: [import("shiki/dist/themes/github-light.mjs"), import("shiki/dist/themes/github-dark.mjs")],
		langs: [
			import("shiki/dist/langs/html.mjs"),
			import("shiki/dist/langs/css.mjs"),
			import("shiki/dist/langs/javascript.mjs"),
			import("shiki/dist/langs/typescript.mjs"),
			import("shiki/dist/langs/python.mjs"),
			import("shiki/dist/langs/glsl.mjs"),
			import("shiki/dist/langs/shellscript.mjs"),
		],
		engine: createJavaScriptRegexEngine(),
	});
	return highlighter;
}

/** CMS の言語名を、Shiki の言語名に直す */
function toShikiLang(language: string | undefined): string {
	switch (language) {
		case "html":
		case "css":
		case "javascript":
		case "typescript":
		case "python":
		case "glsl":
			return language;
		case "shell":
			return "shellscript";
		default:
			return "text";
	}
}

/**
 * コードを、色つきの HTML にする。
 * 昼・夜の 2 色を CSS 変数（--shiki-light / --shiki-dark）で持たせ、theme.css で切り替える。
 */
export async function highlight(code: string, language: string | undefined): Promise<string> {
	const h = await getHighlighter();
	return h.codeToHtml(code, {
		lang: toShikiLang(language),
		themes: { light: "github-light", dark: "github-dark" },
		defaultColor: false,
	});
}
