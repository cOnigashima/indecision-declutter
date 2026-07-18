# fix-enso-reveal-animation

## Why

円相（enso）の一筆書きリビールは本アプリの中核演出だが、捨てたい度セレクタ（撮影レビュー・記録編集）では選択時のアニメが途中（約1/4、左〜左上の弧）で止まり、フルの円相が描画されない。原因調査は完了しており（後述）、既知の対策を2つ実施しても実機で解消していないため、描画方式そのものの再設計を含めて独立の change として腰を据えて取り組む。

### これまでに確定している事実（前調査の結論）

1. **ジオメトリ・アセットは正しい**: 円相PNG（`enso-mono-trimmed-solid.png`）は全周にインクを持つフルリング。EnsoMark と同一のマスク構成をブラウザで再現し、`progress=1` なら完全な円相が描画されることをスクリーンショットで確認済み。
2. **原因はネイティブ層の既知バグ**: react-native-svg の `<Mask>` が RN 0.86 Fabric（props 2.0）で更新されない問題（svg 15.15.5 の PR #2948 で修正）＋ reanimated 4.4+ が SVG props を既定で CSS アニメ経路に流す変更（`EXPERIMENTAL_CSS_ANIMATIONS_FOR_SVG_COMPONENTS`）の合流。
3. **既知の対策では直らなかった**: react-native-svg 15.15.4→15.15.5 更新、reanimated 静的フラグ `EXPERIMENTAL_CSS_ANIMATIONS_FOR_SVG_COMPONENTS:false`（xcconfig への焼き込み確認済み）、ネイティブ再ビルドを実施したが、実機で症状が再現し続けている。
4. **JS 側の保険も効いていない**: EnsoMark に入れた「`durationMs` 経過後は reveal マスクを外してフル表示に収束させる」フォールバックも実機で機能していない。これは「マスク付き SVG サブツリーの再レンダリング自体が反映されない」可能性を示唆しており、要検証。

## What Changes

- 円相の描画・演出要件を新 capability `enso-motif` として明文化する（フル描画の保証、一筆書き演出、筆質感の保持）。
- 「1/4止まり」の残存原因を特定する（保険が効かない理由の切り分け＝マスク付きサブツリーの再レンダリング検証を含む）。
- 検証結果に基づき、実機で確実にフル描画される実装方式へ EnsoMark を作り替える。候補:
  - A. `<Mask>` を使わない SVG 実装（筆テクスチャの保持が課題）
  - B. `@shopify/react-native-skia` への移行（Path trim による draw-on。依存追加が必要）
  - C. JS ドリブン駆動（React state で `strokeDashoffset` を更新し reanimated の SVG props 経路を回避）
  - D. View レイヤーでのマスク/クリップ（SVG マスクを使わず RN の View 合成で抜く）
- 退避完了・手放し完了の大円相（現在正常動作）は見た目・挙動を維持したまま同じ実装に統一するか、現状維持かを design で判断する。

## Capabilities

### New Capabilities

- `enso-motif`: 円相モチーフの描画と演出。すべての表示箇所（捨てたい度セレクタ、退避完了、手放し完了、手放し確認）で円相がフルに描画されること、選択・完了時の一筆書きリビール演出、筆の質感（かすれ・テクスチャ）の保持を要件として定める。

### Modified Capabilities

（なし — capture / release 既存仕様の「円相の演出とともに」という要件文は変更しない。本 change は演出の実現方式と描画保証を enso-motif として新設するのみ）

## Impact

- **コード**: `src/components/EnsoMark.tsx`（作り替え本命）、`src/components/EnsoImage.tsx`（静的表示。実装統一する場合のみ）、利用側は `CaptureScreen` / `ItemEditScreen` / `EvacuationCompleteScreen` / `ReleaseCompleteScreen` / `ReleaseConfirmScreen`（props 互換を保てば変更最小）
- **依存**: 方式 B 採用時のみ `@shopify/react-native-skia` 追加＋ネイティブ再ビルド。方式 A/C/D は JS のみで完結
- **アセット**: `src/assets/enso-*.png`（現行を継続使用。方式によっては SVG パス化 or アルファマスク変換の可能性）
- **既実施の環境変更（本 change の前提として維持）**: react-native-svg 15.15.5、reanimated 静的フラグ `EXPERIMENTAL_CSS_ANIMATIONS_FOR_SVG_COMPONENTS:false`
