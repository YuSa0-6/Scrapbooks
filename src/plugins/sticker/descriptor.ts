/**
 * ステッカーブロック・プラグインの登録情報（astro.config.mjs から読む）。
 *
 * 本文（Portable Text）に「ステッカー」ブロックを足す。
 * 本文のブロックを増やすには、サイトの中で動く native プラグインが必要なので、
 * レジストリ用の sandboxed プラグインではなく、このサイトの中に置いている。
 */
import type { PluginDescriptor } from "emdash";

export const STICKER_PLUGIN_ID = "scrapbook-sticker";

export function stickerPlugin(): PluginDescriptor {
	return {
		id: STICKER_PLUGIN_ID,
		version: "0.1.0",
		format: "native",
		entrypoint: "#plugins/sticker",
		componentsEntry: "#plugins/sticker/astro",
		options: {},
	};
}
