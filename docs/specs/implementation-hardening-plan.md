# 実装・設計 Hardening Plan

状態: draft
作成日: 2026-07-05
対象: root Expo / React Native 実装
関連仕様: `docs/specs/product-spec.md`, `docs/design/design_handoff_indecision_declutter`

## 1. 目的

この計画は、現行実装を product-complete に近づける前に、データ保全・責務境界・テスト可能性を固めるための作業仕様である。

主眼は次の5つ。

1. 写真ファイルと item レコードのライフサイクルを破綻させない。
2. DB/repository 境界で item の不変条件を守る。
3. 詳細・ビューア・モーダルが Context キャッシュだけに依存しないようにする。
4. 画面に散っている副作用を小さな hooks / domain helpers に寄せる。
5. UIフローのリグレッションを検知できるテストを追加する。

## 2. Non-goals

- バックエンド、アカウント、クラウド同期は追加しない。
- 旧 Vue/PWA 実装へ戻さない。
- design handoff の `.dc.html` を製品コードへコピーしない。
- 完了演出を自動遷移には戻さない。退避完了・手放し完了は手動導線が正。
- 大規模なフォルダ再編は先に行わない。責務を切り出しながら必要になった範囲で移動する。

## 3. 現状評価

良い点:

- `src/screens`, `src/components`, `src/lib`, `src/state`, `src/navigation`, `src/theme`, `src/types` の層分けは現規模では妥当。
- pure helper と SQLite repository のテストは増えており、`npm run typecheck` と `npm test` は通る。
- React Navigation の11画面構成、SQLite保存、写真保存、候補/捨離の基本フローは成立している。

主な弱点:

- 撮影済みだが item に紐づかない写真ファイルが残る可能性がある。
- `coverIndex`, 空 photos, urgency などの不変条件が repository で守られていない。
- 詳細系画面が `findItem` に依存し、直リンク・画面復元・refresh直後に弱い。
- Screen が撮影、DB更新、フォーム状態、ナビゲーションを直接持っており、今後の写真操作追加で肥大化しやすい。
- UI interaction / navigation flow のテストがない。

## 4. Target Architecture

### 4.1 層の責務

現行のトップレベル構成は維持する。

| 層 | 責務 |
|---|---|
| `src/screens/` | 画面のレイアウト、画面固有 state、navigation binding |
| `src/components/` | 見た目の再利用部品。DBや写真保存を直接呼ばない |
| `src/state/` | app state と use-case API。screen から DB/repository を隠す |
| `src/lib/db.ts` | SQLite repository。永続化と item 不変条件を守る |
| `src/lib/photoStorage.ts` | 写真ファイルの保存・削除・権限エラーを扱う |
| `src/lib/*` helpers | pure function。UIから独立してテストする |
| `src/theme/tokens.ts` | 色、フォント、角丸、影、頻出 overlay を集約 |

### 4.2 新規 helper / hook の方針

追加するなら小さく始める。

- `src/lib/itemRepositoryRules.ts`
  - `normalizeItemPatch`
  - `clampCoverIndex`
  - `assertCreateItemInput`
  - urgency/status validation
- `src/lib/photoDraft.ts`
  - 未退避写真の draft 管理に必要な pure helper
  - keep/remove/reorder 時の cleanup 対象計算
- `src/state/useItemLoader.ts`
  - `findItem` で見つからなければ `loadItem` する
  - `loading`, `item`, `error`, `reload` を返す
- `src/state/usePhotoActions.ts`
  - add / remove / setCover / reorder の use-case API をまとめる
  - 画面から DB と file cleanup の順序を隠す
- `src/screens/hooks/useCaptureDraft.ts`
  - Capture 画面の未退避写真、active index、撮り直し、やめる、退避を管理する

hooks は初回から過剰に抽象化しない。2画面以上で同じ副作用順序が必要なものだけ切り出す。

配置方針:

- item取得や写真操作は複数画面で共有するため `src/state/` に置く。
- Capture draft は Capture 固有の画面状態なので `src/screens/hooks/` に置く。
- repository validation は React から独立するため `src/lib/` に置く。

## 5. Data Invariants

repository 境界で必ず守る。

### 5.1 Item

