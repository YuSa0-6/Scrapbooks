/**
 * M3E（Material 3 Expressive）風の形を、CSS の clip-path: polygon() で作る。
 *
 * どの形も同じ点の数（POINTS）で作るので、形どうしを transition で
 * なめらかに変形（シェイプモーフ）できる。
 * 形は「中心からの距離 r(θ)」で決める（1 が外周いっぱい）。
 */

const POINTS = 60;

type Radius = (theta: number) => number;

const radii = {
	circle: () => 1,
	// ふちが波打つクッキー（7 つの山）
	cookie: (t) => 0.9 + 0.1 * Math.cos(7 * t),
	// 12 の山がとがった太陽
	sunny: (t) => 0.86 + 0.14 * Math.pow(Math.abs(Math.cos(6 * t)), 0.6),
	// 4 枚の葉のクローバー
	clover: (t) => 0.62 + 0.38 * Math.pow(Math.abs(Math.cos(2 * t)), 0.5),
	// 8 枚の花びら
	flower: (t) => 0.78 + 0.22 * Math.abs(Math.cos(4 * t)),
	// 角の丸い四角（スクワークル）
	squircle: (t) => 1 / Math.pow(Math.pow(Math.abs(Math.cos(t)), 4) + Math.pow(Math.abs(Math.sin(t)), 4), 1 / 4) * 0.96,
} satisfies Record<string, Radius>;

export type ShapeName = keyof typeof radii;

export const shapeNames = Object.keys(radii) as ShapeName[];

export function isShapeName(value: unknown): value is ShapeName {
	return typeof value === "string" && value in radii;
}

/** 形の名前から clip-path の値を作る */
export function shapePolygon(name: ShapeName): string {
	const r = radii[name];
	const points: string[] = [];
	for (let i = 0; i < POINTS; i++) {
		// 上（12 時）から時計回りに点を置く
		const t = (i / POINTS) * Math.PI * 2 - Math.PI / 2;
		const d = Math.min(r(t), 1.42) * 50;
		const x = 50 + d * Math.cos(t);
		const y = 50 + d * Math.sin(t);
		points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
	}
	return `polygon(${points.join(", ")})`;
}

/** CSS 変数としてまとめて出す（:root に入れて使う） */
export function shapeCssVariables(): string {
	return shapeNames.map((name) => `--shape-${name}: ${shapePolygon(name)};`).join("\n");
}
