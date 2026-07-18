# fix-enso-reveal-animation — design

## Context

円相の一筆書きリビールは `EnsoMark`（SVG 2枚マスク構成）で実装している:

```
<Svg viewBox="0 0 100 100">
  <Mask id=tex>  … 筆テクスチャPNG（全周フルリング、352×352 RGBA）
  <Mask id=rev>  … リビール弧 <AnimatedPath strokeDashoffset={reanimated} />
  <G mask=rev> <Rect fill=tone mask=tex /> </G>   ← animated 時
</Svg>
```

`strokeDashoffset` は reanimated の `useAnimatedProps` で駆動。環境は RN 0.86（Fabric）+ reanimated 4.5.0 + react-native-svg 15.15.5 + Expo SDK 57。

**症状の非対称性が最大の手がかり**:

| 表示箇所 | マウントのされ方 | 結果 |
|---|---|---|
| 退避完了・手放し完了（大円相） | 画面遷移後にクリーンに1回マウント、アニメ中に親の再レンダリングなし | **完走する（正常）** |
| 捨てたい度セレクタ（小円相） | 選択変更で `key` 付き再マウント、直後に親 state 更新の再レンダリングが重なる | **約1/4で凍結** |

これは reanimated issue #7480（Fabric で、アニメ中に別の React commit が走ると animated props の更新が止まる）のパターンと一致する。すでに実施済みの対策（svg 15.15.5 / CSS-SVG フラグ off / ネイティブ再ビルド）では解消せず、さらに **JS 側の保険（`durationMs+80ms` 後に `setState` でマスク無しツリーへ差し替え）も実機で効いていない**。保険は純粋な React 再レンダリングなので、これが効かないのは (a) マスク付きサブツリーの構造変更が Fabric で反映されない、(b) 保険コードが実機バンドルに乗っていなかった、のどちらか。ここが未切り分け。

## Goals / Non-Goals

**Goals:**

- どの画面・どのマウント経路でも、円相リビールが**必ずフルの円相で終わる**こと（アニメの完走 or 確実なフル収束）。
- 一筆書きの演出（左下から時計回りに筆が走る）と筆の質感（かすれ・テクスチャ）を保つこと。
- 退避完了・手放し完了の現在の見た目・気持ちよさを劣化させないこと。
- 残存原因を実機で切り分け、対処が「当てずっぽうの積み重ね」にならないこと。

**Non-Goals:**

- セレクタのレイアウト・寸法の再調整（qa-round1 で調整済み。トークンは現状を維持）。
- 円相アセットのデザイン変更（新しい筆致・色の導入）。
- Android 対応の検証（現時点の実機QAは iOS。Android は将来のQAラウンドで扱う）。

## Decisions

### D1. 診断を実装より先に行う（30分の切り分けマトリクス）

推測で実装を重ねない。実機で以下を順に確認し、結果で方式を確定する:

1. **保険がバンドルに乗っているか**: `EnsoMark` にマウント/settle 時の `console.log` を仕込み、実機ログで settle が発火しているか確認。発火していなければ「(b) バンドル未反映」であり、まず reload/再ビルドの手順問題を潰す。
2. **マスク付きサブツリーの React 更新が反映されるか**: settle 発火が確認できたのに表示が変わらない場合、(a) が確定。`key` を変えた**強制再マウント**（`<Svg key={settled ? 'full' : 'anim'}>`）で回避できるかを確認。再マウントで直るなら「更新は壊れているが初回描画は正しい」。
3. **reanimated を外した駆動で完走するか**: `useAnimatedProps` をやめ、`requestAnimationFrame` + `setState` で `strokeDashoffset` を毎フレーム更新した検証ビルドで完走するか。完走すれば issue #7480 系（reanimated×Fabric）が確定。
4. **アニメ中の親再レンダリングを止めると完走するか**: セレクタの選択 state 更新を `startTransition`/遅延させた検証で完走するか。完走すれば「commit 干渉」が確定。

### D2. 実装方式は診断結果で選ぶ（優先順位つき候補）