- `photos.length >= 1`
- `coverIndex >= 0 && coverIndex < photos.length`
- `urgency` は `0 | 1 | 2 | 3`
- `status` は `candidate | discarded`
- `discarded` の場合は `releasedAt` を持つ
- `candidate` に戻す場合は `releasedAt` を消す
- `name` は trim 後に空なら `無名`
- `blockers` は trim 済み、空文字なし、先頭 `#` なし
- optional text は trim 後に空なら `null` / `undefined` 扱い

### 5.2 Photos

- DBに保存された photo row は必ず item に属する。
- `item_photos.sort_order` は item 内で安定し、並べ替え後は 0 始まりに再採番する。
- 写真削除で cover 写真が消える場合、次の cover は `min(deletedIndex, nextPhotos.length - 1)`。
- 最後の1枚は削除不可にするか、削除時に item 削除へ明示的に遷移する。今回の推奨は「最後の1枚は削除不可」。
- app 管理外 URI は削除しない。

### 5.3 Photo Operation Algorithms

DB repository は file system を直接触らない。写真ファイル削除は `usePhotoActions` または draft hook が `deleteStoredPhoto` で行う。

`removePhotoFromItem(itemId, photoIndex)`:

1. transaction 内で item と photo rows を `sort_order ASC` で読む。
2. photo rows が0件なら `ItemPhotoInvariantError`。
3. photo rows が1件なら `LastPhotoCannotBeRemovedError`。
4. `photoIndex` を範囲内に clamp する。
5. 対象 photo row を削除する。
6. 残り photo rows を 0 始まりの `sort_order` に再採番する。
7. 元 cover 写真が残っている場合は、その写真の新 index を `cover_index` にする。
8. 元 cover 写真を削除した場合は `min(deletedIndex, remainingCount - 1)` を `cover_index` にする。
9. `updated_at` を更新する。
10. 削除した URI と次の coverIndex を返す。

戻り値:

```ts
type RemovePhotoResult = {
  removedUri: string;
  coverIndex: number;
  photos: string[];
};
```

`setCoverPhoto(itemId, photoIndex)`:

1. photo count を読む。
2. `photoIndex` を範囲内に clamp する。
3. `items.cover_index` と `updated_at` を更新する。

`reorderItemPhotos(itemId, fromIndex, toIndex)`:

1. transaction 内で photo rows を `sort_order ASC` で読む。
2. `fromIndex` と `toIndex` を範囲内に clamp する。
3. 配列上で移動し、全 row の `sort_order` を再採番する。
4. cover 写真の row id を基準に、新しい `cover_index` を計算する。
5. `items.cover_index` と `updated_at` を更新する。

初回UIでは drag reorder ではなく、写真ロール上の `前へ` / `後ろへ` 操作で実装する。長押し drag の affordance は、drag 実装を入れるまで表示しない。

### 5.4 Draft Photos

撮影後、item 作成前の写真は draft として扱う。

- `やめる` は draft 写真を全削除して一覧へ戻る。
- `撮り直す` は現在の撮影分だけ削除し、新しい撮影結果で置き換える。
- `もう1枚` で撮影に失敗・キャンセルした場合、既存 draft は維持する。
- `退避` 中に item 作成が失敗した場合、draft は画面上に残す。ユーザーが再試行または `やめる` で cleanup できる。
- item 作成成功後は draft の所有権が item に移る。以降は undo / item 削除の責務で cleanup する。
- 最後の1枚を削除しようとした場合のユーザー向けコピーは「写真は1枚以上必要です。」とする。

## 6. Implementation Plan

### Phase 1: Repository hardening

目的: 壊れた item を作れないようにする。

作業:

- `createItemFromPhotos` で空 photos を拒否する。
- `updateItem` と `rowToItem` で `coverIndex` を clamp する。
- `urgency` と `status` の runtime validation を入れる。
- blockers / optional text 正規化の責務を repository helper に寄せる。
- `addPhotoToItem` 後の `coverIndex` は既存値を維持する。
- 将来の写真削除/並べ替え用に repository API を追加する。
  - `removePhotoFromItem(itemId, photoIndex)`
  - `setCoverPhoto(itemId, photoIndex)`
  - `reorderItemPhotos(itemId, fromIndex, toIndex)`
- `removePhotoFromItem` は削除対象 URI を返す。file cleanup は repository の外で行う。

受け入れ条件:

- invalid urgency / status / empty photos が repository テストで拒否される。
- 範囲外 `coverIndex` が保存・hydrate 時に壊れたまま UI に出ない。
- 写真削除後も `coverIndex` が範囲内に収まる。

