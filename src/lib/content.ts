/**
 * EmDash の読み込みを Effect にくるむ（サーバー専用。ブラウザ向けの JS からは読み込まない）。
 *
 * - 失敗は ContentLoadError にそろえる（どの読み込みか・原因は何か）
 * - 結果の error フィールドも失敗として扱う
 * - cacheHint は EmDash の結果にそのまま入っている。ページが Astro.cache.set に渡す
 * - ページの境目で runPage を使うと、失敗と時間切れ（5 秒）が 500 の Response になる
 */
import { Data, Effect } from "effect";
import {
	getEmDashCollection,
	getEmDashEntry,
	getSiteSettings,
	getTaxonomyTermsWithCacheHint,
	getTermsForEntries,
	type CollectionFilter,
} from "emdash";

/** ページ 1 枚ぶんの読み込みにかける時間の上限 */
const PAGE_TIMEOUT = "5 seconds";

/** 読み込みの失敗。source はどの読み込みか（例：`collection:projects`） */
export class ContentLoadError extends Data.TaggedError("ContentLoadError")<{
	readonly source: string;
	readonly cause: unknown;
}> {
}

/** ログに出す 1 行の説明 */
function describe(failure: ContentLoadError | { readonly _tag: string }): string {
	if (failure._tag !== "ContentLoadError") return "時間切れ（5 秒）";
	const { source, cause } = failure as ContentLoadError;
	return `${source} を読み込めませんでした：${cause instanceof Error ? cause.message : String(cause)}`;
}

/** error フィールドを持つ結果（getEmDashCollection / getEmDashEntry）を Effect にする */
function fromResult<R extends { readonly error?: Error }>(
	source: string,
	run: () => Promise<R>,
): Effect.Effect<R, ContentLoadError> {
	return Effect.tryPromise({
		try: run,
		catch: (cause) => new ContentLoadError({ source, cause }),
	}).pipe(
		Effect.flatMap((result) =>
			result.error
				? Effect.fail(new ContentLoadError({ source, cause: result.error }))
				: Effect.succeed(result),
		),
	);
}

/** 例外で失敗する読み込み（error フィールドがないもの）を Effect にする */
function fromPromise<A>(source: string, run: () => Promise<A>): Effect.Effect<A, ContentLoadError> {
	return Effect.tryPromise({
		try: run,
		catch: (cause) => new ContentLoadError({ source, cause }),
	});
}

/** コレクションの一覧。結果に entries・nextCursor・cacheHint が入る */
export const loadCollection = <T extends string>(type: T, filter?: CollectionFilter) =>
	fromResult(`collection:${type}`, () => getEmDashCollection(type, filter));

/** 1 件。見つからないときは失敗ではなく entry が null（ページが 404 にする） */
export const loadEntry = <T extends string>(type: T, id: string) =>
	fromResult(`entry:${type}/${id}`, () => getEmDashEntry(type, id));

/** タクソノミーの用語。結果は { data, cacheHint } */
export const loadTaxonomyTerms = (
	name: string,
	options?: Parameters<typeof getTaxonomyTermsWithCacheHint>[1],
) => fromPromise(`taxonomy:${name}`, () => getTaxonomyTermsWithCacheHint(name, options));

/** 複数の項目の用語をまとめて取る（1 回の JOIN）。結果は 項目の id → 用語の Map */
export const loadTermsForEntries = (collection: string, entryIds: string[], taxonomy: string) =>
	fromPromise(`terms:${collection}/${taxonomy}`, () =>
		getTermsForEntries(collection, entryIds, taxonomy),
	);

/** サイト設定（タイトル・キャッチコピーなど） */
export const loadSiteSettings = () => fromPromise("site-settings", () => getSiteSettings());

/**
 * ページの境目で Effect を実行する。
 * 成功なら値を返し、ContentLoadError と時間切れ（5 秒）は 500 の Response にする。
 * 呼び出し側は `if (loaded instanceof Response) return loaded;` で受ける。
 */
export function runPage<A>(
	program: Effect.Effect<A, ContentLoadError>,
	message = "Could not load the page",
): Promise<A | Response> {
	return Effect.runPromise(
		program.pipe(
			Effect.timeout(PAGE_TIMEOUT),
			Effect.catchAll((failure) =>
				Effect.sync(() => {
					console.error(`[content] ${describe(failure)}`);
					return new Response(message, { status: 500 });
				}),
			),
		),
	);
}
