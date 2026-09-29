import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2, sandbox } from "@emdash-cms/cloudflare";
import boardLayout from "board-layout";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { slimGoogle } from "./config/slim-fonts.mjs";
import { stickerPlugin } from "./src/plugins/sticker/descriptor.ts";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			// 本文にステッカーを貼るブロック（src/plugins/sticker）
			plugins: [stickerPlugin()],
			// 並べ方を公開するプラグイン（plugins/board-layout）。Worker Loader の隔離の中で動かす
			sandboxed: [boardLayout],
			sandboxRunner: sandbox(),
		}),
	],
	// 日本語の Web フォントは Klee One 600 の 1 つだけ（見出し・手書きメモ・サイト名）。
	// 本文・ボタン・メニューは端末の日本語フォントで、src/styles/theme.css の --font-body にある。
	// 理由と数値は docs/decisions/fonts.md
	fonts: [
		{
			provider: slimGoogle({ kanjiSlices: 30 }),
			name: "Klee One",
			cssVariable: "--font-hand",
			weights: [600],
			fallbacks: ["Hiragino Maru Gothic ProN", "Yu Gothic UI", "Noto Sans JP", "sans-serif"],
		},
	],
	devToolbar: { enabled: false },
});
