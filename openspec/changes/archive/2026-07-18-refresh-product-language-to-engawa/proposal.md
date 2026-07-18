## Why

現在の「退避」は、撮影後の行為、未決定の置き場所、完了演出、取り消しまでを一語で担っており、機能は伝わる一方で不断捨離の世界観を十分に表せていない。「候補」も機能名のままで、青い開いた円相が示す未決定の居場所に対して言葉が追いついていない。

撮影した記録を作る行為を「写しを収める」、捨てる／残すを決めないモノの居場所を「縁側」と呼び分ける。既存の「手放す→捨離」はそのまま残し、わかりやすさを保ったままプロダクト固有の語彙体系へ刷新する。

## What Changes

- コアコピーを「決断しないで、退避する」から **「決めずに、写しを収める。」** へ更新する。
- 撮影後に item を作るユーザー行為を **「写しを収める」** と呼び、主要アクションを「写しを収めて、次を撮る」「写しを収めて、書き留める」とする。
- user-facing な候補（内部 `status='candidate'`）を **「縁側」** と呼び、「捨てるでも、残すでもない。ここは、モノの縁側です。」と説明する。
- 既存の **「手放す→捨離」** という行為と移り先の関係、および「手放し済み」の状態表現は変更しない。
- 青い開いた円相を「写しは収まったが、判断はまだ開いている縁側」と意味づけ直す。グレー円相の手放し確認、朱の閉じた円相の手放し完了という意味、円相アセット、色、アニメーション自体は変更しない。
- 実際に item と写真を削除する直後の撤回は「今の記録を取り消す」と明示する。端末ライブラリへの実保存では「保存」を引き続き使用する。
- 画面コピー、エラー、アクセシビリティラベル、権限説明、正本ドキュメント、active spec を同じ語彙へ同期する。

Non-goals:

- `candidate` / `discarded`、`released_at`、React Navigation のルート名、コンポーネント名、DBスキーマは変更しない。データ移行を行わない。
- 画面数、画面遷移、円相アセット、色、レイアウト、アニメーションを変更しない。
- バックエンド・アカウント・クラウド同期は追加しない。ローカルファーストを守る。
- archive 済みの OpenSpec change は当時の履歴として書き換えない。

## Capabilities

### New Capabilities

- `product-language`: 「写しを収める／縁側／捨離」のユーザー向け語彙体系、説明コピー、実際の保存・削除との使い分けを定める。

### Modified Capabilities

- `capture`: 撮影後の主要アクション、完了、撤回、縁側への導線を新しい語彙へ変更する。
- `candidate-workbench`: user-facing な候補一覧を「縁側」と呼び、空状態で意味を説明する。
- `release`: 「手放す→捨離」は維持し、候補へ戻す導線だけを「もう一度、縁側へ」へ変更する。
- `enso-motif`: 青・灰・朱の円相を新しい語彙体系へ対応づける。

## Impact

- UI: `CaptureScreen`, `EvacuationCompleteScreen`, `EmptyState`, `BottomNav`, `CandidateListScreen`, `ReleaseCompleteScreen`, `DiscardedDetailScreen`。
- 設定: `app.json` と生成済み `ios/app/Info.plist` のカメラ権限説明。ネイティブ権限文言の反映には新しいアプリバイナリが必要。
- 正本: `AGENTS.md`, `docs/design/design_handoff_indecision_declutter`, `docs/PHILOSOPHY.md`, `docs/specs/product-spec.md`, `README.md`, `openspec/config.yaml`, active specs。
- テスト: UIコピーの期待値、アクセシビリティラベル、旧語彙の残存監査。データ層・永続化テストへの仕様変更はない。
