/** ドラッグで動かす（マウスなど、細かく指せる入力のときだけ） */
import type { Point } from "./layout";

const DRAG_THRESHOLD = 6;

export interface DragHost {
	board: HTMLElement;
	/** 自由配置で、細かく指せる入力か */
	canDrag(): boolean;
	getPosition(li: HTMLLIElement): Point;
	setPosition(li: HTMLLIElement, point: Point): void;
	onStart(li: HTMLLIElement): void;
	onEnd(li: HTMLLIElement): void;
}

export function attachDrag(li: HTMLLIElement, host: DragHost): void {
	let startX = 0;
	let startY = 0;
	let origin: Point = { x: 0, y: 0 };
	let dragging = false;
	let pointerId: number | null = null;
	let target: Point | null = null;
	let frame = 0;

	/** pointermove は 1 フレームに何度も来るので、置くのは 1 フレームに 1 回にする */
	function flush() {
		frame = 0;
		if (!target || !dragging) return;
		const maxX = host.board.clientWidth - li.offsetWidth;
		host.setPosition(li, {
			x: Math.min(Math.max(target.x, 0), maxX),
			y: Math.max(target.y, 0),
		});
		target = null;
	}

	li.addEventListener("pointerdown", (event) => {
		if (!host.canDrag() || event.button !== 0) return;
		pointerId = event.pointerId;
		startX = event.clientX;
		startY = event.clientY;
		origin = host.getPosition(li);
		dragging = false;
	});

	li.addEventListener("pointermove", (event) => {
		if (pointerId !== event.pointerId) return;
		const dx = event.clientX - startX;
		const dy = event.clientY - startY;
		if (!dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
		if (!dragging) {
			dragging = true;
			li.setPointerCapture(event.pointerId);
			li.classList.add("is-dragging");
			host.onStart(li);
		}
		target = { x: origin.x + dx, y: origin.y + dy };
		if (!frame) frame = requestAnimationFrame(flush);
		event.preventDefault();
	});

	function finish(event: PointerEvent) {
		if (pointerId !== event.pointerId) return;
		pointerId = null;
		if (!dragging) return;
		if (frame) cancelAnimationFrame(frame);
		flush();
		dragging = false;
		li.classList.remove("is-dragging");
		host.onEnd(li);
		// ドラッグの直後のクリックで、リンクが開かないようにする
		const swallow = (e: Event) => {
			e.preventDefault();
			e.stopPropagation();
		};
		li.addEventListener("click", swallow, { capture: true, once: true });
		// クリックが来なかったときに、次のクリックまで消してしまわないようにする
		window.setTimeout(() => li.removeEventListener("click", swallow, { capture: true }), 80);
	}

	li.addEventListener("pointerup", finish);
	li.addEventListener("pointercancel", finish);
	// 画像やリンクをブラウザ標準でドラッグしないようにする
	li.addEventListener("dragstart", (event) => event.preventDefault());
}
