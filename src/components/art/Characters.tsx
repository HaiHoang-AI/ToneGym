import { memo, type ReactNode } from 'react';

export type Mood = 'wave' | 'cheer' | 'oops';

interface CharacterProps {
  mood?: Mood;
  size?: number;
  className?: string;
}

const Blink = ({ from, dur }: { from: number; dur: string }) => (
  <animate attributeName="ry" values={`${from};${from};0.4;${from}`} keyTimes="0;0.9;0.95;1" dur={dur} repeatCount="indefinite" />
);

const Sparkles = ({ color = '#ffd166' }: { color?: string }) => (
  <g fill={color}>
    <path d="M10 34 Q10 40 16 40 Q10 40 10 46 Q10 40 4 40 Q10 40 10 34 Z">
      <animate attributeName="opacity" values=".2;1;.2" dur="1.4s" repeatCount="indefinite" />
    </path>
    <path d="M110 22 Q110 29 117 29 Q110 29 110 36 Q110 29 103 29 Q110 29 110 22 Z">
      <animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite" />
    </path>
  </g>
);

const FloatingNote = ({ color }: { color: string }) => (
  <g>
    <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="2.2s" repeatCount="indefinite" />
    <line x1="18" y1="26" x2="18" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M18 10 q7 3 5 10" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <ellipse cx="13.5" cy="27" rx="5.5" ry="4" transform="rotate(-22 13.5 27)" fill={color} />
  </g>
);

const SweatDrop = () => <path d="M92 32 q-5 8 0 11 q5 -3 0 -11 z" fill="#9cc7ff" />;

function Frame({ size, label, className, mood, children }: { size: number; label: string; className?: string; mood: Mood; children: ReactNode }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={label} style={{ flex: 'none' }}>
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values={mood === 'cheer' ? '0 0;0 -6;0 0' : '0 0;0 -2;0 0'}
          dur={mood === 'cheer' ? '0.7s' : '2.4s'}
          repeatCount="indefinite"
        />
        {children}
      </g>
      {mood === 'cheer' && <Sparkles />}
    </svg>
  );
}

