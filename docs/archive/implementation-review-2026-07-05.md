# 不断捨離 実装レビュー（Archived）

このレビューは 2026-07-05 時点の移行レビューです。指摘の一部は解消済み、また完了演出の自動遷移は手動導線を正とする仕様へ変更済みです。現行仕様は `docs/specs/product-spec.md` と `docs/design/design_handoff_indecision_declutter/README.md` を参照してください。

レビュー日: 2026-07-05
基準仕様: `docs/specs/product-spec.md`
対象: ルートの React Native / Expo 実装

## 概要

現行の root Expo アプリは、方向性としては正しい。React Navigation の 11 画面構成、候補 / 捨離タブ、中央カメラ FAB、テーマトークン、円相 PNG、SQLite ベースのローカル永続化は入っている。

2026-07-05 の Slice 1 で「見えているのに動かない / 思想に反する」部分を一部修正した。通常起動時のサンプル seed、退避完了のダミー表示、非機能の詳細削除ボタン、詳細の urgency 誤表示、メモ未入力時の `undefined`、編集画面の非機能な写真削除 / 並び替え affordance は解消済み。

同日の Slice 2 で、編集画面の購入価格、最後に使った日、保管場所、迷った理由を入力・永続化できるようにした。空欄に戻すことで optional field をクリアでき、詳細 / 捨離詳細にも反映される。

ただし design handoff に対してはまだ product-complete ではない。残る主な不足は、写真カルーセル / ビューアの静的実装、候補フィルタの未実装、捨離側の empty / visual treatment、儀式アニメーションである。

追記: 完了演出はプロダクト判断として自動遷移ではなく手動導線を正とする。`EvacuationComplete` は `次を撮る` / `候補一覧へ戻る` / `退避を取り消す`、`ReleaseComplete` は `捨離リストを見る` を表示する仕様へ変更済み。

検証結果:

- `npm run typecheck`: 成功
- `npm test`: 成功。4 files / 21 tests

## Slice 1 で解消済み

- 通常 DB 起動時の自動 sample seed を停止。`EXPO_PUBLIC_SEED_SAMPLE_DATA=1` のときだけ seed する。
- 退避完了の `本日 N つめ` を実データから計算。
- `退避を取り消す` を実動作化。直前 item を削除し、保存済み写真ファイルも掃除する。
- 詳細画面の非機能な削除ボタンを非表示化。
- 詳細画面の urgency メタを item 実データから表示。
- メモ未入力時に `undefined` を出さず、空状態コピーを表示。
- 編集画面の未実装な写真削除バッジと「長押しで並べ替え」文言を非表示化。

## Slice 2 で解消済み

- 編集画面で購入価格、最後に使った日、保管場所、迷った理由を入力できる。
- `updateItem` が未指定と clear を区別し、`null` で optional field を消せる。
- 詳細 / 捨離詳細に購入価格、最後に使った日、保管場所、迷った理由を表示する。
- 価格入力の正規化、空欄 clear、迷った理由の分割を pure helper としてテストした。

## 高優先の指摘

### 1. 写真カルーセル / ビューアが静的

候補詳細は常に表紙を `1 / N` として表示し、`PhotoViewer` も index 0 で開く (`src/screens/ItemDetailScreen.tsx:51-67`)。`PhotoViewerScreen` は route param から現在 index を計算しているが、ジェスチャー、状態更新、サムネイル tap、more メニューがない (`src/screens/PhotoViewerScreen.tsx:13-47`)。

影響: 複数写真は追加できるが、自然に閲覧・表紙設定・削除できない。複数写真仕様の価値が半分で止まっている。

推奨: `currentIndex` state、サムネイル press、横スワイプ / pager、表紙設定 / 削除メニューを実装する。

### 2. 候補フィルタとタグが見た目だけ

候補一覧の捨てたい度チップとタグチップは `Pressable` だが、選択 state や filter handler がない (`src/screens/CandidateListScreen.tsx:29-47`)。グリッドは常に全 candidate を map している (`src/screens/CandidateListScreen.tsx:52-64`)。

影響: ワークベンチとして絞り込みできそうに見えるが、実際には一覧探索を助けない。

