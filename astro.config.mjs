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
	fonts: [
		{
			// 見出し用：太くて主張の強いゴシック
			provider: slimGoogle({ kanjiSlices: 30 }),
			name: "Dela Gothic One",
			cssVariable: "--font-heading",
			weights: [400],
			fallbacks: ["sans-serif"],
		},
		{
			// 本文用：丸くて読みやすいゴシック
			provider: slimGoogle({ kanjiSlices: 30 }),
			name: "Zen Maru Gothic",
			cssVariable: "--font-body",
			weights: [400, 700],
			fallbacks: ["system-ui", "sans-serif"],
		},
		{
			// 手書きメモ用
			provider: slimGoogle({ kanjiSlices: 30 }),
			name: "Yomogi",
			cssVariable: "--font-hand",
			weights: [400],
			fallbacks: ["cursive"],
		},
	],
	devToolbar: { enabled: false },
});
