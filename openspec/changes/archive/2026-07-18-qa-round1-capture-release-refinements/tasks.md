## 1. 依存とビルド基盤

- [x] 1.1 `npx expo install @react-native-community/datetimepicker` で SDK 57 互換版を追加する（9.1.0 を導入）
- [x] 1.2 `expo prebuild` を再実行し、実機へ再ビルド・再インストールして起動確認する（実機QAで確認済み）

## 2. 撮影優先フロー（A/B/C）

- [x] 2.1 `CaptureScreen` を、初回マウントで写真ドラフトが空なら `takePhoto()` を1回だけ自動起動するようにする（キャンセル時は空のまま留まる）
- [x] 2.2 退避アクション（「退避して〜」ボタン群）を `photos.length >= 1` のときだけ描画するゲートを入れる
- [x] 2.3 退避ゲート条件を純関数（`canRelease(photos)` を `src/lib/captureFlow.ts`）に切り出し、Vitest でテストする
- [x] 2.4 FAB（`BottomNav`）→ 撮影 → カメラ起動が余計なタップなしで繋がることを確認する（配線完了。実機確認は 7.3）
- [x] 2.5 迷い度アイコンの円相（`urgencyCircle` / `ensoRing`）が枠内に収まるようサイズ・余白を調整し、寸法定数は `tokens.ts` に寄せる

## 3. 写真ソースにライブラリ追加（D）

- [x] 3.1 写真取得を「カメラ or ライブラリ」で差し替えられるよう、`pickAndStorePhoto` を `useCaptureDraft.pickPhoto` として接続する
- [x] 3.2 撮影画面の「もう1枚」にカメラ/ライブラリの選択を出す（`promptPhotoSource`）
- [x] 3.3 詳細（`ItemDetail`）/編集（`ItemEdit`）の「写真を足す」にカメラ/ライブラリの選択を出す
- [x] 3.4 ライブラリ由来でも DB 追加失敗時に保存済みファイルを削除する後始末を `ItemsContext.addPhoto` に共通化し、テストする

## 4. 記録編集の日付ピッカー（E）

- [x] 4.1 `parseDateInput`（`Date` ⇄ `YYYY-MM-DD`）を `dateLabels` に置き、Vitest で境界（月末・ゼロ埋め・不正値）を検証する
- [x] 4.2 `ItemEditScreen` の「最後に使った日」を datetimepicker で選べるようにし、「今日」クイック入力は残す
- [x] 4.3 選んだ日付が `YYYY-MM-DD` として保存・再表示される（`parseDateInput`/`formatDateInput` 往復をテスト。実機確認は 7.3）

## 5. 手放し完了の戻り導線（F）

- [x] 5.1 `ReleaseCompleteScreen` に「候補一覧へ戻る」を追加し、`Tabs > CandidateList` へ遷移させる
- [x] 5.2 文言・視覚を `EvacuationCompleteScreen` と対称にし、画面が副作用を持たないことを保つ

## 6. 手放し済みの品名編集（G）

- [x] 6.1 `DiscardedDetailScreen` に品名のインライン編集（タップ→編集→保存）を追加する
- [x] 6.2 保存は既存 `updateItem` を流用し、status/released_at/他項目を変更しないことを保証する
- [x] 6.3 品名編集で status が `discarded` のまま維持されることを Vitest で検証する
- [x] 6.4 品名以外の記録項目は捨離詳細から編集できないことを確認する（捨離詳細は品名のみ編集可、他は読み取り専用のまま）

## 7. 仕上げ

- [x] 7.1 `npm run typecheck` が通る
- [x] 7.2 `npm test` が通る（15ファイル / 111テスト）
- [x] 7.3 実機で A〜G を通しQAし、§8 QAチェックリストの該当項目を再確認する（初回実機QAラウンドで確認済み）
- [x] 7.4 README の「未接続: pickAndStorePhoto」記述を更新する（接続済みに）

## 8. QAラウンド中の追加改善（H/I/J・実装済みの追認）

- [x] 8.1 カメラのピンチズーム・1x/2xプリセット・前面/背面切替を実装する（`src/lib/cameraZoom.ts` + `CaptureScreen`、Vitest: `cameraZoom.test.ts`）
- [x] 8.2 手放し済み写真の端末ライブラリ保存を実装する（`src/lib/photoDownload.ts` + `DiscardedDetail`/`PhotoViewer`、Vitest: `photoDownload.test.ts`）
- [x] 8.3 共通ヘッダーを設定ボタンにし、準備中案内を出す（`AppHeader`）
- [x] 8.4 上記を delta spec（capture / photo-management / candidate-workbench）へ反映する
