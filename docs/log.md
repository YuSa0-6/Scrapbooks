# 変更履歴

## 2026-09-29

- **Added** 第 3 段階の作業 2：好きなものの読み込み `pnpm load:favorites`（`scripts/load-favorites.mjs`）。画像・絵・タグ・似顔絵を EmDash の CLI と API で入れ、何度実行しても重複しない。`projects.back_image`（裏の絵）と `pages.avatar`（似顔絵）を足し、絵のカードの裏と about に出す（[favorites](/architecture/favorites.md)・[flip-cards](/design/flip-cards.md)）
- **Changed** 動いている開発用の DB へ項目を足す手順を書いた（[development](/guides/development.md)）
- **Changed** 第 3 段階の作業 1：見た目をスケッチブックにした。色トークン（昼・夜）と共通パーツ（手描きの枠・マスキングテープ・写真コーナー・蛍光ペンの見出し）を `theme.css` に、画用紙・リング綴じ・手書きのメニュー（現在地は赤ペンの丸）を `Base.astro` に、大見出しを `HandTitle`（`RansomTitle` は削除）にした。ボードの案内文を今の機能に合わせた（[sketchbook-style](/design/sketchbook-style.md)）
- **Changed** 日本語の Web フォントを Klee One 600 の 1 つにした。表紙の長いタスクは 1434〜1784ms から 764〜791ms に、フォントのファイルは 148 から 49 になった。長いタスクの予算を 1800ms から 950ms に決め直した（[fonts](/decisions/fonts.md)・[performance](/architecture/performance.md)）

- **Added** スケッチブックの見た目（[sketchbook-style](/design/sketchbook-style.md)）、好きなものの読み込み（[favorites](/architecture/favorites.md)）、第 3 段階の作業（[phase-3](/tasks/phase-3.md)）
- **Decision** 日本語の Web フォントは Klee One 600 だけにする（[fonts](/decisions/fonts.md)）
- **Open Question** 持ち主の写真と絵を公開リポジトリに入れてよいか（[private-media](/decisions/private-media.md)）
- **Changed** 原則を「あたたかい手描き」に変えた。公開の手順に、この作業環境では静的ファイルを上げられないことと Git 連携での出し方を書いた。Micro の大きさを実測の約 7KB に直した

- **Added** OKF 形式のドキュメント一式を作成（プロダクト・デザイン・アーキテクチャ・決定事項・ガイド・作業）
- **Decision** 3D は CSS の 3D 変形で作り、WebGL は使わない（[css-3d](/decisions/css-3d.md)）
- **Decision** Cloudflare の操作は `cf` CLI、Worker のアップロードだけ wrangler（[cf-cli](/decisions/cf-cli.md)）
- **Decision** 非同期処理は Effect。サーバーは `effect`、ブラウザは `Micro` だけ（[effect-split](/decisions/effect-split.md)）
- **Decision** 本番の初期設定は合言葉でロックする（[setup-lock](/decisions/setup-lock.md)）
- **Decision** コードの色づけは使う言語だけ読み込む Shiki（[slim-shiki](/decisions/slim-shiki.md)）
- **Changed** 全体の確認（作業 6）：日本語フォントの面を絞って（`config/slim-fonts.mjs`）、表紙の長いタスクを約 2200ms から 1200〜1450ms に、HTML を 456KB から 143KB にした。長いタスクの予算は目標 300ms のまま、この環境の床（566ms）に合わせて 1800ms にした（[performance](/architecture/performance.md)）
- **Fixed** 「昼／夜」ボタンで色が変わらなかった（Chromium は custom property の中の `light-dark()` を取り直さない）。色トークンを昼・夜の値に分けた。FAB をキーボードで開くと最初の項目にフォーカスが移るようにし、ステッカーのホバーで角がめくれる動きを足した
- **Changed** docs を実装に合わせた（board・cards・flip-cards・live-code・effect・setup-lock）
