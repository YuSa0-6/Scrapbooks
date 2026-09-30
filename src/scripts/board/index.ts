/**
 * 表紙のボードの入り口。配置・ドラッグ・シャッフル・3D の机をつなぐ。
 *
 * - 広い画面：自由配置（位置は translate で置く）。ドラッグで動かして、位置はこの端末に保存する
 * - せまい画面・整頓モード・JavaScript なし：ふつうの格子
 * - 3D の机は、自由配置で、細かく指せる入力で、動きを減らす設定でないときだけ
 * - 並び順（読み上げ・Tab の順番）は、いつも HTML の順番のまま
 */
import { attachDrag } from "./drag";
import {
	applyPosition,
	autoPositions,
	boardHeight,
	clearPosition,
	pieceId,
	resolvePositions,
	toSaved,
	type Point,
	type Positions,
} from "./layout";
import { createParallax } from "./parallax";
import { clearSaved, loadSaved, saveAll, type Saved } from "./storage";

export type BoardCollection = "projects" | "snippets";

/** ボードの外から使う、カード 1 枚分の位置 */
export interface BoardLayoutItem {
	collection: BoardCollection;
	id: string;
	/** 0〜100：ボードの幅いっぱいに置ける範囲のうち、どこか（CMS の board_x と同じ） */
	x: number;
	/** px：ボードの上から */
	y: number;
}

interface Controller {
	getLayout(): BoardLayoutItem[];
}

/** 重なり順に応じた奥行きの最大（px）。desk-3d の「0〜12px」 */
const DEPTH_MAX = 12;
/** シャッフルの、カードごとの時間のずれ（ms）。Board.astro の CSS と同じ */
const STAGGER_MS = 25;
/** --spring-slow の長さ（ms） */
const SPRING_SLOW_MS = 631;

let current: Controller | null = null;

/**
 * 今の各カードの位置を返す。自由配置でないとき（格子）は空の配列。
 * 作業 5（並べ方の公開）が使う。
 */
export function getBoardLayout(): BoardLayoutItem[] {
	return current?.getLayout() ?? [];
}

