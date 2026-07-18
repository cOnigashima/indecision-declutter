# local-persistence Specification

## Purpose

不断捨離はローカルファーストを守る。写真も記録も端末内に閉じて保存し、バックエンド・アカウント・クラウド同期を持たない。ネイティブでは SQLite と端末内ファイルに永続化し、Web は動作確認用として扱う。ユーザーの私物の記録が端末の外へ出ないことを設計の前提とする。

## Requirements

### Requirement: 端末内に永続化する

システムは、item の記録を端末内の SQLite（`indecision-declutter.db`）に SHALL 永続化する。明示的な依頼が無い限り、バックエンド・アカウント・クラウド同期を追加してはならない（MUST NOT）。

#### Scenario: 記録を永続化する
- **WHEN** ユーザーが item を作成・更新・手放し・候補戻しする
- **THEN** その変更を端末内 SQLite に保存し、次回起動時に復元できる

#### Scenario: 外部送信を行わない
- **WHEN** アプリが記録や写真を保存する
- **THEN** 端末外のバックエンドやクラウドへは送信しない

### Requirement: 写真をファイルとして保存する

システムは、写真を端末内のドキュメント領域（`documentDirectory/indecision-photos/`）に JPEG として SHALL 保存する。写真ファイルの削除は所有領域内の URI に MUST 限定する。

#### Scenario: 写真を保存領域へコピーする
- **WHEN** 撮影した写真を item に紐づける
- **THEN** ドキュメント領域配下へコピーし、DB にはその参照を保存する

#### Scenario: item ごと削除する
- **WHEN** 退避取り消しなどで item を完全に削除する
- **THEN** DB のレコードと、所有領域内の写真ファイルの両方を削除する

### Requirement: Web は動作確認用とする

システムは、Web ではメモリ上の DB を SHALL 用いる。Web ではリロードで記録が消えることを前提とし、本番の保存挙動は実機またはネイティブビルドで MUST 確認する。

#### Scenario: Web でリロードする
- **WHEN** Web 版でページをリロードする
- **THEN** メモリ上の記録は失われる（Web は動作確認用のため）

### Requirement: サンプルデータは明示時のみ投入する

システムは、通常起動ではサンプル私物データを SHALL 投入しない。環境変数 `EXPO_PUBLIC_SEED_SAMPLE_DATA=1` が指定されたときに限りデモ用データを投入する。

#### Scenario: 通常起動する
- **WHEN** 環境変数を指定せずにアプリを起動する
- **THEN** サンプルデータは投入されず、空の状態から始まる

#### Scenario: デモ用に seed する
- **WHEN** `EXPO_PUBLIC_SEED_SAMPLE_DATA=1` を指定して起動する
- **THEN** デモ用のサンプルデータを投入する
