/**
 * 3D の机の視差。ポインターに合わせてボードを最大 ±2.5° 傾ける（角度は CSS 側で決める）。
 *
 * - 更新するのは CSS 変数 --rx / --ry（-1〜1）だけ
 * - pointermove は requestAnimationFrame で 1 フレームに 1 回にまとめ、目標へ少しずつ近づける（lerp）
 * - 近づき切ったらループを止める。ポインターが動くまで何もしない
 * - ボードから出たら 0（平ら）に戻す
 */

/** 目標に近づく速さ（小さいほどゆっくり）。フレームの長さに左右されないよう、時間で決める */
const FOLLOW_MS = 90;
const EPSILON = 0.002;

export interface Parallax {
	setEnabled(on: boolean): void;
	/** ボードの位置や大きさが変わったとき（次の更新で測り直す） */
	invalidate(): void;
}

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

export function createParallax(wrap: HTMLElement, board: HTMLElement): Parallax {
	let enabled = false;
	let pointer: { x: number; y: number } | null = null;
	let rect: DOMRect | null = null;
	let targetX = 0;
	let targetY = 0;
	let currentX = 0;
	let currentY = 0;
	let frame = 0;
	let last = 0;

	function write() {
		board.style.setProperty("--rx", (-currentY).toFixed(4));
		board.style.setProperty("--ry", currentX.toFixed(4));
	}

	function stop() {
		if (frame) cancelAnimationFrame(frame);
		frame = 0;
		board.classList.remove("is-tilting");
	}

	function start() {
		if (frame) return;
		last = 0;
		board.classList.add("is-tilting");
		frame = requestAnimationFrame(tick);
	}

	function tick(now: number) {
		frame = 0;
		if (!enabled) return;
		if (pointer) {
			// ボードのうち、画面に見えている部分の中心を 0 として測る
			rect ??= wrap.getBoundingClientRect();
			const top = Math.max(rect.top, 0);
			const bottom = Math.min(rect.bottom, innerHeight);
			targetX = clamp(((pointer.x - rect.left) / Math.max(1, rect.width)) * 2 - 1);
			targetY = clamp(((pointer.y - top) / Math.max(1, bottom - top)) * 2 - 1);
		}
		const dt = last ? Math.min(now - last, 50) : 16;
		last = now;
		const k = 1 - Math.exp(-dt / FOLLOW_MS);
		currentX += (targetX - currentX) * k;
		currentY += (targetY - currentY) * k;
		const done = Math.abs(targetX - currentX) < EPSILON && Math.abs(targetY - currentY) < EPSILON;
		if (done) {
			currentX = targetX;
			currentY = targetY;
		}
		write();
		if (done) {
			board.classList.remove("is-tilting");
			return;
		}
		frame = requestAnimationFrame(tick);
	}

	wrap.addEventListener(
		"pointermove",
		(event) => {
			if (!enabled || event.pointerType === "touch") return;
			pointer = { x: event.clientX, y: event.clientY };
			start();
		},
		{ passive: true },
	);
	wrap.addEventListener("pointerenter", () => {
		rect = null;
	});
	wrap.addEventListener("pointerleave", () => {
		pointer = null;
		targetX = 0;
		targetY = 0;
		if (enabled) start();
	});
	window.addEventListener("scroll", () => (rect = null), { passive: true });

	return {
		setEnabled(on) {
			if (on === enabled) return;
			enabled = on;
			pointer = null;
			targetX = 0;
			targetY = 0;
			if (!on) {
				stop();
				currentX = 0;
				currentY = 0;
				board.style.removeProperty("--rx");
				board.style.removeProperty("--ry");
			}
		},
		invalidate() {
			rect = null;
		},
	};
}
