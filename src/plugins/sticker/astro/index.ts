import Sticker from "./Sticker.astro";

// この名前（blockComponents）で出すと、<PortableText> が自動で使う
export const blockComponents = {
	sticker: Sticker,
};