| 方式 | 内容 | 採用条件 | 筆質感 | 依存 |
|---|---|---|---|---|
| **C'. rAF + 再マウント収束**（本命・最小） | リビールを rAF+setState で駆動し、終了時に `key` 差し替えで「マスク無しフル表示」へ強制再マウント。診断2・3の回避策をそのまま製品化 | 診断2 or 3 で回避が確認できたら | ○（現行アセットのまま） | 追加なし |
| **B. Skia 移行** | `@shopify/react-native-skia` の Path trim（`start`/`end`）+ 筆PNG を image shader でストロークに乗せる | C' が実機で不安定な場合、または診断で SVG 層自体が信頼不能と判明した場合 | ○（shader で保持） | 追加あり＋再ビルド |
| **E. フレーム連番** | ビルド時スクリプトでリビールを N コマの PNG に事前レンダリングし、expo-image で順送り再生（表示は静的画像のみ＝最も壊れにくい） | B も避けたい場合の保険。72pt 表示なのでファイルは小さい | ◎（完全に保持） | 追加なし（生成スクリプトのみ） |

**捨てる選択肢**: 「マスクを捨てて単純ストローク化」（筆質感が失われるため不採用）。「View 合成の扇形リビール」（背景色依存で写真上に置けず脆いため不採用）。

### D3. 完了画面は現状実装を維持する

退避完了・手放し完了の大円相は現に完走しており、ユーザー評価も高い。共通コンポーネントの内部実装を差し替える場合も、**大円相の見た目（タイミング、イージング、質感）を変えない**ことを受け入れ条件にする。実装統一によりリスクが出るなら、完了画面だけ現行経路を残す分岐も許容する。

### D4. 環境変更は現状を前提として維持する

react-native-svg 15.15.5 と reanimated 静的フラグ `EXPERIMENTAL_CSS_ANIMATIONS_FOR_SVG_COMPONENTS:false` は、単体では解決しなかったが上流の既知バグ修正として妥当なので戻さない。以後の検証はこの環境の上で行う。

## Risks / Trade-offs

- [rAF+setState 駆動は JS スレッド依存] → 対象は 420ms・小サイズ・単一要素で負荷は軽微。撮影直後などJSが混む場面では「完走保証（終了時の強制フル収束）」が最後の砦になるため、収束処理は必ずアニメとは独立のタイマーで駆動する。
- [Skia 追加はネイティブ依存が増え、SDK 57 との互換確認が必要] → 採用時は datetimepicker と同じ prebuild+再ビルド手順に乗せる。expo との互換バージョンを `npx expo install` で解決する。
- [診断1で「バンドル未反映」だった場合、これまでの結論の一部が誤検証になる] → その場合は保険＋svg 15.15.5 だけで直る可能性もあるため、必ず診断を最初に行い、直っていれば実装差し替えを中止して change を縮小する。
- [フレーム連番はコマ数を欠くと紙芝居感が出る] → 420ms なら 12〜16 コマで十分滑らか。採用時は実機で確認して調整。

## Migration Plan

1. 診断ブランチで D1 の 1→4 を実施し、結果を tasks.md にチェックとして残す。
2. 確定した方式で `EnsoMark` を書き換え（props 互換: `tone/size/animated/durationMs/opacity` を維持し、利用側 5 画面は原則無変更）。
3. セレクタ 2 画面 → 完了 2 画面 + 確認 1 画面の順で実機確認。
4. 問題があれば `EnsoMark` のみ元に戻せる（単一ファイル差し替えでロールバック可能）。

## Open Questions

- 診断1の結果（保険がバンドルに乗っていたか）— ここが最初の分岐点。→ 実機ログでの最終確認は残るが、C' 実装に `__DEV__` ゲートの `[EnsoMark]` ログを同梱したので、次の実機ビルド1回で確認できる。
- Skia 採用時の expo SDK 57 互換バージョン（採用が決まった時点で `npx expo install @shopify/react-native-skia` で確認）。→ 解決: SDK 57 の bundledNativeModules は `@shopify/react-native-skia` **2.6.2** を指定している（`expo install` でこの版が入る）。フォールバック B が必要になった場合はこれを使う。
- 完了画面まで実装統一するか、現行経路を残すか（D3。統一時の見た目劣化の有無で判断）。→ 統一した（EnsoMark 単一実装）。イージング曲線 cubic-bezier(0.55, 0, 1, 0.96) と duration は従来値を JS 実装で再現。見た目劣化の有無は 3.4 の実機確認で判定。

## 診断結果（2026-07-18 静的解析）

実機を使わずに確定できた事実。診断マトリクス（D1）の前提を一部書き換える:

