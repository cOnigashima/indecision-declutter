# product-language Specification

## Purpose
TBD - created by archiving change refresh-product-language-to-engawa. Update Purpose after archive.
## Requirements
### Requirement: 行為・居場所・変容を呼び分ける

システムは、撮影した写真と記録から item を作るユーザー行為を「写しを収める」、未決定の item（内部 `status='candidate'`）が身を置くuser-facingな場所を「縁側」、itemを記録を保持したまま `status='discarded'` へ移す行為を「手放す」、その移り先を「捨離」と SHALL 呼び分ける。これらを一語へ機械的に統合してはならない（MUST NOT）。

#### Scenario: 写しを収める
- **WHEN** ユーザーが写真を持つ撮影ドラフトから item を作成する
- **THEN** アクションは「写しを収める」と表現され、作成されたitemはuser-facingには縁側に置かれる

#### Scenario: 縁側で未決定のモノを見る
- **WHEN** ユーザーが内部 `status='candidate'` のitem一覧を開く
- **THEN** 画面はその場所を「縁側」と表示し、「候補」をuser-facingな一覧名として表示しない

#### Scenario: 手放して捨離へ移す
- **WHEN** ユーザーが縁側のitemを記録を保持したまま `status='discarded'` へ移す
- **THEN** アクションは「手放す」、移り先は「捨離」、状態は「手放し済み」と表現される

### Requirement: モノの縁側を説明する

システムは、「縁側」が捨てる／残すをまだ決めないモノの居場所であることを、既存フロー内のコピーで SHALL 説明する。説明のためだけの新しいオンボーディング画面や永続フラグを追加してはならない（MUST NOT）。

#### Scenario: 空状態で縁側を知る
- **WHEN** 縁側にitemが無い状態で一覧を開く
- **THEN** 「捨てるでも、残すでもない。ここは、モノの縁側です。」と表示する

#### Scenario: 写しを収めた結果を知る
- **WHEN** 写しを収めた完了画面を表示する
- **THEN** 「写しを収めました」と「このモノは、縁側へ」を表示し、行為と居場所の関係を示す

### Requirement: 実保存と実削除を明確に示す

システムは、端末ライブラリへの実保存では「保存」を、itemと写真を完全に消す直後の撤回では「今の記録を取り消す」を SHALL 使用し、記録を保持する捨離と区別する。通常のitem作成を「保存」「削除」「退避」と呼んではならない（MUST NOT）。

#### Scenario: 画像を端末ライブラリへ保存する
- **WHEN** ユーザーが手放し済みの画像を端末フォトライブラリへコピーする
- **THEN** 操作は「画像をライブラリに保存」と表示される

#### Scenario: 直前に収めた記録を完全に取り消す
- **WHEN** ユーザーが写しを収めた直後にitemと写真を完全に消す操作を選ぶ
- **THEN** 操作は「今の記録を取り消す」と表示され、捨離とは表現されない

### Requirement: 新語彙をアクセシブルに伝える

システムは、視覚上の短い「縁側」ラベルを保ちながら、支援技術向けにはそれが未決定のモノの場所であると分かるaccessibility labelを SHALL 提供する。

#### Scenario: スクリーンリーダーで縁側タブを読む
- **WHEN** スクリーンリーダー利用者が左タブへフォーカスする
- **THEN** 「縁側」と、捨てるか残すかをまだ決めていないモノの場所である旨が読み上げられる

