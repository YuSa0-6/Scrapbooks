/**
 * 動くコード（iframe）を、見えている間だけ動かす。
 *
 * - HTML には data-srcdoc として持たせ、srcdoc は最初は付けない
 * - 1 つの IntersectionObserver で全部を見る。10% 以上見えたら srcdoc を入れ、出たら空にする
 * - タブが隠れたらすべて止め、戻ったら見えているものだけ動かし直す
 * - 裏返して見えなくなった面（inert）の中の iframe も止める
 */
import { FLIP_EVENT } from "./flip";

const SELECTOR = "iframe[data-srcdoc]";
/** これ以上見えたら動かす */
const VISIBLE_RATIO = 0.1;

/** 10% 以上見えている iframe */
const inView = new Set<HTMLIFrameElement>();
let started = false;
let pageVisible = true;

function shouldRun(frame: HTMLIFrameElement): boolean {
	return pageVisible && inView.has(frame) && !frame.closest("[inert]");
}

function isRunning(frame: HTMLIFrameElement): boolean {
	return (frame.getAttribute("srcdoc") ?? "") !== "";
}

/** 今の状態に合わせて、動かす／止めるを決める（すでにその状態なら何もしない） */
function apply(frame: HTMLIFrameElement): void {
	const run = shouldRun(frame);
	if (run && !isRunning(frame)) frame.srcdoc = frame.dataset.srcdoc ?? "";
	else if (!run && isRunning(frame)) frame.srcdoc = "";
}

function applyAll(root: Document | HTMLElement = document): void {
	for (const frame of root.querySelectorAll<HTMLIFrameElement>(SELECTOR)) apply(frame);
}

/** 読み込み直す（「もう一度」）。いったん空にしてから入れ直す */
export function reloadLiveFrame(frame: HTMLIFrameElement): void {
	if (!shouldRun(frame)) return;
	frame.srcdoc = "";
	requestAnimationFrame(() => apply(frame));
}

export function initLiveFrames(): void {
	if (started) return;
	started = true;
	const frames = document.querySelectorAll<HTMLIFrameElement>(SELECTOR);
	if (frames.length === 0) return;

	pageVisible = document.visibilityState === "visible";
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				const frame = entry.target as HTMLIFrameElement;
				if (entry.intersectionRatio >= VISIBLE_RATIO) inView.add(frame);
				else inView.delete(frame);
				apply(frame);
			}
		},
		{ threshold: VISIBLE_RATIO },
	);
	for (const frame of frames) observer.observe(frame);

	document.addEventListener("visibilitychange", () => {
		pageVisible = document.visibilityState === "visible";
		applyAll();
	});
	// 裏返したとき：IntersectionObserver は面の入れ替わりに気づかないので、こちらで確かめる
	document.addEventListener(FLIP_EVENT, (event) => {
		if (event.target instanceof HTMLElement) applyAll(event.target);
	});
}
