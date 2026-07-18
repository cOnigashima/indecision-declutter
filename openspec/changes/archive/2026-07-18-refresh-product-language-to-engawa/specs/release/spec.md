## MODIFIED Requirements

### Requirement: 手放す（変容）

システムは、縁側のitem（内部 `status='candidate'`）を手放して捨離（内部 `status='discarded'`）へ移す手段を SHALL 提供する。手放しは削除ではなく変容であり、写真と記録は MUST 保持したまま状態だけを移す。手放し前には確認画面を挟む。

#### Scenario: 手放しを確認する
- **WHEN** ユーザーが縁側のitem詳細で「手放す」を選ぶ
- **THEN** 円相と表紙写真とともに「◯◯ を手放しますか？」と確認画面を表示する

#### Scenario: 手放しを実行する
- **WHEN** ユーザーが確認画面で手放しを実行する
- **THEN** そのitemを捨離へ移し（`released_at` を記録し）、写真と記録は残したまま手放し完了画面へ進む

#### Scenario: 手放しをやめる
- **WHEN** ユーザーが確認画面で「まだ、そばに置く」または閉じるを選ぶ
- **THEN** 状態を変えずに前の画面へ戻る

### Requirement: 手放しを完了として示す

システムは、手放し完了時に円相が結ばれる静かな演出を SHALL 表示し、そこから「捨離リストを見る」で捨離へ進める、または「縁側へ戻る」で内部 `status='candidate'` の一覧へ戻れるようにする。この画面はデータへの副作用を持たない。

#### Scenario: 手放し完了を示す
- **WHEN** 手放しが完了する
- **THEN** 円相の演出とともに完了を示し、「捨離リストを見る」で捨離一覧へ進める

#### Scenario: 候補一覧へ戻る
- **WHEN** 手放し完了画面でユーザーが「縁側へ戻る」を選ぶ
- **THEN** 内部 `status='candidate'` の一覧へ遷移する

### Requirement: 縁側へ戻す

システムは、捨離のitemを「もう一度、縁側へ」で内部 `status='candidate'` へ戻す手段を SHALL 提供する。戻したとき `released_at` を MUST クリアする。

#### Scenario: 候補に戻す
- **WHEN** ユーザーが捨離詳細で「もう一度、縁側へ」を選ぶ
- **THEN** そのitemを内部 `status='candidate'` へ戻し、`released_at` をクリアして縁側へ遷移する

## RENAMED Requirements

- FROM: `### Requirement: 候補に戻す`
- TO: `### Requirement: 縁側へ戻す`
