# 不断捨離 (Indecision Declutter)

> 「決断しないで、退避する」ための React Native / Expo アプリ。

不断捨離は、片付け中に「捨てるか残すか」で手が止まる瞬間を、写真と記録の一時退避で受け止めるローカルファーストアプリです。

「捨てる」か「残す」かをその場で決めきるのではなく、まず写真に撮って記憶を確保し、物理的な片付けを止めないことを優先します。手放しは削除ではなく、写真と記録を残したまま候補から捨離へ移す「変容」として扱います。

## Product Principles

- コア原則は **決断しないで、退避する**。
- ユーザー向けコピーでは「保存」より **退避** を使う。
- 手放しは削除ではなく **変容**。記録は捨離に残る。
- 青の開いた円相は退避、グレーの円相は確認、朱の閉じた円相は手放し完了を表す。
- バックエンドやクラウド同期は追加しない。端末内に閉じたローカルファーストを守る。

## Features

- **迷ったら撮る**
  カメラでモノを撮影し、捨てたい度を選んで候補へ退避します。1つのモノに複数写真を追加できます。

- **候補ワークベンチ**
  退避したモノを2列グリッドで一覧できます。捨てたい度や迷った理由タグで絞り込めます。

- **記録する**
  品名、購入価格、最後に使った日、保管場所、迷った理由、想いメモを残せます。

- **手放す**
  候補から捨離へ移します。写真と記録は残り、捨離詳細から候補へ戻すこともできます。

- **和モダン・禅のUI**
  和紙背景、墨、勝色、朱、円相を中心に、焦らせない静かな体験を目指しています。

## Current App

この root は Expo / React Native 版です。旧 Vue/PWA 実装は `legacy/vue-pwa/` に参照用として退避しています。

実装済みの主な範囲:

- Expo SDK 57 + TypeScript
- React Navigation の候補/捨離タブ、撮影、詳細、編集、ビューア、手放し確認/完了フロー
- `src/theme/tokens.ts` に集約したデザイントークン
- Shippori Mincho / Inter のフォント読み込み
- 円相 PNG アセット
- SQLite によるローカル永続化
- カメラ撮影 / 端末ライブラリ選択、JPEG圧縮、アプリ内ドキュメント領域への写真保存
- 候補/捨離リスト、詳細、編集、写真追加、手放し、候補戻し
- 退避取り消し
- 写真ビューアの more メニューからの表紙設定 / 削除
- 編集画面での写真削除 / 並べ替え

主要な機能フローは実装済みで、対応するユニットテストも揃っています。

残っている主な作業:

- 捨離カードと捨離詳細の視覚処理の仕上げ（visual QA 案件）
- 375x812 iPhone相当の visual QA
- 実機（iPhone）での動作確認

ギャラリー選択（`pickAndStorePhoto`）は撮影画面の「もう1枚」と、詳細/編集の「写真を足す」に接続済み（カメラ / ライブラリを選べる）。

## Tech Stack

- Expo / React Native
- TypeScript
- React Navigation
- Expo SQLite
- Expo Image Picker / Image Manipulator / File System
- Expo Image
- React Native Reanimated
- Lucide React Native
- Vitest

## Development

```bash
npm install
npm run start        # Expo dev server（ポート 8704）
```

通常起動ではサンプル私物データを自動投入しません。デモ用 seed が必要な場合だけ環境変数を明示します。

```bash
EXPO_PUBLIC_SEED_SAMPLE_DATA=1 npm run start
```

## テスト

ロジックは純関数・フックに寄せて Vitest で検証しています。画面遷移や見た目は実機/シミュレータでの動作確認（次節）で担保します。

```bash
npm run typecheck    # tsc --noEmit（型）
npm test             # vitest run（ユニットテスト）
```

テストの置き場所は対象コードの隣（`src/**/*.test.ts(x)`）です。カバー範囲の例:

- `src/lib/captureFlow.test.ts` — 退避ゲート条件（写真1枚以上で退避可）
- `src/lib/dateLabels.test.ts` — 日付ラベルと `YYYY-MM-DD` ⇄ Date 変換（月末・ゼロ埋め・不正値）
- `src/lib/photoSourcePrompt.test.ts` — 写真ソース選択（カメラ/ライブラリ）の分岐
- `src/lib/db.test.ts` — SQLite リポジトリ（品名編集で `discarded` を維持する等）を fake DB で検証
- `src/state/*.test.tsx` / `src/screens/hooks/*.test.tsx` — 状態プロバイダとフック（写真追加の孤児削除、撮影ドラフト等）
- `src/theme/urgencySelector.test.ts` — 迷い度の円相が枠内に収まる寸法の不変条件

