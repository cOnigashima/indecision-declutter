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
- カメラ撮影、JPEG圧縮、アプリ内ドキュメント領域への写真保存
- 候補/捨離リスト、詳細、編集、写真追加、手放し、候補戻し
- 退避取り消し

残っている主な作業:

- 写真ビューアの more メニューからの表紙設定 / 削除
- 編集画面での写真削除 / 並べ替え
- 捨離カードと捨離詳細の視覚処理の仕上げ
- 375x812 iPhone相当の visual QA

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
npm run start
```

Expo dev server は `8704` で起動します。

```bash
npm run ios
npm run android
npm run web
npm run typecheck
npm test
```

通常起動ではサンプル私物データを自動投入しません。デモ用 seed が必要な場合だけ、環境変数を明示します。

```bash
EXPO_PUBLIC_SEED_SAMPLE_DATA=1 npm run start
```

## Storage

iOS / Android では、item は `indecision-declutter.db` に SQLite 保存されます。写真は `FileSystem.documentDirectory/indecision-photos/` 配下にJPEGとしてコピーされます。

Web は動作確認用です。現状のDBはメモリ上に作られるため、リロードすると記録は消えます。本番の保存挙動は実機またはネイティブビルドで確認してください。

## Design Source of Truth

- `docs/specs/product-spec.md`
- `docs/design/design_handoff_indecision_declutter/README.md`
- `docs/design/design_handoff_indecision_declutter/不断捨離_完成カンプ.dc.html`
- `docs/design/design_handoff_indecision_declutter/不断捨離_全体フロー図.dc.html`

`.dc.html` は参照プロトタイプです。製品コードへHTMLをコピーしません。

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
- `legacy/vue-pwa/` - old Vue/PWA implementation for reference only

## Legacy

`legacy/vue-pwa/` は移行前の Vue 3 / Vite / Dexie / PWA 実装です。思想や初期の説明文は参考になりますが、製品実装先ではありません。