### Phase 2: Photo lifecycle and cleanup

目的: 孤児ファイルを残さない。

作業:

- Capture draft の責務を `useCaptureDraft` に切り出す。
- `やめる` で draft 写真を `deleteStoredPhoto` する。
- `撮り直す` で現在写真だけ cleanup してから再撮影する。
- 退避成功時は draft cleanup をしない。item が所有者になるため。
- 詳細/編集で写真追加後に DB 更新が失敗した場合、追加直後のファイルを cleanup する。
- item 削除 / 退避取り消し時の写真 cleanup は現行どおり維持する。

受け入れ条件:

- `やめる` / `撮り直す` / 追加失敗時の cleanup がテストで検証される。
- app 管理外 URI を誤って削除しない。
- item 作成成功後の写真を draft cleanup が消さない。

### Phase 3: Item loading resilience

目的: 直リンク・復元・refresh直後に強くする。

作業:

- `useItemLoader(itemId)` を追加する。
- `ItemDetail`, `ItemEdit`, `DiscardedDetail`, `PhotoViewer`, `ReleaseConfirm`, `ReleaseComplete`, `EvacuationComplete` は `findItem` 直接依存をやめる。
- loading / missing / error の表示を各詳細画面で統一する。
- PhotoViewer は photos が空なら操作ボタンを出さず、戻る導線を出す。

受け入れ条件:

- Context cache に item がなくても `loadItem` で表示できる。
- missing item は `0 / 0` のような壊れた表示にならない。
- loading と error のコピーがユーザー向けに自然。

### Phase 4: Photo actions completion

目的: 見えている写真操作を実動作化する。

作業:

- PhotoViewer の more メニューを実装する。
  - `表紙にする`
  - `写真を削除`
- ItemEdit の写真ロールに削除を追加する。
- 並べ替えは初回は `前へ` / `後ろへ` の明示操作で実装する。長押し drag は後続スライスに回す。
- 「長押しで並べ替え」は drag 実装を入れるまで表示しない。
- 最後の1枚削除は不可にして、説明コピーを出す。

受け入れ条件:

- more メニューの全項目が item 状態に反映される。
- 写真削除後にファイル cleanup と DB row 削除が行われる。
- 表紙設定後、一覧カード・詳細・捨離詳細の cover が一致する。
- 見えている非機能ボタンが残らない。

### Phase 5: Visual and token cleanup

目的: design handoff への忠実度と保守性を上げる。

作業:

- `src/theme/tokens.ts` に頻出 overlay / semantic colors を追加する。
  - `white`, `dangerText`, `kachiOverlay`, `shuOverlay`, `photoScrim`, `translucentCard`
- 捨離の識別は朱基調で行う: 手放し済みバッジ・タグを朱、捨離タブの active 色を朱、捨離一覧の背景を朱がかった washi にする。カード写真は薄化しない。
- 捨離詳細に朱の閉じた円相バッジを追加する。
- PhotoViewer を黒背景に寄せる。
- AppHeader の moon icon / 初回 camera hint の扱いを仕様に合わせる。
- `.DS_Store` を削除し、`.gitignore` で混入を防ぐ。

受け入れ条件:

- 375x812 で候補一覧、撮影、詳細、編集、ビューア、捨離一覧、捨離詳細、儀式画面が破綻しない。
- 直書き色は一時的な白黒以外、semantic token に寄せる。
- 捨離が候補と視覚的に区別できる。

### Phase 6: Test expansion

目的: 重要フローを壊した時に検知する。

追加するテスト:

- repository:
  - empty photos create rejection
  - urgency/status validation
  - coverIndex clamp
  - remove photo / set cover / reorder
  - release / restore invariants
- photo lifecycle:
  - draft cancel cleanup
  - retake cleanup
  - add photo DB failure cleanup
  - item ownership transfer after create success
- state/use-case:
  - `useItemLoader` cache hit / DB fallback / missing / error
  - `usePhotoActions` success and cleanup failure tolerance
- UI smoke:
  - Candidate filter changes rendered item list
  - PhotoViewer thumbnail navigation
  - more menu actions invoke use-case handlers
  - ReleaseConfirm -> ReleaseComplete route

推奨ツール:

