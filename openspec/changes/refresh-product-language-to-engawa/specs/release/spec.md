## MODIFIED Requirements

### Requirement: 捨離する（変容）

システムは、縁側のitem（内部 `status='candidate'`）を捨離して内部 `status='discarded'` へ移す手段を SHALL 提供する。捨離は削除ではなく変容であり、写真と記録は MUST 保持したまま状態だけを移す。捨離前には確認画面を挟む。

#### Scenario: 捨離を確認する
- **WHEN** ユーザーが縁側のitem詳細で「捨離する」を選ぶ
- **THEN** 円相と表紙写真とともに「◯◯ を捨離しますか？」と確認画面を表示する

#### Scenario: 捨離を実行する
- **WHEN** ユーザーが確認画面で「捨離する」を実行する
- **THEN** そのitemを内部 `status='discarded'` へ移し（`released_at` を記録し）、写真と記録は残したまま捨離完了画面へ進む

#### Scenario: 捨離をやめる
- **WHEN** ユーザーが確認画面で「まだ、そばに置く」または閉じるを選ぶ
- **THEN** 状態を変えずに前の画面へ戻る

### Requirement: 捨離を完了として示す

システムは、捨離完了時に円相が結ばれる静かな演出を SHALL 表示し、そこから「捨離を見る」で捨離へ進める、または「縁側へ戻る」で内部 `status='candidate'` の一覧へ戻れるようにする。この画面はデータへの副作用を持たない。

#### Scenario: 捨離完了を示す
- **WHEN** 捨離が完了する
- **THEN** 円相の演出、「円が、ひとつ結ばれました」、および「◯◯ を捨離しました。記録は『捨離』に残ります。」を表示する

#### Scenario: 捨離を見る
- **WHEN** 捨離完了画面でユーザーが「捨離を見る」を選ぶ
- **THEN** 内部 `status='discarded'` の一覧へ遷移する

#### Scenario: 縁側へ戻る
- **WHEN** 捨離完了画面でユーザーが「縁側へ戻る」を選ぶ
- **THEN** 内部 `status='candidate'` の一覧へ遷移する

### Requirement: 縁側へ戻す

システムは、捨離済みのitemを「もう一度、縁側へ」で内部 `status='candidate'` へ戻す手段を SHALL 提供する。戻したとき `released_at` を MUST クリアする。

#### Scenario: もう一度縁側へ戻す
- **WHEN** ユーザーが捨離詳細で「もう一度、縁側へ」を選ぶ
- **THEN** そのitemを内部 `status='candidate'` へ戻し、`released_at` をクリアして縁側へ遷移する

### Requirement: 捨離を一覧する

システムは、捨離済み（内部 `status='discarded'`）のitemを表紙写真つきグリッドで SHALL 一覧する。各itemには捨離日（`releasedAt ?? updatedAt`）を相対表示し、状態ラベルは「捨離済み」、区切り見出しは「捨離の記録」とする。

#### Scenario: 捨離を一覧する
- **WHEN** ユーザーが「捨離」タブを開く
- **THEN** 捨離済みのitemをグリッドで表示し、捨離日を相対表示する

### Requirement: 捨離の詳細を見る

システムは、捨離済みitemの詳細を SHALL 表示する。写真と記録に加え、捨離日と「N日間そばに」を示す。記録は原則として読み取り専用とするが、品名（name）だけは捨離済みでも編集できる例外とする（変容の思想を保ちつつ、呼び名の訂正を許す）。

#### Scenario: 捨離の詳細を開く
- **WHEN** ユーザーが捨離のitemをタップする
- **THEN** 写真・記録・捨離日・「N日間そばに」を表示し、品名を除く記録は読み取り専用とする

### Requirement: 捨離済みの品名を編集する

システムは、捨離済み（内部 `status='discarded'`）のitemの品名（name）を編集して保存する手段を SHALL 提供する。品名の編集はstatusを変えてはならず（MUST NOT）、itemは捨離済みのまま維持する。品名以外の記録項目は捨離詳細から編集させない。

#### Scenario: 捨離済みの品名を直す
- **WHEN** ユーザーが捨離詳細で品名を編集して保存する
- **THEN** 品名が更新され、itemは内部 `status='discarded'` のまま維持される

#### Scenario: 品名編集でstatusを変えない
- **WHEN** 捨離済みitemの品名を保存する
- **THEN** statusは`discarded`のままで、`released_at`もクリアされない

## RENAMED Requirements

- FROM: `### Requirement: 手放す（変容）`
- TO: `### Requirement: 捨離する（変容）`
- FROM: `### Requirement: 手放しを完了として示す`
- TO: `### Requirement: 捨離を完了として示す`
- FROM: `### Requirement: 候補に戻す`
- TO: `### Requirement: 縁側へ戻す`
- FROM: `### Requirement: 手放し済みの品名を編集する`
- TO: `### Requirement: 捨離済みの品名を編集する`