1. **「上流で修正済み」の前提が iOS では誤りだった**: react-native-svg 15.15.5 に入った PR #2948 は **Android 専用の修正**（`android/.../MaskView.java` のみ変更。props 2.0 の diff で default 値の setter が呼ばれない問題への対処）。iOS/macOS には一切手が入っていない。つまり iOS の Mask 更新問題に対する上流修正は**そもそも存在せず**、15.15.4→15.15.5 更新で直らなかったのは当然だった。
2. **アップグレードでの解決余地なし**: npm 上の最新は svg 15.15.5・reanimated 4.5.2（4.6 は nightly のみ）。reanimated には「fix: Freezing animations after bump to RN 0.86」（PR #9694、4.4.2/4.5.0+ に収録）が存在するが、これも **Android 専用**（Kotlin/Java のみの変更。`overrideBySynchronousMountPropsAtMountingAndroid` の新デフォルトへの対処）で、かつ手元の 4.5.0 に既に含まれている。4.5.1/4.5.2 の changelog にも iOS の SVG/アニメ凍結に効く修正は無い。つまり svg（PR #2948）も reanimated（PR #9694）も RN 0.86 の凍結対策は Android にしか出ておらず、iOS は上流未対応。実装方式の変更が唯一の現実的な対処。
3. **iOS の invalidate 経路は構造的に脆い**: `RNSVGNode.invalidate` は `_dirty` が既に true だと親へ伝播せず早期 return する（`RNSVGNode.mm:85`）。`_dirty` のリセットは SvgView の再描画時（`renderTo`/`parseReference`）にしか行われないため、Defs/Mask 内のノードで一度 invalidate が握り潰される（例: Fabric では props 設定時に superview が未設定のことがある、とコード内コメントにも明記）と、以後のフレーム更新が無視される凍結パターンが成立し得る。「約1/4で凍結」「settle の React 更新も見た目に反映されない」という症状と整合する。
4. **環境の焼き込みは正しい**: `EXPERIMENTAL_CSS_ANIMATIONS_FOR_SVG_COMPONENTS:false` は Pods の xcconfig に `-DREANIMATED_FEATURE_FLAGS` として焼き込み済み（今日 13:15 の pod install）。JS 側はネイティブモジュール経由でこの値を読むため、フラグ迂回の疑いは低い。
5. **採用方式**: C'（rAF+setState 駆動 + settle 時の Svg `key` 差し替え強制再マウント）。rAF 駆動の毎フレーム更新も (3) の invalidate 経路を通るため実機で完走しない可能性は残るが、その場合でも settle の**新規マウント初回描画**（実機で唯一常に正しく描かれる経路）がフル円相を保証する。実機で C' の演出が不安定なら B（Skia）/E（フレーム連番）へフォールバック。

## 診断結果・第2ラウンド（2026-07-18 実機。C' 棄却 → E 採用）

実機（iOS）で C' を検証した結果:

- **JS 側は完全に正常**: `[EnsoMark]` ログで progress 0→1.0 の完走、`settled: true` の React コミット、settle タイマー発火まで全て確認。診断1.1の答え=「バンドルは反映されており、保険も発火している」。
- **それでも表示は約1/4で凍結**: rAF+setState（純 React 更新）による `strokeDashoffset` 更新も、settle 後の `key` 差し替え（マスク無し Svg の新規マウント）すら画面に反映されない。Web 版は同一コードで完璧に動作。
- **強制再描画の実験も失敗**: Svg ルートの `color` prop を毎フレーム微小変化させて `setNeedsDisplay` を強制（RNSVGSvgView の invalidate はガードなしで直接呼ぶことをソースで確認）→ 「settle 時に一瞬ちらつく」ようになったが最終表示は1/4のまま。**再描画は走るのに描画内容が更新されない**＝ Mask 内ノードへの props 反映がネイティブ層で欠落していることが確定。
- **結論**: iOS Fabric 上の react-native-svg `<Mask>` は、更新経路（reanimated / React commit / 構造変更 / 強制再描画）によらず信頼できない。**E（フレーム連番）を採用**。
- **E の実装**: `scripts/generate-enso-reveal-frames.mjs` が、ヘッドレス Chrome で「Web 版と同一の SVG マスク合成」（Web は正動作が実証済み）を 24 コマの PNG（イージング焼き込み・最終コマはマスク無しのフル円相）に事前レンダリング。`EnsoMark` は expo-image（実機で動作実績あり）で全コマを重ねて opacity 切り替えで再生。依存追加なし（Chrome はビルド時のみ使用）。
