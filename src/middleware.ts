/**
 * 初期設定のロック（仕様：docs/architecture/setup-lock.md）
 *
 * 本番では、合言葉（Worker の秘密 SETUP_KEY）を知っている人だけが EmDash の初期設定を進められる。
 *
 * | リクエスト | 本番での扱い |
 * | --- | --- |
 * | /_emdash/api/setup/*（status を除く） | Cookie scrapbook_setup が SETUP_KEY と一致しないと 403 |
 * | /_emdash/admin*?setup_key=… | 一致したら Cookie を付けて、同じ URL（setup_key なし）へ移動 |
 * | SETUP_KEY が未設定 | 初期設定は一切できない（閉じた側に倒す） |
 *
 * 順番：EmDash 自身のミドルウェアは order: "pre" で登録されるため、この関数より先に動く。
 * 初期設定の前は EmDash が /_emdash/admin を /_emdash/admin/setup へ移すので、
 * 合言葉つきの URL は /_emdash/admin/setup?setup_key=… の形で開く。
 */
import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";

const COOKIE_NAME = "scrapbook_setup";
const COOKIE_PATH = "/_emdash";
const COOKIE_MAX_AGE_SECONDS = 60 * 60;
const KEY_PARAM = "setup_key";
const SETUP_API = "/_emdash/api/setup";
const SETUP_STATUS = "/_emdash/api/setup/status";
const ADMIN = "/_emdash/admin";

const encoder = new TextEncoder();

/** Cloudflare の秘密（環境変数）から合言葉を読む。空なら未設定として扱う */
function readSetupKey(): string | undefined {
	const value = (env as { SETUP_KEY?: unknown }).SETUP_KEY;
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * 長さによらず同じ時間で比べる。
 * どちらも SHA-256 で 32 バイトにそろえてから、全部のバイトを見て差を集める。
 */
async function safeEqual(a: string, b: string): Promise<boolean> {
	const [hashA, hashB] = await Promise.all([
		crypto.subtle.digest("SHA-256", encoder.encode(a)),
		crypto.subtle.digest("SHA-256", encoder.encode(b)),
	]);
	const bytesA = new Uint8Array(hashA);
	const bytesB = new Uint8Array(hashB);
	let diff = 0;
	for (let i = 0; i < bytesA.length; i++) diff |= bytesA[i]! ^ bytesB[i]!;
	return diff === 0;
}

/**
 * 判定用にパスをそろえる。Astro は経路を照合するときにパーセント記号を戻すため、
 * 同じように戻し、連続するスラッシュ・末尾のスラッシュ・「.」「..」・大文字小文字をならす。
 */
function normalizePath(raw: string): string {
	let path = raw;
	try {
		path = decodeURIComponent(raw);
	} catch {
		// 戻せない形はそのまま判定する
	}
	const segments: string[] = [];
	for (const segment of path.toLowerCase().split("/")) {
		if (segment === "" || segment === ".") continue;
		if (segment === "..") segments.pop();
		else segments.push(segment);
	}
	return `/${segments.join("/")}`;
}

function isProtectedSetupApi(path: string): boolean {
	if (path !== SETUP_API && !path.startsWith(`${SETUP_API}/`)) return false;
	return path !== SETUP_STATUS;
}

function isAdmin(path: string): boolean {
	return path === ADMIN || path.startsWith(`${ADMIN}/`);
}

function readCookie(header: string | null, name: string): string | undefined {
	if (!header) return undefined;
	for (const part of header.split(";")) {
		const index = part.indexOf("=");
		if (index === -1 || part.slice(0, index).trim() !== name) continue;
		const raw = part.slice(index + 1).trim();
		try {
			return decodeURIComponent(raw);
		} catch {
			return undefined;
		}
	}
	return undefined;
}

/** 合言葉つきの URL で来た人に、Cookie を付けて合言葉なしの同じ URL へ移す */
function redirectWithCookie(url: URL, key: string): Response {
	const rest = new URLSearchParams(url.search);
	rest.delete(KEY_PARAM);
	const query = rest.toString();
	const cookie = [
		`${COOKIE_NAME}=${encodeURIComponent(key)}`,
		`Path=${COOKIE_PATH}`,
		`Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
		"HttpOnly",
		"Secure",
		"SameSite=Strict",
	].join("; ");
	return new Response(null, {
		status: 302,
		headers: {
			Location: `${url.pathname}${query ? `?${query}` : ""}`,
			"Set-Cookie": cookie,
			"Cache-Control": "no-store",
			"Referrer-Policy": "no-referrer",
		},
	});
}

function locked(): Response {
	return Response.json(
		{ error: { code: "SETUP_LOCKED", message: "Setup is locked" } },
		{ status: 403, headers: { "Cache-Control": "no-store" } },
	);
}

export const onRequest = defineMiddleware(async (context, next) => {
	// 開発中はロックしない
	if (!import.meta.env.PROD) return next();

	const path = normalizePath(context.url.pathname);
	const setupApi = isProtectedSetupApi(path);
	const admin = isAdmin(path);
	if (!setupApi && !admin) return next();

	const secret = readSetupKey();

	// 管理画面：合言葉つきの URL なら Cookie を付ける。それ以外は EmDash にまかせる
	if (admin) {
		const given = context.url.searchParams.get(KEY_PARAM);
		if (given !== null && secret && (await safeEqual(given, secret))) {
			return redirectWithCookie(context.url, secret);
		}
		return next();
	}

	// 初期設定の API：Cookie が合言葉と一致したときだけ通す。未設定なら閉じる
	const cookie = readCookie(context.request.headers.get("cookie"), COOKIE_NAME);
	if (secret && cookie !== undefined && (await safeEqual(cookie, secret))) {
		return next();
	}
	return locked();
});
