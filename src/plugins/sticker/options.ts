/** ステッカーの形と色の選択肢。管理画面と表示の両方で使う */

export const stickerShapes = [
	{ value: "cookie", label: "クッキー（ふちが波打つ丸）" },
	{ value: "sunny", label: "おひさま（ギザギザ）" },
	{ value: "flower", label: "お花" },
	{ value: "circle", label: "丸シール" },
	{ value: "bubble", label: "吹き出し" },
	{ value: "label", label: "ラベルテープ" },
] as const;

export const stickerColors = [
	{ value: "yellow", label: "きいろ", css: "var(--c-yellow)" },
	{ value: "pink", label: "ピンク", css: "var(--c-pink)" },
	{ value: "cyan", label: "みずいろ", css: "var(--c-cyan)" },
	{ value: "green", label: "みどり", css: "var(--c-green)" },
	{ value: "purple", label: "むらさき", css: "var(--c-purple)" },
] as const;

export type StickerShape = (typeof stickerShapes)[number]["value"];
export type StickerColor = (typeof stickerColors)[number]["value"];
