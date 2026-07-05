# 円相アセット差し替えパック

`indecision-declutter` 用。円相の **かすれ質感を保ったまま** 軽量化＋1枚化し、
アニメあり／なしを出せるコンポーネント一式です。
プレビュー：`不断捨離_円相プレビュー.dc.html`（青/朱/灰・静止/アニメを一覧）。

> 重要：純ベクター（`<path>` の線）で筆のかすれを描き直すことはしていません（＝質感が消えて退化する）。
> 本物の筆PNGはそのまま使い、SVGは「一筆で閉じる」リビール用の**マスクとしてだけ**使います。

---

## 中身

| ファイル | 置き先（RN） | 役割 |
|---|---|---|
| `assets/enso-mono.png` | `src/assets/enso-mono.png` | 元の筆アートから作った**白インク＋透過**のテクスチャ（512px / **60KB**）。tintColor で染める前提。 |
| `EnsoImage.tsx` | `src/components/EnsoImage.tsx` | PNG＋tintColor 版。静止＝完成形、animated＝フェード＋スケール。 |
| `EnsoMark.tsx` | `src/components/EnsoMark.tsx` | SVG 版。テクスチャを **SVGマスクで少しずつ現す**＝「一筆で閉じる」描画。 |

依存は `react-native-svg@15` / `react-native-reanimated@4` / `expo-image`。**全て導入済み**、追加インストール不要。
`_orig/`（元画像）と `_preview/`（焼き込みtint）は確認用。RN には不要。

---

## ① 投下処理

- **PNG（EnsoImage）**：追加処理なし。`src/assets/` に置くだけ（`import ... from '../assets/enso-mono.png'`、既存の `*.png` 宣言のまま）。
- **SVG（EnsoMark）**：`.svg` を import せず `<Svg>…</Svg>` を JSX 直書き＋ `<Image href={require(png)}>` を使うので、`react-native-svg-transformer` も metro 設定も不要。

## ② 軽量化

- 元 `enso-blue.png`(135.9KB) + `enso-shu.png`(87.6KB) = 約224KB・2枚
  → **`enso-mono.png` 60KB・1枚 ＋ tintColor** に統一（青=`colors.kachi` / 朱=`colors.shu` / 灰=`colors.nibiiro`）。**約73%減 & 1ファイル化**。
- 差し替え後、旧 `enso-blue.png` / `enso-shu.png` は削除OK。
- テクスチャは元の筆アートから生成しているので、**かすれ質感は100%そのまま**。

## ③ アニメーション

- 現状コードにアニメは無い（静止 `<Image>`）。今回のは「壊す」ではなく「足す」。
- **`EnsoMark animated` は「カンプ議論 t10」で承認した動きの移植**：左下→時計回りに **約0.42秒**（`Easing.bezier(.55,0,1,.96)` の whip）で一気に締める「シャッ」。マスクパス `M39 82.8 A35 35 0 1 1 67.5 80.3`（下に隙間＝閉じきらない）。かすれ質感は保持。
- `animated` prop で切替：
  - `EnsoMark animated`（SVG）… 上記の一筆で閉じる描画。青=退避／朱=手放し。
  - `EnsoImage animated`（PNG）… 一筆描画は不可なので **フェード＋スケール** で代替（より単純な画面用）。
  - `animated={false}`（既定）… 完成形の静止。

---

## 差し替え例

```tsx
// 退避完了：青の円相が一筆で閉じる（質感あり）
import { EnsoMark } from '../components/EnsoMark';
<EnsoMark tone="blue" size={190} animated />

// 手放し完了：朱・フェードで
import { EnsoImage } from '../components/EnsoImage';
<EnsoImage tone="shu" size={190} animated />

// EnsoDivider（灰・静止・小）
<EnsoImage tone="gray" size={18} opacity={0.38} />
```

`EnsoDivider.tsx` は `EnsoImage`/`EnsoMark` を size=18 で包むだけに置換できます。

## どっちを使う？

- 一筆で閉じる動き＆解像度自由 → **EnsoMark**（SVGマスク描画）。
- 実装が最も単純・確実（tintColorだけ）→ **EnsoImage**（静止 or フェード）。

両方入れてあるので画面ごとに使い分け可（例：完了演出=EnsoMark、divider=EnsoImage）。
どちらも表示される絵は同じ `enso-mono.png` なので見た目は完全に一致します。
