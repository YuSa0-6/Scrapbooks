/**
 * ステッカーブロック・プラグイン本体（管理画面の設定）。
 * 本文エディタで「/」を押すと「ステッカー」が選べるようになる。
 */
import { definePlugin } from "emdash";
import { STICKER_PLUGIN_ID } from "./descriptor";
import { stickerColors, stickerShapes } from "./options";

export function createPlugin() {
	return definePlugin({
		id: STICKER_PLUGIN_ID,
		version: "0.1.0",
		admin: {
			portableTextBlocks: [
				{
					type: "sticker",
					label: "ステッカー",
					description: "本文にシールや吹き出しを貼る",
					category: "スクラップブック",
					placeholder: "ここが推し",
					fields: [
						// action_id が "id" の項目は、ブロックの「主な値」として扱われる
						{ type: "text_input", action_id: "id", label: "ことば（10 文字くらいまで）" },
						{
							type: "select",
							action_id: "shape",
							label: "かたち",
							options: stickerShapes.map(({ value, label }) => ({ value, label })),
						},
						{
							type: "select",
							action_id: "color",
							label: "いろ",
							options: stickerColors.map(({ value, label }) => ({ value, label })),
						},
						{
							type: "toggle",
							action_id: "decorative",
							label: "飾りとして扱う（読み上げない）",
							initial_value: true,
						},
					],
				},
			],
		},
	});
}

export default createPlugin;
