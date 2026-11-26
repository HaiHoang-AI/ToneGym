import { memo } from 'react';
import type { Skill } from '../../games/types';

type Mark = 'up' | 'down' | 'both' | 'three';

const R = 0.35;
const r1 = (v: number) => Math.round(v * 10) / 10;
const pt = (x: number, y: number) => `${r1(x)},${r1(y)}`;
const box = (cx: number, cy: number, a: number, h: number) => ({
  top: [pt(cx - a, cy), pt(cx, cy - a * R), pt(cx + a, cy), pt(cx, cy + a * R)].join(' '),
  left: [pt(cx - a, cy), pt(cx, cy + a * R), pt(cx, cy + a * R + h), pt(cx - a, cy + h)].join(' '),
  right: [pt(cx, cy + a * R), pt(cx + a, cy), pt(cx + a, cy + h), pt(cx, cy + a * R + h)].join(' '),
});
const onFloor = (cx: number, gy: number, a: number, h: number) => box(cx, gy - a * R - h, a, h);
const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};

const PALETTE: Record<Skill, [string, string, string]> = {
  intervals: ['#17615c', '#1f7a73', '#39d0c0'],
  chords: ['#7a5310', '#996a16', '#f4b740'],
  scales: ['#4b3a8a', '#5e4aa8', '#a78bfa'],
  progressions: ['#1f4f8a', '#2a64ab', '#60a5fa'],
  melody: ['#7d2f63', '#9a3c7b', '#f472b6'],
  rhythm: ['#8a4316', '#a8541d', '#fb923c'],
  reading: ['#1d6b4a', '#25875d', '#34d399'],
  singing: ['#7f2a2a', '#a03737', '#f87171'],
};
const SKINS = ['#f2c7a5', '#c98f65', '#8d5a3b', '#f5d6bd'];
const HAIRS = ['#2b2118', '#5a3a22', '#121212', '#b5652b'];
const SHIRTS = ['#f4b740', '#39d0c0', '#f472b6', '#60a5fa'];
const PANTS = ['#2a3142', '#3b2f4a', '#24324a', '#3a2a24'];
const CATS = [
  { body: '#f7efe2', eye: '#2a1d1a' },
  { body: '#a7b0bf', eye: '#2a1d1a' },
  { body: '#f2a65a', eye: '#2a1d1a' },
  { body: '#2f333d', eye: '#ffd166' },
];
const POSE: Record<Skill, 'reach' | 'point' | 'up' | 'hold' | 'sticks' | 'down'> = {
  intervals: 'reach', chords: 'point', scales: 'up', progressions: 'point', melody: 'down', rhythm: 'sticks', reading: 'point', singing: 'hold',
};
const PERSON_X: Record<Skill, number> = {
  intervals: 128, chords: 132, scales: 116, progressions: 124, melody: 124, rhythm: 138, reading: 150, singing: 128,
};

const star = (x: number, y: number, s: number) =>
  `M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`;
const heart = (x: number, y: number, s: number) =>
  `M${x} ${r1(y + s * 0.9)} C${r1(x - s * 1.6)} ${r1(y - s * 0.2)} ${r1(x - s * 0.6)} ${r1(y - s * 1.3)} ${x} ${r1(y - s * 0.4)} C${r1(x + s * 0.6)} ${r1(y - s * 1.3)} ${r1(x + s * 1.6)} ${r1(y - s * 0.2)} ${x} ${r1(y + s * 0.9)} Z`;

const SPARKLES = [[30, 96, 6, '#ffe58a', '0s'], [298, 84, 7, '#ffffff', '0.6s'], [148, 18, 5, '#ffe58a', '1.1s'], [108, 52, 4, '#ffffff', '0.3s']] as const;
const HEARTS = [[294, 138, 5, '2.6s'], [24, 128, 4, '3.1s']] as const;
const CONFETTI = [[96, 84, 2.2, '#ffd166'], [292, 168, 2.6, '#9cc7ff'], [20, 180, 2.4, '#ff9fc4'], [130, 186, 2, '#7ee0d2'], [250, 186, 2.2, '#ffd166'], [306, 22, 2, '#ff9fc4'], [12, 66, 2, '#7ee0d2'], [226, 96, 1.8, '#ffffff']] as const;

