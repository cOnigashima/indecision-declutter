// 円相リビールの連番フレーム生成スクリプト（ビルド時に1回実行）。
//
// iOS Fabric + react-native-svg では <Mask> 内ノードの更新がネイティブ描画に
// 反映されない（openspec/changes/fix-enso-reveal-animation 参照）ため、
// リビールを事前レンダリングした連番 PNG にして expo-image で再生する。
// Web 版の SVG マスク合成は正しく描けることが実機確認済みなので、
// ヘッドレス Chrome で同一の SVG 合成をレンダリングして焼き込む。
// 依存追加なし（手元の Chrome を使う）。
//
// 使い方: node scripts/generate-enso-reveal-frames.mjs
//
// 弧の幾何・イージング（cubic-bezier(0.55, 0, 1, 0.96)）はこのスクリプトが
// 唯一の置き場。再生側（src/lib/ensoReveal.ts）は時間→フレーム番号の線形
// 写像だけを持つ。

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = join(ROOT, 'src/assets/enso-reveal');
const SIZE = 352; // 元アセットと同解像度

// src/lib/ensoReveal.ts と同じ値
const REVEAL_PATH = 'M39 82.8 A35 35 0 1 1 67.5 80.3';
const REVEAL_WIDTH = 34;
const REVEAL_LENGTH = 220;
export const FRAME_COUNT = 24;

// cubic-bezier(0.55, 0, 1, 0.96) — ensoReveal.ts の revealEase と同一
function sampleCurve(t, p1, p2) {
  const c = 3 * p1;
  const b = 3 * (p2 - p1) - c;
  const a = 1 - c - b;
  return ((a * t + b) * t + c) * t;
}
function revealEase(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let lo = 0;
  let hi = 1;
  let t = x;
  while (hi - lo > 1e-6) {
    if (sampleCurve(t, 0.55, 1) < x) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return sampleCurve(t, 0, 0.96);
}

const ensoPng = readFileSync(join(ROOT, 'src/assets/enso-mono-trimmed-solid.png'));
const ensoDataUri = `data:image/png;base64,${ensoPng.toString('base64')}`;

// EnsoMark の SVG マスク合成と同一構成。ink は黒（実行時に tintColor で着色）。
function frameSvg(progress, { withRevealMask }) {
  const dashoffset = REVEAL_LENGTH * (1 - progress);
  const reveal = withRevealMask
    ? `<mask id="rev" maskUnits="userSpaceOnUse">
        <path d="${REVEAL_PATH}" stroke="#fff" stroke-width="${REVEAL_WIDTH}"
          stroke-linecap="round" fill="none"
          stroke-dasharray="${REVEAL_LENGTH}" stroke-dashoffset="${dashoffset}"/>
      </mask>`
    : '';
  const tinted = `<rect x="0" y="0" width="100" height="100" fill="#000" mask="url(#tex)"/>`;
  const body = withRevealMask ? `<g mask="url(#rev)">${tinted}</g>` : tinted;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${SIZE}" height="${SIZE}">
    <defs>
      <mask id="tex" maskUnits="userSpaceOnUse">
        <image href="${ensoDataUri}" x="0" y="0" width="100" height="100"
          preserveAspectRatio="xMidYMid meet"/>
      </mask>
      ${reveal}
    </defs>
    ${body}
  </svg>`;
}

function html(svg) {
  return `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}svg{display:block}</style>
${svg}`;
}

mkdirSync(OUT_DIR, { recursive: true });
const work = join(tmpdir(), `enso-frames-${process.pid}`);
mkdirSync(work, { recursive: true });

const requires = [];
for (let i = 0; i < FRAME_COUNT; i += 1) {
  const t = i / (FRAME_COUNT - 1);
  const progress = revealEase(t);
  // 最終フレームはマスク無し＝settle 後の静的表示と完全に同一の絵にする
  const withRevealMask = i < FRAME_COUNT - 1;
  const page = join(work, `frame-${i}.html`);
  writeFileSync(page, html(frameSvg(progress, { withRevealMask })));

  const name = `frame-${String(i).padStart(2, '0')}.png`;
  const out = join(OUT_DIR, name);
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--force-device-scale-factor=1',
    '--default-background-color=00000000',
    `--window-size=${SIZE},${SIZE}`,
    `--screenshot=${out}`,
    `file://${page}`,
  ], { stdio: 'pipe' });
  requires.push(`  require('./${name}'),`);
  process.stdout.write(`${name} (progress=${progress.toFixed(3)})\n`);
}

writeFileSync(
  join(OUT_DIR, 'index.ts'),
  `// generate-enso-reveal-frames.mjs が生成。手で編集しない。
// 一筆書きリビールの連番フレーム（イージング焼き込み済み・時間軸は線形）。
export const ensoRevealFrames = [
${requires.join('\n')}
] as const;
`
);

rmSync(work, { recursive: true, force: true });
console.log(`done: ${FRAME_COUNT} frames -> ${OUT_DIR}`);
