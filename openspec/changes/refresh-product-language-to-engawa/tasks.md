## 1. 正本と仕様の語彙更新

- [ ] 1.1 `AGENTS.md` のコア原則と実装用語を「決めずに、写しを収める。／縁側／捨離」へ更新する
- [ ] 1.2 `docs/design/design_handoff_indecision_declutter/README.md` と2つの `.dc.html` 参照プロトタイプのコピー・フロー注記を対応表に合わせる
- [ ] 1.3 `docs/PHILOSOPHY.md`, `docs/specs/product-spec.md`, root `README.md` の説明・画面名・コピーを更新する
- [ ] 1.4 `openspec/config.yaml` とactive specsのPurposeを新しい語彙へ同期する（archive済みchangeは変更しない）

## 2. 縁側・写しを収めるコピー

- [ ] 2.1 `BottomNav` の左タブを「縁側」にし、説明的なaccessibility labelを付ける
- [ ] 2.2 `EmptyState` と `CandidateListScreen` の空状態・絞り込みゼロ・一覧導線を縁側コピーへ更新する
- [ ] 2.3 `CaptureScreen` の主／副アクション、処理中、写真ゼロ、失敗、権限補足を「写しを収める」コピーへ更新する
- [ ] 2.4 `EvacuationCompleteScreen` の見出し、補足、縁側への導線、完全撤回を対応表どおり更新する
- [ ] 2.5 `ReleaseCompleteScreen` などに残る「候補一覧へ戻る」を「縁側へ戻る」へ更新する

## 3. 捨離コピー

- [ ] 3.1 `ItemDetailScreen` と `ReleaseConfirmScreen` の「手放す」操作・確認・エラーを「捨離する」へ更新する
- [ ] 3.2 `ReleaseCompleteScreen` の完了本文、キャプション、捨離／縁側への導線を更新する
- [ ] 3.3 `DiscardedListScreen`, `DiscardedDetailScreen`, `ItemCard`, `ItemListRow` の「手放した記録」「手放し済み」「手放しました」を「捨離の記録」「捨離済み」「捨離しました」へ更新する
- [ ] 3.4 捨離詳細の復帰操作を「もう一度、縁側へ」、注記を「捨離したけれど、まだ手元にある時に」へ更新する

## 4. 権限・アクセシビリティ・監査

- [ ] 4.1 `app.json` のカメラ／写真権限説明を新しい語彙へ更新する
- [ ] 4.2 user-facing なエラー、通知、accessibility label、テスト期待値を検索し、画面本文と同じ語彙へ更新する
- [ ] 4.3 `退避|候補|手放す|手放し|手放した` を全体検索し、内部識別子・archive・legacy以外の残存を人手で分類して解消する
- [ ] 4.4 `保存|削除` を監査し、端末ライブラリへの実保存・ファイル処理・実削除以外で誤用していないことを確認する
- [ ] 4.5 `Evacuation|Candidate|candidate|release|discarded` が内部識別子に留まり、ユーザーへ露出していないことを確認する

## 5. 検証

- [ ] 5.1 `npm run typecheck` と `npm test` を実行する
- [ ] 5.2 375x812で縁側タブ、空状態、撮影の主／副ボタン、両完了画面、捨離確認／詳細の改行・はみ出しをvisual QAする
- [ ] 5.3 Dynamic Typeとスクリーンリーダーで「縁側」の意味と各操作結果が理解できることを確認する
- [ ] 5.4 新しいネイティブバイナリでカメラ／写真権限説明が新語彙へ更新されていることを確認する
