# 変更履歴

## 2026-09-29

- **Added** OKF 形式のドキュメント一式を作成（プロダクト・デザイン・アーキテクチャ・決定事項・ガイド・作業）
- **Decision** 3D は CSS の 3D 変形で作り、WebGL は使わない（[css-3d](/decisions/css-3d.md)）
- **Decision** Cloudflare の操作は `cf` CLI、Worker のアップロードだけ wrangler（[cf-cli](/decisions/cf-cli.md)）
- **Decision** 非同期処理は Effect。サーバーは `effect`、ブラウザは `Micro` だけ（[effect-split](/decisions/effect-split.md)）
- **Decision** 本番の初期設定は合言葉でロックする（[setup-lock](/decisions/setup-lock.md)）
- **Decision** コードの色づけは使う言語だけ読み込む Shiki（[slim-shiki](/decisions/slim-shiki.md)）
