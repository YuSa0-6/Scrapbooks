import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";
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
		}),
	],
	fonts: [
		{
			// 見出し用：太くて主張の強いゴシック
			provider: fontProviders.google(),
			name: "Dela Gothic One",
			cssVariable: "--font-heading",
			weights: [400],
			fallbacks: ["sans-serif"],
		},
		{
			// 本文用：丸くて読みやすいゴシック
			provider: fontProviders.google(),
			name: "Zen Maru Gothic",
			cssVariable: "--font-body",
			weights: [400, 700],
			fallbacks: ["system-ui", "sans-serif"],
		},
		{
			// 手書きメモ用
			provider: fontProviders.google(),
			name: "Yomogi",
			cssVariable: "--font-hand",
			weights: [400],
			fallbacks: ["cursive"],
		},
	],
	devToolbar: { enabled: false },
});