/** Yumika, the app's mascot: long auburn hair, blunt bangs, round glasses. Two outfits. */
export const Yumika = memo(function Yumika({ mood = 'wave', size = 120, outfit = 'casual', className }: CharacterProps & { outfit?: 'casual' | 'maid' }) {
  const sleeve = outfit === 'maid' ? '#1d1d22' : '#2a3346';
  const label = mood === 'cheer' ? 'Yumika ăn mừng' : mood === 'oops' ? 'Yumika nói ối' : 'Yumika vẫy chào';
  return (
    <Frame size={size} label={label} className={className} mood={mood}>
      <path d="M33 46 C31 14 89 14 87 46 L91 116 Q60 122 29 116 Z" fill="#6b2823" />
      <path d="M40 60 L37 112 M80 60 L83 112" stroke="#8a3a31" strokeWidth="2.4" strokeLinecap="round" />
      {outfit === 'casual' ? (
        <g>
          <path d="M24 120 C24 97 39 87 60 87 C81 87 96 97 96 120 Z" fill="#2a3346" />
          <path d="M36 98 L40 120 M84 98 L80 120" stroke="#3d4a65" strokeWidth="2" strokeLinecap="round" />
          <polygon points="49,87 60,101 71,87" fill="#f5f5f2" />
          <polygon points="42,90 49,87 56,99 47,103" fill="#34405a" />
          <polygon points="78,90 71,87 64,99 73,103" fill="#34405a" />
          <polygon points="57.5,92 62.5,92 62,118 58,118" fill="#20232b" />
          <polygon points="57,88 63,88 62.5,93 57.5,93" fill="#20232b" />
          <circle cx="44" cy="109" r="2" fill="#d9dde3" />
          <circle cx="76" cy="109" r="2" fill="#d9dde3" />
        </g>
      ) : (
        <g>
          <path d="M24 120 C24 97 39 87 60 87 C81 87 96 97 96 120 Z" fill="#1d1d22" />
          <rect x="54" y="84" width="12" height="7" rx="2" fill="#1d1d22" />
          <path d="M45 96 L75 96 L77 120 L43 120 Z" fill="#f6f5f1" />
          <path d="M29 103 Q31 90 46 92 L47 99 Q39 98 35 106 Z" fill="#f6f5f1" />
          <path d="M91 103 Q89 90 74 92 L73 99 Q81 98 85 106 Z" fill="#f6f5f1" />
          <path d="M31 101 q2 -3 4 0 q2 -3 4 0 q2 -3 4 0 M77 101 q2 -3 4 0 q2 -3 4 0 q2 -3 4 0" fill="none" stroke="#d8d6cf" strokeWidth="1" />
          <line x1="38" y1="99" x2="82" y2="117" stroke="#121216" strokeWidth="3.2" strokeLinecap="round" />
          <g transform="rotate(-28 46 110)">
            <ellipse cx="46" cy="110" rx="15" ry="9" fill="#efe6cf" />
            <ellipse cx="43" cy="110" rx="6" ry="4" fill="#d8c79d" />
            <rect x="58" y="108" width="44" height="4" rx="1.5" fill="#2a2420" />
            <rect x="100" y="106.5" width="9" height="7" rx="2" fill="#efe6cf" />
            <path d="M40 108 v4 M44 108 v4" stroke="#8a7a55" strokeWidth="1.2" />
          </g>
        </g>
      )}
      <rect x="55" y="72" width="10" height="16" rx="4" fill="#efcdb9" />
      <ellipse cx="60" cy="51" rx="19.5" ry="22" fill="#f6dccd" />
      <path d="M38.5 50 C37 21 83 21 81.5 50 L80 41.5 Q60 44 40 41.5 Z" fill="#6b2823" />
      <path d="M45 42.5 L46 36 M53 43 L53.5 35 M61 43 L61 34 M69 43 L68.5 35" stroke="#8a3a31" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M39 45 L36.5 86 L42.5 86 L43.5 52 Z" fill="#6b2823" />
      <path d="M81 45 L83.5 86 L77.5 86 L76.5 52 Z" fill="#6b2823" />
      {outfit === 'maid' && (
        <g>
          <path d="M37 33 Q60 18 83 33 L81 37 Q60 25 39 37 Z" fill="#f6f5f1" />
          <path d="M37 33 q3 -6 7.7 -4.5 q3 -6.5 7.7 -4.5 q3 -6.8 7.6 -4.6 q4.6 -2.2 7.6 4.6 q4.7 -2 7.7 4.5 q4.7 -1.5 7.7 4.5" fill="none" stroke="#f6f5f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M43 31 q2 -2.5 4 0 M53 28 q2 -2.5 4 0 M63 28 q2 -2.5 4 0 M73 31 q2 -2.5 4 0" fill="none" stroke="#d8d6cf" strokeWidth="1" />
        </g>
      )}
      {mood === 'wave' && (
        <g>
          {[51.5, 68.5].map((x) => (
            <ellipse key={x} cx={x} cy="53" rx="2.8" ry="3.4" fill="#2b1f1d"><Blink from={3.4} dur="3.8s" /></ellipse>
          ))}
          <circle cx="52.6" cy="51.6" r="1" fill="#ffffff" />
          <circle cx="69.6" cy="51.6" r="1" fill="#ffffff" />
        </g>
      )}
      {mood === 'cheer' && <path d="M48 54 q3.5 -4.5 7 0 M65 54 q3.5 -4.5 7 0" fill="none" stroke="#2b1f1d" strokeWidth="2" strokeLinecap="round" />}
      {mood === 'oops' && <path d="M48.5 50.5 l5 2.5 -5 2.5 M71.5 50.5 l-5 2.5 5 2.5" fill="none" stroke="#2b1f1d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      <circle cx="51.5" cy="53" r="7.2" fill="#ffffff" fillOpacity=".14" stroke="#b08a55" strokeWidth="1.5" />
      <circle cx="68.5" cy="53" r="7.2" fill="#ffffff" fillOpacity=".14" stroke="#b08a55" strokeWidth="1.5" />
      <path d="M58.7 52.5 q1.3 -1.6 2.6 0 M44.3 52 L40.5 50.5 M75.7 52 L79.5 50.5" fill="none" stroke="#b08a55" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="45" cy="62" rx="4" ry="2.2" fill="#f2a0a8" fillOpacity=".55" />
      <ellipse cx="75" cy="62" rx="4" ry="2.2" fill="#f2a0a8" fillOpacity=".55" />
      {mood === 'wave' && <path d="M56.5 64.5 Q60 67.5 63.5 64.5" fill="none" stroke="#b9474f" strokeWidth="2" strokeLinecap="round" />}
      {mood === 'cheer' && <path d="M55.5 63.5 Q60 71 64.5 63.5 Z" fill="#b9474f" />}
      {mood === 'oops' && <path d="M55.5 66 q1.5 -1.5 3 0 q1.5 1.5 3 0 q1.5 -1.5 3 0" fill="none" stroke="#b9474f" strokeWidth="1.6" strokeLinecap="round" />}
      {mood === 'wave' && (
        <g>
          <animateTransform attributeName="transform" type="rotate" values="-8 90 104;14 90 104;-8 90 104" dur="0.9s" repeatCount="indefinite" />
          <path d="M90 104 L101 76" stroke={sleeve} strokeWidth="11" strokeLinecap="round" />
          <circle cx="102" cy="72" r="5.5" fill="#f6dccd" />
        </g>
      )}
      {mood === 'cheer' && (
        <g>
          <path d="M30 104 L18 74 M90 104 L102 74" stroke={sleeve} strokeWidth="11" strokeLinecap="round" />
          <circle cx="17" cy="70" r="5.5" fill="#f6dccd" />
          <circle cx="103" cy="70" r="5.5" fill="#f6dccd" />
        </g>
      )}
      {mood === 'oops' && (
        <g>
          <path d="M88 110 L80 78" stroke={sleeve} strokeWidth="11" strokeLinecap="round" />
          <circle cx="79" cy="72" r="5.5" fill="#f6dccd" />
          <SweatDrop />
        </g>
      )}
      {mood === 'wave' && <FloatingNote color="#f4b740" />}
    </Frame>
  );
});

/** The music teacher: long silver hair, white moustache, half-moon glasses, tailcoat and baton. */
export const Teacher = memo(function Teacher({ mood = 'wave', size = 120, className }: CharacterProps) {
  const label = mood === 'cheer' ? 'Thầy nhạc ăn mừng' : mood === 'oops' ? 'Thầy nhạc nói ối' : 'Thầy nhạc vung đũa chỉ huy';
  return (
    <Frame size={size} label={label} className={className} mood={mood}>
      <path d="M31 48 C27 14 93 14 89 48 Q96 72 94 96 Q88 104 81 97 Q70 104 60 98 Q50 104 39 97 Q32 104 26 96 Q24 72 31 48 Z" fill="#d9dde3" />
      <path d="M33 56 Q30 76 31 94 M41 60 Q38 80 41 96 M87 56 Q90 76 89 94 M79 60 Q82 80 79 96" fill="none" stroke="#b6bdc8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 120 C22 96 38 86 60 86 C82 86 98 96 98 120 Z" fill="#1b1e26" />
      <polygon points="44,88 54,90 60,112 46,104" fill="#2c3240" />
      <polygon points="76,88 66,90 60,112 74,104" fill="#2c3240" />
      <polygon points="53,88 60,108 67,88" fill="#f5f4ef" />
      <path d="M51 90 Q55 85 60 91 Q65 85 69 90 Q65 96 60 92 Q55 96 51 90 Z" fill="#f5f4ef" stroke="#d6d3c8" strokeWidth="0.8" />
      <circle cx="60" cy="91.5" r="2.3" fill="#c9a24a" />
      <circle cx="60" cy="102" r="1.3" fill="#c9a24a" />
      <rect x="54.5" y="72" width="11" height="15" rx="4" fill="#e6bfa5" />
      <ellipse cx="60" cy="52" rx="18" ry="21" fill="#f0cfb8" />
      <path d="M44 44 Q60 40 76 44" fill="none" stroke="#e2b9a0" strokeWidth="1" strokeLinecap="round" />
      <path d="M41 46 C40 22 80 22 79 46 Q74 33 64 33 Q60 36 56 33 Q46 33 41 46 Z" fill="#e8ebef" />
      <path d="M40 44 Q36 52 38 62 M80 44 Q84 52 82 62" fill="none" stroke="#e8ebef" strokeWidth="5" strokeLinecap="round" />
      <path d="M49 31 Q55 27 60 32 M60 32 Q66 27 72 31" fill="none" stroke="#c7cdd6" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M45 45 q5 -3.5 10 -1 M65 44 q5 -2.5 10 1" fill="none" stroke="#f5f6f8" strokeWidth="3.6" strokeLinecap="round" />
      {mood === 'wave' && [51, 69].map((x) => (
        <ellipse key={x} cx={x} cy="51" rx="2.2" ry="2.6" fill="#2b2320"><Blink from={2.6} dur="4.4s" /></ellipse>
      ))}
      {mood === 'cheer' && <path d="M48 52 q3 -3.5 6 0 M66 52 q3 -3.5 6 0" fill="none" stroke="#2b2320" strokeWidth="1.8" strokeLinecap="round" />}
      {mood === 'oops' && <path d="M48.5 49 l4.5 2.2 -4.5 2.2 M71.5 49 l-4.5 2.2 4.5 2.2" fill="none" stroke="#2b2320" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
      <path d="M44.5 55 Q51 61 57.5 55 M62.5 55 Q69 61 75.5 55" fill="#ffffff" fillOpacity=".12" stroke="#c9a24a" strokeWidth="1.4" />
      <path d="M57.5 55 q2.5 -1.5 5 0" fill="none" stroke="#c9a24a" strokeWidth="1.2" />
      <path d="M60 55 q-1.5 5 -2.5 7 q2.5 1.2 5 0" fill="none" stroke="#d9a88b" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="45" cy="61" rx="3.6" ry="2" fill="#ec9b9b" fillOpacity=".45" />
      <ellipse cx="75" cy="61" rx="3.6" ry="2" fill="#ec9b9b" fillOpacity=".45" />
      <path d="M47 66 Q53 61 60 65 Q67 61 73 66 Q70 70 66 68 Q63 70 60 67.5 Q57 70 54 68 Q50 70 47 66 Z" fill="#f2f3f5" />
      {mood === 'wave' && <path d="M56 70.5 Q60 73 64 70.5" fill="none" stroke="#8c4a44" strokeWidth="1.6" strokeLinecap="round" />}
      {mood === 'cheer' && <path d="M55.5 69.5 Q60 77 64.5 69.5 Z" fill="#8c4a44" />}
      {mood === 'oops' && <path d="M55.5 71.5 q1.5 -1.5 3 0 q1.5 1.5 3 0 q1.5 -1.5 3 0" fill="none" stroke="#8c4a44" strokeWidth="1.5" strokeLinecap="round" />}
      {mood === 'wave' && (
        <g>
          <animateTransform attributeName="transform" type="rotate" values="-6 90 104;12 90 104;-6 90 104" dur="1.1s" repeatCount="indefinite" />
          <path d="M90 104 L100 78" stroke="#1b1e26" strokeWidth="11" strokeLinecap="round" />
          <rect x="95" y="73" width="10" height="5" rx="2" fill="#f5f4ef" />
          <circle cx="101" cy="72" r="5" fill="#f0cfb8" />
          <line x1="102" y1="70" x2="114" y2="46" stroke="#f5f4ef" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {mood === 'cheer' && (
        <g>
          <path d="M30 104 L18 74 M90 104 L102 74" stroke="#1b1e26" strokeWidth="11" strokeLinecap="round" />
          <circle cx="17" cy="70" r="5" fill="#f0cfb8" />
          <circle cx="103" cy="70" r="5" fill="#f0cfb8" />
          <line x1="104" y1="68" x2="112" y2="44" stroke="#f5f4ef" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {mood === 'oops' && (
        <g>
          <path d="M88 110 L78 66" stroke="#1b1e26" strokeWidth="11" strokeLinecap="round" />
          <circle cx="77" cy="62" r="5" fill="#f0cfb8" />
          <SweatDrop />
        </g>
      )}
      {mood === 'wave' && <FloatingNote color="#c9a24a" />}
    </Frame>
  );
});
