/** カードの置き場所を決める。位置は translate で置き、left / top は動かさない */
import { hash } from "../../lib/pieces";
import type { Saved } from "./storage";

export interface Point {
	x: number;
	y: number;
}

export type Positions = Map<HTMLLIElement, Point>;

/** いちばん下のカードの下に空ける余白（px） */
const BOTTOM_SPACE = 80;

export function pieceId(li: HTMLLIElement): string {
	return li.dataset.pieceId ?? "";
}

export function applyPosition(li: HTMLLIElement, point: Point): void {
	li.style.translate = `${Math.round(point.x)}px ${Math.round(point.y)}px`;
}

export function clearPosition(li: HTMLLIElement): void {
	li.style.removeProperty("translate");
}

/** 自動でばらまく：一番低い列に、少しずらして置いていく（石垣のように） */
export function autoPositions(width: number, items: HTMLLIElement[], random = false): Positions {
	const cols = Math.max(2, Math.floor(width / 300));
	const colW = width / cols;
	const heights = new Array<number>(cols).fill(0);
	const result: Positions = new Map();
	for (const li of items) {
		const seed = random ? Math.floor(Math.random() * 1e6) : hash(pieceId(li));
		const col = random ? seed % cols : heights.indexOf(Math.min(...heights));
		const w = li.offsetWidth;
		const jitterX = (seed % 60) - 30;
		const jitterY = Math.floor(seed / 60) % 40;
		const x = Math.min(Math.max(col * colW + (colW - w) / 2 + jitterX, 0), width - w);
		const y = (heights[col] ?? 0) + jitterY;
		heights[col] = y + li.offsetHeight + 36;
		result.set(li, { x, y });
	}
	return result;
}

/**
 * 全カードの位置を決める。
 * 優先順位：この端末で動かした位置 → CMS の board_x / board_y → 自動配置
 */
export function resolvePositions(width: number, pieces: HTMLLIElement[], saved: Saved): Positions {
	const auto = autoPositions(
		width,
		pieces.filter((li) => !saved[pieceId(li)] && li.dataset.x === undefined),
	);
	const result: Positions = new Map();
	for (const li of pieces) {
		const remembered = saved[pieceId(li)];
		const room = width - li.offsetWidth;
		if (remembered) {
			result.set(li, { x: remembered.x * room, y: remembered.y });
		} else if (li.dataset.x !== undefined) {
			const percent = Math.min(100, Math.max(0, Number(li.dataset.x)));
			result.set(li, { x: (percent / 100) * room, y: Number(li.dataset.y ?? 0) });
		} else {
			result.set(li, auto.get(li) ?? { x: 0, y: 0 });
		}
	}
	return result;
}

/** 保存用の形（x は幅に対する割合）にする */
export function toSaved(li: HTMLLIElement, point: Point, width: number): { x: number; y: number } {
	return { x: point.x / Math.max(1, width - li.offsetWidth), y: point.y };
}

/** ボードの高さ：いちばん下のカードの下まで */
export function boardHeight(positions: Positions): number {
	let bottom = 0;
	for (const [li, point] of positions) {
		bottom = Math.max(bottom, point.y + li.offsetHeight);
	}
	return Math.ceil(bottom + BOTTOM_SPACE);
}
