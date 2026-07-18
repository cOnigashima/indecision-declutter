## MODIFIED Requirements

### Requirement: 縁側のモノを一覧する

システムは、内部 `status='candidate'` のitemをuser-facingには「縁側」のモノとして、表紙写真つきの2列グリッドで既定表示し、コンパクトな縦リストへ切り替える手段を SHALL 提供する。読み込み中・エラー・itemゼロの各状態を、それぞれ静かな表示で MUST 区別して示す。

#### Scenario: 候補をグリッド表示する
- **WHEN** ユーザーが「縁側」タブを開く
- **THEN** 内部 `status='candidate'` の各itemを表紙写真（`photos[coverIndex] ?? photos[0]`）つきの2列グリッドで表示する

#### Scenario: コンパクトなリストへ切り替える
- **WHEN** ユーザーがリスト表示を選ぶ
- **THEN** 縁側の各itemをより多く見渡せるコンパクトな縦リストで表示する

#### Scenario: 候補が無い
- **WHEN** 内部 `status='candidate'` のitemが1件も無い状態で縁側を開く
- **THEN** 「捨てるでも、残すでもない。ここは、モノの縁側です。」を含む空状態（EmptyState）を表示する

#### Scenario: 読み込みや取得に失敗する
- **WHEN** 縁側のitemの読み込み中、または取得に失敗する
- **THEN** それぞれ読み込み中表示・エラー表示を出す

### Requirement: 捨てたい度で絞り込む

システムは、捨てたい度（全部／今すぐ=3／捨てたい=2／迷い=1／残す=0）で縁側のitemを絞り込むコンパクトな手段を SHALL 提供する。「全部」を選んだときは捨てたい度の絞り込みを MUST 解除する。

#### Scenario: 特定の捨てたい度で絞る
- **WHEN** ユーザーが捨てたい度チップ（例: 迷い）を選ぶ
- **THEN** その捨てたい度のitemだけを縁側に表示する

#### Scenario: 絞り込みを解除する
- **WHEN** ユーザーが「全部」を選ぶ
- **THEN** 捨てたい度の絞り込みを解除し、縁側のすべてのitemを表示する

#### Scenario: 絞り込み結果がゼロ
- **WHEN** 選んだ絞り込み条件に合致するitemが無い
- **THEN** 「この条件のモノはありません」と表示する（縁側自体の空状態とは区別する）

### Requirement: 縁側のモノの詳細を開く

システムは、縁側のitemをタップしてその記録詳細へ遷移する手段を SHALL 提供する。

#### Scenario: 候補をタップする
- **WHEN** ユーザーが縁側のグリッドまたはリスト上のitemをタップする
- **THEN** そのitemの詳細画面（ItemDetail）へ遷移する

## RENAMED Requirements

- FROM: `### Requirement: 候補を一覧する`
- TO: `### Requirement: 縁側のモノを一覧する`
- FROM: `### Requirement: 候補の詳細を開く`
- TO: `### Requirement: 縁側のモノの詳細を開く`