- 現行の Vitest は維持。
- Phase 1-3 は新規テスト依存を追加せず、repository / helper / hook を Vitest で検証する。
- Phase 4 以降、UI smoke が必要になった時点で `@testing-library/react-native` を追加する。
- E2E はまず手動QA手順を docs に固定し、後で Expo 対応の自動化を検討する。

受け入れ条件:

- `npm run typecheck` が通る。
- `npm test` が通る。
- repository / photo lifecycle / state hooks のテストが失敗時に原因を特定しやすい粒度になっている。

## 7. Suggested Order of PRs / Slices

1. **Data invariants**
   - repository validation, clamp, tests
2. **Capture draft cleanup**
   - `useCaptureDraft`, cancel/retake cleanup, tests
3. **Photo actions**
   - remove / set cover / reorder repository + state + UI
4. **Item loader**
   - DB fallback loading for detail/modal screens
5. **Visual fidelity**
   - discarded treatment, viewer black background, tokens, camera hint
6. **QA and regression**
   - RN component tests, 375x812 screenshots, manual QA checklist

この順序なら、視覚/UIの前にデータ保全が固まる。

## 8. Manual QA Checklist

最低限、実機または Expo Go で確認する。

- 初回起動でサンプル私物データが出ない。
- FABからCaptureへ入り、カメラ権限許可後に撮影できる。
- `やめる` で item が作られず、再起動後も不要な記録がない。
- `撮り直す` で現在写真だけ置き換わる。
- 複数写真 item を退避できる。
- 退避完了で `次を撮る`, `候補一覧へ戻る`, `退避を取り消す` が動く。
- 詳細から写真追加、ビューア、表紙設定、写真削除が動く。
- 編集で全項目が永続化され、詳細/捨離詳細へ反映される。
- 手放し確認から捨離へ移り、写真と記録が残る。
- 捨離詳細から候補へ戻せる。
- アプリ再起動後も item と写真が残る。
- カメラ権限拒否時にユーザー向けエラーが出る。
- 375x812 でテキストやボタンが重ならない。

## 9. Risks and Tradeoffs

- **cleanup と DB 更新の二相性**: SQLite と file system は同一トランザクションにできない。方針は「DBを正とし、失敗した file cleanup は best effort で握りつぶす。ただし孤児化しやすい draft は積極的に cleanup する」。
- **last photo delete**: item 削除と写真削除を同じUIに混ぜると手放し=変容の思想と衝突しやすい。今回は最後の1枚削除を禁止する。
- **hooks 抽象化のやりすぎ**: 画面からすべてを追い出すと逆に読みにくい。DB/file/navigation をまたぐ副作用だけ切り出す。
- **Web parity**: Web は検証用で永続保存はしない。実機保存の正しさはネイティブ環境で見る。
- **drag reorder**: 長押し drag はライブラリ選定とgesture衝突のリスクがある。初回は明示ボタンで順序変更し、仕様文言もUIに合わせる。

## 10. Self Review

### Coverage

- 前回レビューの High/Medium 指摘を、データ保全、写真操作、画面復元、UI affordance、テストの5カテゴリに分解できている。
- `product-spec` のプロダクト思想と矛盾しない。完了演出は手動導線を正としている。
- `legacy/vue-pwa` への逆戻りや backend 追加は明示的に non-goal 化できている。

### Concerns

- `useItemLoader` と `ItemsContext` の責務境界は実装時に再確認が必要。Context に全部を寄せると肥大化する可能性がある。
- 写真削除/並べ替え API の手順は定義したが、実装時に Expo SQLite の transaction 挙動と batch update の書き方は確認が必要。
- React Native component test の導入は Phase 4 以降に遅らせる判断にした。最初は pure/use-case テストを厚くする。
- `.DS_Store` cleanup は小さいが、既存の大きな移行差分に紛れるので、単独で扱うか作業スライスに含めるか決める必要がある。

### Adjustments Before Implementation

実装前に次を決める。

1. `.DS_Store` cleanup を Phase 5 に含めるか、別の小タスクとして先に処理するか。
2. `前へ` / `後ろへ` の具体的なアイコンと配置。
3. `ItemPhotoInvariantError` など domain error を class で持つか、識別可能な result object にするか。

### Recommendation

最初の実装着手は Phase 1 と Phase 2 に絞る。ここを固めると、以降のUI実装で写真削除・並べ替えを追加してもデータ破損と孤児ファイルのリスクが大きく下がる。
