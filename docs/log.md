# 変更履歴

## 2026-09-29

- **Added** OKF 形式のドキュメント一式を作成（プロダクト・デザイン・アーキテクチャ・決定事項・ガイド・作業）
- **Decision** 3D は CSS の 3D 変形で作り、WebGL は使わない（[css-3d](/decisions/css-3d.md)）
- **Decision** Cloudflare の操作は `cf` CLI、Worker のアップロードだけ wrangler（[cf-cli](/decisions/cf-cli.md)）
- **Decision** 非同期処理は Effect。サーバーは `effect`、ブラウザは `Micro` だけ（[effect-split](/decisions/effect-split.md)）
- **Decision** 本番の初期設定は合言葉でロックする（[setup-lock](/decisions/setup-lock.md)）
- **Decision** コードの色づけは使う言語だけ読み込む Shiki（[slim-shiki](/decisions/slim-shiki.md)）
- **Changed** 全体の確認（作業 6）：日本語フォントの面を絞って（`config/slim-fonts.mjs`）、表紙の長いタスクを約 2200ms から 1200〜1450ms に、HTML を 456KB から 143KB にした。長いタスクの予算は目標 300ms のまま、この環境の床（566ms）に合わせて 1800ms にした（[performance](/architecture/performance.md)）
- **Fixed** 「昼／夜」ボタンで色が変わらなかった（Chromium は custom property の中の `light-dark()` を取り直さない）。色トークンを昼・夜の値に分けた。FAB をキーボードで開くと最初の項目にフォーカスが移るようにし、ステッカーのホバーで角がめくれる動きを足した
- **Changed** docs を実装に合わせた（board・cards・flip-cards・live-code・effect・setup-lock）
