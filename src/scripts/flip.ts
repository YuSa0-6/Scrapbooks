/**
 * 「裏返す」ボタンの動き。
 *
 * - 押すたびに .flip の data-flipped と、ボタンの aria-pressed を切り替える
 * - 見えていない面は inert にする（Tab で入れず、読み上げもされない）
 * - ボタンで pointerdown を止める：ボードのドラッグは li への pointerdown で始まるので、
 *   ボタンを押したまま動かしてもカードが動かない
 * - 切り替えたら "card:flip" を .flip から送る（live-frames が、見えなくなった iframe を止める）
 */

let started = false;

/** 裏返したことを知らせるイベントの名前 */
export const FLIP_EVENT = "card:flip";

function setFlipped(flip: HTMLElement, flipped: boolean): void {
	const front = flip.querySelector<HTMLElement>("[data-flip-front]");
	const back = flip.querySelector<HTMLElement>("[data-flip-back]");
	const button = flip.querySelector<HTMLButtonElement>("[data-flip-btn]");
	flip.toggleAttribute("data-flipped", flipped);
	if (front) front.inert = flipped;
	if (back) back.inert = !flipped;
	button?.setAttribute("aria-pressed", String(flipped));
	flip.dispatchEvent(new CustomEvent(FLIP_EVENT, { bubbles: true, detail: { flipped } }));
}

export function initFlip(): void {
	if (started) return;
	started = true;
	for (const button of document.querySelectorAll<HTMLButtonElement>("[data-flip-btn]")) {
		button.addEventListener("pointerdown", (event) => event.stopPropagation());
		button.addEventListener("click", () => {
			const flip = button.closest<HTMLElement>("[data-flip]");
			if (flip) setFlipped(flip, !flip.hasAttribute("data-flipped"));
		});
	}
}