export function initBoard(): void {
	if (current) return;
	const board = document.querySelector<HTMLOListElement>("[data-board]");
	if (!board) return;
	const wrap = board.closest<HTMLElement>(".board-wrap") ?? board;
	const hint = document.querySelector<HTMLElement>("[data-board-hint]");
	const root = document.documentElement;
	const wide = matchMedia("(min-width: 761px)");
	const finePointer = matchMedia("(pointer: fine)");
	const coarsePointer = matchMedia("(pointer: coarse)");
	const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

	const pieces = Array.from(board.querySelectorAll<HTMLLIElement>(":scope > .board-piece"));
	const positions: Positions = new Map();
	const parallax = createParallax(wrap, board);
	let saved: Saved = loadSaved();
	/** 重なり順（あとのものほど手前） */
	let stack = [...pieces];
	let zTop = pieces.length;
	let free = false;
	let desk3d = false;
	let modeSent: boolean | null = null;
	let dragging: HTMLLIElement | null = null;
	let signature = "";
	let animateTimer = 0;

	const isTidy = () => root.classList.contains("tidy");

	function readSignature(): string {
		return `${board!.clientWidth}|${pieces.map((li) => li.offsetHeight).join(",")}`;
	}

	function setPosition(li: HTMLLIElement, point: Point) {
		const placed = { x: Math.round(point.x), y: Math.round(point.y) };
		positions.set(li, placed);
		applyPosition(li, placed);
	}

	/** 重なり順を、0〜12px の奥行き（--z）にする */
	function applyDepth() {
		const last = Math.max(1, stack.length - 1);
		stack.forEach((li, i) => {
			li.style.setProperty("--z", `${((i / last) * DEPTH_MAX).toFixed(1)}px`);
		});
	}

	function raise(li: HTMLLIElement) {
		stack = stack.filter((item) => item !== li);
		stack.push(li);
		li.style.zIndex = String(++zTop);
		applyDepth();
	}

	/** ボードの高さだけを直す（カードの位置は動かさない） */
	function updateHeight() {
		const height = `${boardHeight(positions)}px`;
		if (board!.style.getPropertyValue("--board-h") !== height) {
			board!.style.setProperty("--board-h", height);
		}
	}

	function layout() {
		free = wide.matches && !isTidy();
		desk3d = free && !coarsePointer.matches && !reducedMotion.matches;
		board!.classList.toggle("is-free", free);
		board!.classList.toggle("is-3d", desk3d);
		wrap.classList.toggle("is-3d", desk3d);
		parallax.setEnabled(desk3d);
		if (hint) hint.hidden = !(free && finePointer.matches);
		if (modeSent !== free) {
			modeSent = free;
			document.dispatchEvent(new CustomEvent("board:mode", { detail: { free } }));
		}

		if (free) {
			const next = resolvePositions(board!.clientWidth, pieces, saved);
			for (const [li, point] of next) setPosition(li, point);
			updateHeight();
			applyDepth();
		} else {
			positions.clear();
			for (const li of pieces) clearPosition(li);
		}
		parallax.invalidate();
		// 並べ終わったので見せる（それまでは visibility: hidden）
		board!.removeAttribute("data-pending");
		signature = readSignature();
	}

	/** 位置を変えるときは、ばね（--spring-slow）でまとめて動かす */
	function animate(change: () => void) {
		window.clearTimeout(animateTimer);
		if (!reducedMotion.matches) board!.classList.add("is-animating");
		change();
		updateHeight();
		animateTimer = window.setTimeout(
			() => board!.classList.remove("is-animating"),
			SPRING_SLOW_MS + pieces.length * STAGGER_MS + 150,
		);
	}

	function shuffle() {
		if (!free) return;
		const width = board!.clientWidth;
		const next = autoPositions(width, [...pieces].sort(() => Math.random() - 0.5), true);
		animate(() => {
			saved = {};
			for (const [li, point] of next) {
				setPosition(li, point);
				saved[pieceId(li)] = toSaved(li, point, width);
			}
			saveAll(saved);
		});
	}

	function reset() {
		saved = {};
		clearSaved();
		animate(layout);
	}

	// ドラッグで動かす
	for (const li of pieces) {
		attachDrag(li, {
			board,
			canDrag: () => free && finePointer.matches,
			getPosition: (item) => positions.get(item) ?? { x: 0, y: 0 },
			setPosition,
			onStart: (item) => {
				dragging = item;
				raise(item);
			},
			onEnd: (item) => {
				dragging = null;
				const point = positions.get(item);
				if (point) {
					saved[pieceId(item)] = toSaved(item, point, board.clientWidth);
					saveAll(saved);
				}
				updateHeight();
			},
		});
		// キーボードで選んだものは一番上に出す
		li.addEventListener("focusin", () => {
			if (free) raise(li);
		});
	}

	// 大きさが変わったとき（幅・画像やフォントの読み込み）に、高さと自動配置を直す
	const sizeObserver = new ResizeObserver(() => {
		if (dragging) return;
		if (readSignature() !== signature) layout();
	});
	sizeObserver.observe(board);
	for (const li of pieces) sizeObserver.observe(li);

	wide.addEventListener("change", layout);
	coarsePointer.addEventListener("change", layout);
	reducedMotion.addEventListener("change", layout);
	let tidy = isTidy();
	new MutationObserver(() => {
		if (tidy === isTidy()) return;
		tidy = isTidy();
		layout();
	}).observe(root, { attributes: true, attributeFilter: ["class"] });

	document.addEventListener("board:shuffle", shuffle);
	document.addEventListener("board:reset", reset);
	document.addEventListener("board:random", () => {
		const links = pieces
			.map((li) => li.querySelector<HTMLAnchorElement>("a[href]"))
			.filter((link): link is HTMLAnchorElement => link !== null);
		const link = links[Math.floor(Math.random() * links.length)];
		if (link) window.location.href = link.href;
	});

	current = {
		getLayout() {
			if (!free) return [];
			const width = board.clientWidth;
			const round = (value: number) => Math.round(value * 10) / 10;
			return pieces.map((li) => {
				const point = positions.get(li) ?? { x: 0, y: 0 };
				const room = Math.max(1, width - li.offsetWidth);
				return {
					collection: li.dataset.collection === "snippets" ? "snippets" : "projects",
					id: pieceId(li),
					x: round(Math.min(100, Math.max(0, (point.x / room) * 100))),
					y: Math.round(point.y),
				};
			});
		},
	};

	layout();
}
