## 1. 正本と仕様の語彙更新

- [x] 1.1 `AGENTS.md` のコア原則と実装用語を「決めずに、写しを収める。／縁側／捨離」へ更新する
- [x] 1.2 `docs/design/design_handoff_indecision_declutter/README.md` と2つの `.dc.html` 参照プロトタイプのコピー・フロー注記を対応表に合わせる
- [x] 1.3 `docs/PHILOSOPHY.md`, `docs/specs/product-spec.md`, root `README.md` の説明・画面名・コピーを更新する
- [x] 1.4 `openspec/config.yaml` とactive specsのPurposeを新しい語彙へ同期する（archive済みchangeは変更しない）

## 2. 縁側・写しを収めるコピー

- [x] 2.1 `BottomNav` の左タブを「縁側」にし、説明的なaccessibility labelを付ける
- [x] 2.2 `EmptyState` と `CandidateListScreen` の空状態・絞り込みゼロ・一覧導線を縁側コピーへ更新する
- [x] 2.3 `CaptureScreen` の主／副アクション、処理中、写真ゼロ、失敗、権限補足を「写しを収める」コピーへ更新する
- [x] 2.4 `EvacuationCompleteScreen` の見出し、補足、縁側への導線、完全撤回を対応表どおり更新する
- [x] 2.5 `ReleaseCompleteScreen` などに残る「候補一覧へ戻る」を「縁側へ戻る」へ更新する

## 3. 手放す→捨離の維持と縁側への復帰

- [x] 3.1 `ItemDetailScreen`, `ReleaseConfirmScreen`, `ReleaseCompleteScreen`, `DiscardedListScreen`, `DiscardedDetailScreen`, `ItemCard`, `ItemListRow` で「手放す→捨離」「手放し済み」の既存語彙が維持されていることを確認する
- [x] 3.2 `ReleaseCompleteScreen` の候補への導線だけを「縁側へ戻る」へ更新する
- [x] 3.3 捨離詳細の復帰操作を「もう一度、縁側へ」へ更新し、既存の手放し注記は維持する

## 4. 権限・アクセシビリティ・監査

- [x] 4.1 `app.json` と生成済み `ios/app/Info.plist` のカメラ権限説明を新しい語彙へ更新し、手放した画像の実保存を示す写真権限説明は維持する
- [x] 4.2 user-facing なエラー、通知、accessibility label、テスト期待値を検索し、画面本文と同じ語彙へ更新する
- [x] 4.3 `退避|候補` を全体検索し、内部識別子・archive・legacy以外の残存を人手で分類して解消する
- [x] 4.4 `手放す|手放し|手放した|捨離` を検索し、「手放す→捨離」の既存語彙が意図せず置換されていないことを確認する
- [x] 4.5 `保存|削除` を監査し、端末ライブラリへの実保存・ファイル処理・実削除以外で誤用していないことを確認する
- [x] 4.6 `Evacuation|Candidate|candidate|release|discarded` が内部識別子に留まり、ユーザーへ露出していないことを確認する

## 5. 検証

- [x] 5.1 `npm run typecheck` と `npm test` を実行する
- [x] 5.2 375x812で縁側タブ、空状態、撮影の主／副ボタン、両完了画面、捨離確認／詳細の改行・はみ出しをvisual QAする
- [x] 5.3 Dynamic Typeとスクリーンリーダーで「縁側」の意味と各操作結果が理解できることを確認する
  - Dynamic Typeの極大設定で確認した既存レイアウト崩れは、GitHub Issue #1へ切り出した。
- [x] 5.4 新しいネイティブバイナリでカメラ／写真権限説明が新語彙へ更新されていることを確認する