推奨: urgency と blocker / tag の filter state を持ち、表示 candidate を derive してから render する。

## 中優先の指摘

### 3. 捨離エンプティが専用画面になっていない

捨離が空のときは plain text だけを表示している (`src/screens/DiscardedListScreen.tsx:28-31`)。design handoff では候補エンプティに準じた静かな専用エンプティが必要。

影響: 捨離タブだけ完成度が落ちる。手放し後の世界観が弱い。

推奨: 捨離専用の `EmptyState` variant を作り、適切なコピーと円相トーンを設定する。

### 4. 儀式アニメーションが静的

退避完了と手放し完了は円相画像を表示し、手動の次アクション導線も仕様どおりに置かれている。ただし design handoff の一筆描画、チェック pop、写真 fade、テキスト rise/fade は未実装 (`src/screens/EvacuationCompleteScreen.tsx`, `src/screens/ReleaseCompleteScreen.tsx`)。

影響: 機能ブロッカーではないが、退避と手放しを generic save/delete から切り分ける肝の演出が弱い。

推奨: Reanimated / SVG mask などで実装する。PNG の筆致は保持し、必要なら native animation として近似する。

### 5. 捨離側の視覚処理が弱い

捨離カードは `ItemCard` に badge を渡しているが、写真の grayscale / dim 処理はカード内で実装されていない (`src/components/ItemCard.tsx:35-46`)。捨離詳細も design handoff の「朱の閉じた円相バッジ」ではなく plain red badge (`src/screens/DiscardedDetailScreen.tsx:42-50`)。

影響: 捨離が「変容済みの記録」として十分に見えず、候補との状態差が弱い。

推奨: discarded photo style と朱の閉じた円相バッジを追加する。

## 画面別カバレッジ

| 画面 | 状態 | メモ |
|---|---|---|
| 01 候補一覧 | 部分実装 | shell / card grid はある。filter、tag、初回 camera hint は未達。 |
| 02 撮影 | 部分実装 | 複数写真と urgency はある。picker ベースで、現在写真だけの撮り直し semantics は弱い。 |
| 03 退避完了 | 改善済み / 部分実装 | count と undo は実装済み。円相アニメーションは未達。 |
| 04 候補エンプティ | 改善済み / 部分実装 | 通常 seed 停止で初回空状態は出る。初回 camera hint は未達。 |
| 05 候補詳細 | 改善済み / 部分実装 | urgency / 空メモ / 非機能削除は修正済み。carousel は未達。 |
| 06 編集 | 改善済み / 部分実装 | 価格 / 最後に使った日 / 保管場所 / 迷った理由まで編集可能。写真削除 / 並び替えは未達。 |
| 07 写真ビューア | 部分実装 | 見た目はある。swipe / thumbnail / menu は未実装。 |
| 08 手放し確認 | おおむね一致 | コピー、グレー円相、release action はある。 |
| 09 手放し完了 | 部分実装 | 静的 red ritual と遷移はある。animation / fade は未達。 |
| 10 捨離一覧 | 部分実装 | 一覧はある。empty と grayscale treatment が未達。 |
| 11 捨離詳細 | 部分実装 | restore は動く。円相 badge と full visual treatment が未達。 |

## 次の推奨スライス

### Slice 3: 写真体験を完成させる

- 詳細カルーセルに current index を持たせる。
- 全画面ビューアの swipe と thumbnail navigation を実装する。
- viewer から表紙設定 / 削除を実装する。
- 編集画面で写真の削除 / 並べ替えを実装する。

### Slice 4: design fidelity を仕上げる

- 候補の urgency / tag filter を実装する。
- 捨離専用エンプティを追加する。
- 捨離カードの grayscale / dim 処理と閉じた円相 badge を追加する。
- 退避 / 手放しの ritual animation を入れる。
- 375x812 カンプとの visual QA を行う。

## 残リスク

現行の自動テストは date label、URI validation、photo storage cleanup まわりに限られる。SQLite repository、capture / release / restore flow、navigation、UI interaction は未検証。ユーザー向け build 前に repository test を増やし、少なくとも capture -> detail -> release -> restore の flow QA を追加する必要がある。