export interface GameArtProps {
  skill: Skill;
  variant?: number;
  mark?: Mark;
  height?: number;
  className?: string;
}

/** Original 2.5D scene for a game tile: a platform, a player doing the skill, a kitten, and some sparkle. */
export const GameArt = memo(function GameArt({ skill, variant = 0, mark = 'up', height = 176, className }: GameArtProps) {
  const v = Math.abs(variant) % 4;
  const [bg, bg2, accent] = PALETTE[skill];
  const accentDark = shade(accent, 0.7);
  let shirt = SHIRTS[v]!;
  if (shirt === accent) shirt = SHIRTS[(v + 1) % 4]!;
  const skin = SKINS[v]!;
  const hair = HAIRS[v]!;
  const pants = PANTS[v]!;
  const cat = CATS[v]!;
  const pose = POSE[skill];
  const px = PERSON_X[skill];
  const platform = box(160, 136, 118, 14);

  const kcx = 196, ka = 30, kcy = 160 - ka * R - 22;
  const keys = onFloor(196, 160, 30, 22);
  const keyLines = [0.2, 0.34, 0.48, 0.66, 0.8].map((t) => {
    const x1 = kcx - ka + t * ka, y1 = kcy + t * ka * R;
    return { x1: x1 + 2, y1: y1 - 1, x2: x1 + 2 + 0.42 * ka, y2: y1 - 1 - 0.42 * ka * R };
  });
  const notePos = ({ up: [[182, 74], [226, 42]], down: [[182, 42], [226, 74]], both: [[204, 74], [204, 48]], three: [[0, 0], [0, 0]] } as const)[mark];
  const noteLink = `M${notePos[0][0]} ${notePos[0][1]} Q ${(notePos[0][0] + notePos[1][0]) / 2 - 10} ${Math.min(notePos[0][1], notePos[1][1]) - 16} ${notePos[1][0]} ${notePos[1][1]}`;
  const cubeColors = [['#f4b740', '#39d0c0', '#f472b6'], ['#60a5fa', '#f4b740', '#a78bfa'], ['#f472b6', '#60a5fa', '#f4b740'], ['#39d0c0', '#f472b6', '#60a5fa']][v]!;
  const cubes = [0, 1, 2].map((i) => ({ ...box(204, 160 - 18 * R - 18 - i * 18, 18, 18), c: cubeColors[i]! }));
  const stairs = [3, 2, 1, 0].map((i) => {
    const a = 16, h = 14 + i * 13, cx = 168 + i * 20, gy = 162 - i * 7;
    return { ...onFloor(cx, gy, a, h), label: ['1', '3', '5', '8'][i]!, lx: r1(cx - a / 2), ly: r1(gy - (a * R) / 2 - h / 2 + 3) };
  });
  const topX = 168 + 60, topY = 162 - 21 - 16 * R - 53;
  const numerals = [['I', 'IV', 'V'], ['I', 'V', 'vi'], ['ii', 'V', 'I'], ['i', 'iv', 'V']][v]!;
  const signs = ([[178, 158, 54], [214, 150, 62], [250, 142, 58]] as const).map(([x, gy, hgt], i) => ({ x, gy, hgt, text: numerals[i]!, fill: i === 1 ? '#f4b740' : '#fbfaf6' }));
  const melodyNotes = ([[166, 74], [192, 56], [214, 70], [238, 46], [262, 54]] as const).map(([x, y], i) => ({ x, y, fill: i % 2 ? accent : '#ffffff' }));
  const clefY = mark === 'down' ? 84 : 96;
  const mouthX = px + 16;
  const anim = (values: string, dur: string) => (
    <animateTransform attributeName="transform" type="translate" values={values} dur={dur} repeatCount="indefinite" />
  );

  return (
    <svg className={className} width="100%" height={height} viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true" style={{ display: 'block' }}>
      <rect width="320" height="200" fill={bg} />
      <circle cx="266" cy="36" r="46" fill={bg2} />
      <circle cx="34" cy="34" r="16" fill={bg2} />
      <g fill="#ffffff" fillOpacity=".16">
        {anim('0 0;6 0;0 0', '9s')}
        <circle cx="44" cy="40" r="11" /><circle cx="58" cy="34" r="14" /><circle cx="74" cy="41" r="10" /><rect x="40" y="40" width="40" height="10" rx="5" />
        <circle cx="176" cy="22" r="8" /><circle cx="188" cy="17" r="11" /><circle cx="200" cy="23" r="8" /><rect x="172" y="22" width="32" height="8" rx="4" />
      </g>
      {CONFETTI.map(([x, y, r, fill], i) => <circle key={i} cx={x} cy={y} r={r} fill={fill} />)}
      {skill === 'singing' && <polygon points="104,0 150,0 200,170 54,170" fill="#ffffff" fillOpacity=".08" />}

      <polygon points={platform.left} fill="#d1c6b1" />
      <polygon points={platform.right} fill="#b2a68d" />
      <polygon points={platform.top} fill="#efe8da" />

      {skill === 'intervals' && (
        <g>
          <polygon points={keys.left} fill={accent} />
          <polygon points={keys.right} fill={accentDark} />
          <polygon points={keys.top} fill="#fbfaf6" />
          {keyLines.map((k, i) => <line key={i} x1={k.x1} y1={k.y1} x2={k.x2} y2={k.y2} stroke="#1b1d22" strokeWidth="3" strokeLinecap="round" />)}
          <g>
            {anim('0 0;0 -5;0 0', '3s')}
            {mark === 'three' ? (
              <g>
                <rect x="176" y="50" width="12" height="24" rx="3" fill="#ffffff" fillOpacity=".55" />
                <rect x="198" y="34" width="12" height="40" rx="3" fill="#ffffff" />
                <rect x="220" y="44" width="12" height="30" rx="3" fill="#ffffff" fillOpacity=".55" />
                <path d="M196 26l8-8 8 8" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ) : (
              <g>
                <path d={noteLink} fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />
                {notePos.map(([x, y], i) => (
                  <g key={i}>
                    <ellipse cx={x} cy={y} rx="8" ry="5.8" transform={`rotate(-22 ${x} ${y})`} fill="#ffffff" />
                    <line x1={x + 7} y1={y} x2={x + 7} y2={y - 24} stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
                  </g>
                ))}
              </g>
            )}
          </g>
        </g>
      )}

      {skill === 'chords' && (
        <g>
          {cubes.map((c, i) => (
            <g key={i}>
              <polygon points={c.left} fill={c.c} />
              <polygon points={c.right} fill={shade(c.c, 0.72)} />
              <polygon points={c.top} fill={shade(c.c, 1.12)} />
            </g>
          ))}
          <circle cx="240" cy="58" r="4" fill="#ffffff" fillOpacity=".8" />
          <circle cx="252" cy="74" r="2.5" fill="#ffffff" fillOpacity=".6" />
        </g>
      )}

      {skill === 'scales' && (
        <g>
          {stairs.map((s, i) => (
            <g key={i}>
              <polygon points={s.left} fill={accent} />
              <polygon points={s.right} fill={shade(accent, 0.68)} />
              <polygon points={s.top} fill={shade(accent, 1.15)} />
              <text x={s.lx} y={s.ly} textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="9" fontWeight="700" fill="#ffffff">{s.label}</text>
            </g>
          ))}
          <line x1={topX} y1={topY} x2={topX} y2={topY - 30} stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points={[pt(topX, topY - 30), pt(topX + 18, topY - 25), pt(topX, topY - 19)].join(' ')} fill="#f4b740">
            <animate attributeName="fill" values="#f4b740;#ffe08a;#f4b740" dur="1.6s" repeatCount="indefinite" />
          </polygon>
        </g>
      )}

      {skill === 'progressions' && (
        <g>
          {signs.map((s, i) => (
            <g key={i}>
              <ellipse cx={s.x} cy={s.gy} rx="7" ry="2.5" fill="#000000" fillOpacity=".2" />
              <line x1={s.x} y1={s.gy} x2={s.x} y2={s.gy - s.hgt} stroke="#6b5a45" strokeWidth="4" strokeLinecap="round" />
              <rect x={s.x - 19} y={s.gy - s.hgt - 20} width="38" height="22" rx="5" fill={s.fill} />
              <text x={s.x} y={s.gy - s.hgt - 5} textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="13" fontWeight="700" fill="#1a1405">{s.text}</text>
            </g>
          ))}
        </g>
      )}

      {skill === 'melody' && (
        <g>
          {anim('0 0;0 -6;0 0', '3.2s')}
          <path d="M164 76 C178 50 190 50 196 62 S214 76 226 50 S250 40 262 54" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" />
          {melodyNotes.map((n, i) => (
            <g key={i}>
              <ellipse cx={n.x} cy={n.y} rx="6.5" ry="4.8" transform={`rotate(-22 ${n.x} ${n.y})`} fill={n.fill} />
              <line x1={n.x + 6} y1={n.y} x2={n.x + 6} y2={n.y - 20} stroke={n.fill} strokeWidth="2.2" strokeLinecap="round" />
            </g>
          ))}
        </g>
      )}

      {skill === 'rhythm' && (
        <g>
          <line x1="238" y1="150" x2="238" y2="98" stroke="#3a3f4b" strokeWidth="3" />
          <line x1="230" y1="152" x2="246" y2="152" stroke="#3a3f4b" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="238" cy="97" rx="17" ry="4.5" fill="#f2cf63">
            <animateTransform attributeName="transform" type="rotate" values="0 238 97;-8 238 97;0 238 97" dur="0.8s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="194" cy="150" rx="25" ry="8.5" fill={accentDark} />
          <rect x="169" y="124" width="50" height="26" fill={accent} />
          <path d="M169 130h50M169 144h50" stroke="#ffffff" strokeOpacity=".5" strokeWidth="2" />
          <ellipse cx="194" cy="124" rx="25" ry="8.5" fill="#f6f1e6" stroke={accentDark} strokeWidth="2" />
          <path d="M182 104l-4-8M194 100v-9M206 104l4-8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="stroke-opacity" values="1;.2;1" dur="0.8s" repeatCount="indefinite" />
          </path>
        </g>
      )}

      {skill === 'reading' && (
        <g>
          <line x1="212" y1="154" x2="212" y2="104" stroke="#3a3f4b" strokeWidth="3" />
          <path d="M200 158l12-6 12 6" fill="none" stroke="#3a3f4b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="184,74 240,64 240,106 184,116" fill="#fbfaf6" />
          {[0, 1, 2, 3, 4].map((i) => <line key={i} x1="189" y1={80 + i * 6} x2="235" y2={72 + i * 6} stroke="#5a6070" strokeWidth="1.2" />)}
          <circle cx="194" cy={clefY} r="3.5" fill="none" stroke={accentDark} strokeWidth="2" />
          <circle cx="207" cy="86" r="3" fill="#1b1d22" />
          <circle cx="217" cy="80" r="3" fill="#1b1d22" />
          <circle cx="228" cy="83" r="3" fill={accentDark} />
        </g>
      )}

      {skill === 'singing' && (
        <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeWidth="2.5">
          <animate attributeName="stroke-opacity" values="1;.35;1" dur="1.4s" repeatCount="indefinite" />
          <path d={`M${mouthX + 6} 72 q7 6 0 13`} />
          <path d={`M${mouthX + 12} 67 q11 10.5 0 22`} strokeOpacity=".75" />
          <path d={`M${mouthX + 18} 62 q15 15 0 31`} strokeOpacity=".5" />
        </g>
      )}

      {/* Kitten on the platform */}
      <g transform="translate(84 147)">
        <ellipse cx="0" cy="2" rx="13" ry="3.2" fill="#000000" fillOpacity=".2" />
        <path d="M9 -4 q13 -2 10 -17" fill="none" stroke={cat.body} strokeWidth="4.5" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" values="0 9 -4;16 9 -4;0 9 -4" dur="1.3s" repeatCount="indefinite" />
        </path>
        <ellipse cx="0" cy="-9" rx="11" ry="10" fill={cat.body} />
        <ellipse cx="0" cy="-6" rx="6" ry="6" fill="#ffffff" fillOpacity=".35" />
        <polygon points="-9.5,-28 -7,-39 -1.5,-32" fill={cat.body} />
        <polygon points="9.5,-28 7,-39 1.5,-32" fill={cat.body} />
        <polygon points="-7.5,-29.5 -6.5,-35.5 -3.5,-31.5" fill="#ff9fb2" />
        <polygon points="7.5,-29.5 6.5,-35.5 3.5,-31.5" fill="#ff9fb2" />
        <circle cx="0" cy="-24" r="10.5" fill={cat.body} />
        {[-3.8, 3.8].map((x) => (
          <ellipse key={x} cx={x} cy="-24.5" rx="1.7" ry="2.1" fill={cat.eye}>
            <animate attributeName="ry" values="2.1;2.1;0.3;2.1" keyTimes="0;0.9;0.95;1" dur="3.6s" repeatCount="indefinite" />
          </ellipse>
        ))}
        <path d="M-2 -20.5 q1 1.4 2 0 q1 1.4 2 0" stroke={cat.eye} strokeWidth="1" fill="none" strokeLinecap="round" />
        <ellipse cx="-7" cy="-20.5" rx="2.2" ry="1.3" fill="#ff8fa3" fillOpacity=".7" />
        <ellipse cx="7" cy="-20.5" rx="2.2" ry="1.3" fill="#ff8fa3" fillOpacity=".7" />
        <circle cx="-5" cy="1" r="3" fill={cat.body} /><circle cx="5" cy="1" r="3" fill={cat.body} />
      </g>

      {/* Player */}
      <g transform={`translate(${px} 0)`}>
        <ellipse cx="0" cy="152" rx="16" ry="4" fill="#000000" fillOpacity=".22" />
        <g>
          {anim('0 0;0 -2.5;0 0', '2.4s')}
          <rect x="-9" y="120" width="7.5" height="31" rx="3.5" fill={pants} />
          <rect x="1.5" y="120" width="7.5" height="31" rx="3.5" fill={pants} />
          <ellipse cx="-4" cy="151.5" rx="6.5" ry="3" fill="#1b1d22" />
          <ellipse cx="7" cy="151.5" rx="6.5" ry="3" fill="#1b1d22" />
          <rect x="-13" y="89" width="26" height="36" rx="10" fill={shirt} />
          <rect x="-13" y="112" width="26" height="6" fill="#000000" fillOpacity=".12" />
          <rect x="-3" y="83" width="6" height="8" fill={skin} />
          <circle cx="0" cy="75" r="11.5" fill={skin} />
          <path d="M-12 76 A12 12 0 0 1 12 73 Q6 66 -1 69.5 Q-7 68 -12 76 Z" fill={hair} />
          {(v === 1 || v === 3) && <circle cx="-7" cy="63" r="5.5" fill={hair} />}
          {v === 2 && <path d="M-12 71 A12 11 0 0 1 12 70 L19 72 L-12 73 Z" fill={accent} />}
          {[3.5, 8.5].map((x) => (
            <ellipse key={x} cx={x} cy="76" rx="1.5" ry="1.6" fill="#1b1d22">
              <animate attributeName="ry" values="1.6;1.6;0.2;1.6" keyTimes="0;0.92;0.96;1" dur="4.2s" repeatCount="indefinite" />
            </ellipse>
          ))}
          <path d="M4 81.5 q2.5 2.2 5 0" stroke="#1b1d22" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <circle cx="-1" cy="79" r="2.2" fill="#e8806b" fillOpacity=".35" />
          {skill === 'melody' && (
            <g>
              <path d="M-12.5 76 A12.5 12.5 0 0 1 12.5 76" fill="none" stroke="#1b1d22" strokeWidth="3" />
              <rect x="-15" y="72" width="6" height="11" rx="3" fill={accent} />
              <rect x="9" y="72" width="6" height="11" rx="3" fill={accent} />
            </g>
          )}
          <g fill="none" stroke={shirt} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
            {pose === 'reach' && <><path d="M-7 97 L13 109 L25 112" /><path d="M9 96 L22 107 L32 109" /></>}
            {pose === 'point' && <><path d="M-10 97 L-13 110 L-12 119" /><path d="M9 96 L22 86 L32 74" /></>}
            {pose === 'up' && <><path d="M-9 96 L-18 82 L-21 68" /><path d="M9 96 L18 82 L22 67" /></>}
            {pose === 'hold' && <><path d="M-10 97 L-13 110 L-12 119" /><path d="M9 97 L19 106 L14 92" /></>}
            {pose === 'sticks' && <><path d="M-7 98 L10 108 L18 108" /><path d="M9 97 L22 103 L28 102" /></>}
            {pose === 'down' && <><path d="M-11 98 L-14 109 L-14 120" /><path d="M11 98 L14 109 L14 120" /></>}
          </g>
          <g fill={skin}>
            {pose === 'reach' && <><circle cx="25" cy="112" r="3.6" /><circle cx="32" cy="109" r="3.6" /></>}
            {pose === 'point' && <><circle cx="-12" cy="120" r="3.6" /><circle cx="33" cy="72" r="3.6" /></>}
            {pose === 'up' && <><circle cx="-21" cy="66" r="3.6" /><circle cx="22" cy="65" r="3.6" /></>}
            {pose === 'hold' && <><circle cx="-12" cy="120" r="3.6" /><circle cx="14" cy="92" r="3.6" /><rect x="12.5" y="80" width="4" height="12" rx="2" fill="#2b2f37" /><circle cx="14.5" cy="79" r="4.5" fill="#9aa3b2" /></>}
            {pose === 'sticks' && <><circle cx="18" cy="108" r="3.6" /><circle cx="28" cy="102" r="3.6" /><path d="M18 108 L44 114 M28 102 L56 100" stroke="#e9d3a6" strokeWidth="2.6" strokeLinecap="round" /></>}
            {pose === 'down' && <><circle cx="-14" cy="121" r="3.6" /><circle cx="14" cy="121" r="3.6" /></>}
          </g>
        </g>
      </g>

      {SPARKLES.map(([x, y, s, fill, begin], i) => (
        <path key={i} d={star(x, y, s)} fill={fill}>
          <animate attributeName="opacity" values=".15;1;.15" dur="1.8s" begin={begin} repeatCount="indefinite" />
        </path>
      ))}
      {HEARTS.map(([x, y, s, dur], i) => (
        <path key={i} d={heart(x, y, s)} fill="#ff8fb1">
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -7;0 0" dur={dur} repeatCount="indefinite" />
        </path>
      ))}
    </svg>
  );
});