React Native コンポーネント本体のレンダリングテストは未整備です（現状は jsdom + フック単位）。新しいロジックはできるだけ `src/lib` の純関数へ切り出してから、上記の隣接テストを足してください。react-native / lucide-react-native に依存する関数は `vi.mock()` でスタブして読み込めます（`photoSourcePrompt.test.ts` / `urgencySelector.test.ts` が例）。

## 動作確認（シミュレータ / 実機）

このアプリは SQLite・カメラ・画像ピッカー・日付ピッカーなどのネイティブモジュールを使うため **Expo Go では動きません**。ネイティブビルド（Xcode / CocoaPods を使用）が必要です。

```bash
# ネイティブをコンパイルしてシミュレータで起動（ネイティブモジュール追加後はこちら）
npx expo run:ios

# 実機で起動（Apple ID 署名・端末接続が必要）
npx expo run:ios --device

# ネイティブ設定がずれたとき（pod 未反映など）は作り直してから
npx expo prebuild --clean && npx expo run:ios
```

`npm run ios`（= `expo start --ios`）は Metro を起動して既存ビルドを開くだけで、**新規に追加したネイティブモジュールはコンパイルしません**。ネイティブ依存を足した直後は必ず `npx expo run:ios` を使ってください。

### シミュレータと実機の使い分け

- **シミュレータで確認できる**: 退避ゲート、写真の**ライブラリ選択**、記録編集の**日付ピッカー**、手放し完了→候補一覧の戻り導線、捨離詳細の**品名編集**。
- **実機が必要**: iOS シミュレータには**カメラがない**ため、撮影画面のカメラ自動起動やカメラ撮影は実機でのみ確認できます。

### スモーク確認の観点

1. 候補一覧の中央カメラFAB → 撮影画面でカメラが立ち上がる（実機）。撮る前は退避ボタンが出ない。
2. 「もう1枚」/ 詳細・編集の「写真を足す」で、カメラ / ライブラリを選べる。
3. 記録編集の「最後に使った」を日付ピッカーで選ぶ / 「今日」で入る。`YYYY-MM-DD` で保存・再表示される。
4. 手放し完了画面から「候補一覧へ戻る」で候補一覧へ遷移する。
5. 捨離詳細で品名を編集して保存 → 品名だけ更新され、手放し済みのまま（他項目は読み取り専用）。

## Storage

iOS / Android では、item は `indecision-declutter.db` に SQLite 保存されます。写真は `FileSystem.documentDirectory/indecision-photos/` 配下にJPEGとしてコピーされます。

Web は動作確認用です。現状のDBはメモリ上に作られるため、リロードすると記録は消えます。本番の保存挙動は実機またはネイティブビルドで確認してください。

## Design Source of Truth

- `docs/specs/product-spec.md`
- `docs/design/design_handoff_indecision_declutter/README.md`
- `docs/design/design_handoff_indecision_declutter/不断捨離_完成カンプ.dc.html`
- `docs/design/design_handoff_indecision_declutter/不断捨離_全体フロー図.dc.html`

`.dc.html` は参照プロトタイプです。製品コードへHTMLをコピーしません。

## Spec-Driven Development (OpenSpec)

現状の実装能力は `openspec/specs/` に capability 単位でベースライン化しています（capture / candidate-workbench / item-record / photo-management / release / local-persistence）。

```bash
openspec list --specs          # capability 一覧
openspec show <capability>      # spec を表示
openspec validate --specs --strict
```

新機能は Claude Code の `/opsx:propose "..."` で提案 → change spec/design/tasks を生成 → 実装 → archive で `openspec/specs/` に反映、という流れで進めます。

## Project Structure

- `App.tsx` / `index.ts` - Expo entry
- `assets/` - app icon-grade enso assets
- `src/assets/` - UI用 enso assets
- `src/navigation/` - React Navigation root stack / bottom tabs
- `src/screens/` - app screens
- `src/components/` - shared UI components
- `src/state/` - SQLite-backed app state provider
- `src/lib/` - SQLite repository, photo storage, form helpers, labels, tests
- `src/theme/` - design tokens
- `src/types/` - domain types
- `docs/specs/` - active product and migration specs
- `docs/archive/` - resolved or historical review notes
- `openspec/specs/` - 現状の実装能力を capability 単位で記述した OpenSpec ベースライン spec
- `legacy/vue-pwa/` - old Vue/PWA implementation for reference only

## Legacy

`legacy/vue-pwa/` は移行前の Vue 3 / Vite / Dexie / PWA 実装です。思想や初期の説明文は参考になりますが、製品実装先ではありません。
