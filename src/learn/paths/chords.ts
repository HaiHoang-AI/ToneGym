import type { Bilingual } from '../../theory';
import type { LessonDef, PathDef, Register, Slide, TrapSpec } from '../types';

const b = (vi: string, en: string): Bilingual => ({ vi, en });

const TRIADS = ['maj', 'min', 'dim', 'aug'];
const SEVENTHS = ['maj7', 'dom7', 'min7', 'm7b5', 'dim7'];
const ALL = [...TRIADS, ...SEVENTHS];

/** C chord tones of each quality (C3 root). */
const C: Record<string, number[]> = {
  maj: [48, 52, 55], min: [48, 51, 55], dim: [48, 51, 54], aug: [48, 52, 56], sus4: [48, 53, 55],
  maj7: [48, 52, 55, 59], dom7: [48, 52, 55, 58], min7: [48, 51, 55, 58], m7b5: [48, 51, 54, 58], dim7: [48, 51, 54, 57],
};
/** Two demos for a quality: together, then spread out. */
const demo = (id: string, vi: string, en: string) => [
  { label: b(vi, en), notes: C[id]!, together: true },
  { label: b('Nghe rải', 'Spread out'), notes: C[id]! },
];
const pair = (a: string, c: string, register?: Register): TrapSpec => ({ kind: 'pair', a, b: c, register });

interface LessonInput {
  id: string;
  title: Bilingual;
  desc: Bilingual;
  newItems?: string[];
  slides: Slide[];
  anchors?: string[];
  pool: string[];
  register?: Register;
  traps?: TrapSpec[];
  mode?: 'name' | 'yesno';
  yesItem?: string;
  decoys?: string[];
}

const lesson = (x: LessonInput): LessonDef => ({ kind: 'lesson', newItems: [], anchors: [], register: 'chord', traps: [], questionCount: 20, ...x });

const checkpoint = (id: string, title: Bilingual, desc: Bilingual, pool: string[], register: Register = 'chord'): LessonDef => ({
  id, kind: 'checkpoint', title, desc, newItems: [], slides: [], anchors: [], pool, register, traps: [], questionCount: 30, timeLimitMs: 8000,
});

const LESSONS: LessonDef[] = [
  {
    id: 'ch-intro',
    kind: 'intro',
    title: b('Làm quen với hợp âm', 'Getting started with chords'),
    desc: b('Hợp âm là gì, tính chất là gì', 'What a chord is and what a quality is'),
    newItems: [],
    slides: [
      { title: b('Ba nốt trở lên cùng lúc', 'Three or more notes at once'), body: b('Hợp âm là từ ba nốt trở lên vang cùng lúc. Nốt thấp nhất ở thế gốc gọi là nốt gốc và đặt tên cho hợp âm: Đô–Mi–Sol là hợp âm Đô.', 'A chord is three or more notes at once. In root position the lowest is the root and names the chord: C–E–G is a C chord.'), keys: C.maj!, examples: demo('maj', 'Đô trưởng', 'C major') },
      { title: b('Chồng quãng 3', 'Stacked thirds'), body: b('Hợp âm cơ bản được xếp bằng các quãng 3 chồng lên nhau. Thay quãng 3 trưởng hay thứ ở mỗi tầng là ra tính chất khác: trưởng, thứ, giảm, tăng…', 'Basic chords are built from stacked thirds. Choosing major or minor thirds on each floor gives the quality: major, minor, diminished, augmented…'), keys: C.min!, examples: demo('min', 'Đô thứ', 'C minor') },
      { title: b('Nghe tính chất, không nghe tên nốt', 'Hear the quality, not the notes'), body: b('Ở lộ trình này bạn chỉ cần nói hợp âm "vui", "buồn", "căng"… thuộc loại nào. Nốt gốc sẽ thay đổi liên tục.', 'In this path you only say which kind of chord it is — happy, sad, tense… The root keeps changing.') },
    ],
    anchors: [],
    pool: ['maj', 'min'],
    register: 'chord',
    traps: [],
    questionCount: 5,
  },
  lesson({
    id: 'ch-1', title: b('Hợp âm trưởng', 'Major chord'), desc: b('Sáng và vững', 'Bright and steady'),
    newItems: ['maj'], pool: ['maj'], mode: 'yesno', yesItem: 'maj', decoys: ['dim', 'aug', 'min', 'sus4'],
    anchors: ['ch-ode-maj'], traps: [pair('maj', 'sus4')],
    slides: [
      { title: b('Quãng 3 trưởng + quãng 3 thứ', 'Major third + minor third'), body: b('Đô–Mi (M3) rồi Mi–Sol (m3). Hợp âm trưởng nghe sáng, vui, vững vàng: phần lớn bài hát kết bằng nó.', 'C–E (M3) then E–G (m3). A major chord is bright, happy and settled: most songs end on one.'), keys: C.maj!, examples: demo('maj', 'Đô trưởng', 'C major') },
      { title: b('Đừng nhầm với sus4', 'Not to be confused with sus4'), body: b('Sus4 thay Mi bằng Fa: nghe "treo", chưa xong. Bài này hỏi: có phải hợp âm trưởng không?', 'Sus4 swaps E for F: it sounds suspended, unfinished. This lesson asks: is it major?'), examples: [{ label: b('Trưởng', 'Major'), notes: C.maj!, together: true }, { label: b('Sus4', 'Sus4'), notes: C.sus4!, together: true }] },
    ],
  }),
  lesson({
    id: 'ch-2', title: b('Hợp âm thứ', 'Minor chord'), desc: b('Buồn và nghiêm', 'Sad and serious'),
    newItems: ['min'], pool: ['min'], mode: 'yesno', yesItem: 'min', decoys: ['aug', 'maj', 'sus4', 'dim'],
    anchors: ['ch-greensleeves-min'], traps: [pair('min', 'dim')],
    slides: [
      { title: b('Quãng 3 thứ + quãng 3 trưởng', 'Minor third + major third'), body: b('Đô–Mi♭ (m3) rồi Mi♭–Sol (M3). Ngược thứ tự với hợp âm trưởng, và nghe buồn, nghiêm.', 'C–E♭ (m3) then E♭–G (M3). The reverse of major, and sad, serious.'), keys: C.min!, examples: demo('min', 'Đô thứ', 'C minor') },
    ],
  }),
  lesson({
    id: 'ch-3', title: b('Vui hay buồn', 'Happy or sad'), desc: b('Trưởng hay thứ', 'Major or minor'),
    pool: ['maj', 'min'], anchors: ['ch-maj-min'], traps: [pair('maj', 'min')],
    slides: [{ title: b('Chỉ khác một nốt', 'One note apart'), body: b('Hạ nốt giữa nửa cung là trưởng thành thứ. Nghe nốt giữa: sáng hay tối?', 'Lower the middle note a half step and major turns minor. Listen to the middle: bright or dark?'), examples: [{ label: b('Trưởng → thứ', 'Major → minor'), notes: [48, 52, 55, 48, 51, 55] }] }],
  }),
  checkpoint('ch-cp1', b('Checkpoint: hợp âm cơ bản', 'Checkpoint: basic chords'), b('30 câu trưởng / thứ', '30 questions, major / minor'), ['maj', 'min']),
  lesson({
    id: 'ch-4', title: b('Hợp âm giảm', 'Diminished chord'), desc: b('Căng, bất an', 'Tense and uneasy'),
    newItems: ['dim'], pool: ['maj', 'min', 'dim'], anchors: ['ch-dim'], traps: [pair('dim', 'min')],
    slides: [{ title: b('Hai quãng 3 thứ', 'Two minor thirds'), body: b('Đô–Mi♭–Sol♭: hai quãng 3 thứ chồng lên nhau. Quãng 5 bị hạ thành tritone nên nghe căng, bất an — như nhạc phim câm lúc có kẻ xấu xuất hiện.', 'C–E♭–G♭: two minor thirds. The fifth shrinks to a tritone, so it sounds tense and uneasy — the villain chord of silent films.'), keys: C.dim!, examples: demo('dim', 'Đô giảm', 'C diminished') }],
  }),
  lesson({
    id: 'ch-5', title: b('Hợp âm tăng', 'Augmented chord'), desc: b('Mơ, lơ lửng', 'Dreamy, floating'),
    newItems: ['aug'], pool: ['maj', 'min', 'aug'], anchors: ['ch-aug'], traps: [pair('aug', 'maj')],
    slides: [{ title: b('Hai quãng 3 trưởng', 'Two major thirds'), body: b('Đô–Mi–Sol♯: quãng 5 được nâng lên. Nghe mơ màng, lơ lửng như nhạc Debussy, không biết sẽ đi về đâu.', 'C–E–G♯: the fifth is raised. Dreamy and floating like Debussy, with no clear direction.'), keys: C.aug!, examples: demo('aug', 'Đô tăng', 'C augmented') }],
  }),
  lesson({
    id: 'ch-6', title: b('Hai hợp âm lạ', 'The two odd ones'), desc: b('Giảm hay tăng', 'Diminished or augmented'),
    pool: ['dim', 'aug'], anchors: ['ch-dim', 'ch-aug'], traps: [pair('dim', 'aug')],
    slides: [{ title: b('Co lại hay giãn ra', 'Squeezed or stretched'), body: b('Giảm: co lại, tối, đáng sợ. Tăng: giãn ra, sáng, mơ hồ.', 'Diminished: squeezed, dark, scary. Augmented: stretched, bright, vague.'), examples: [{ label: b('Giảm', 'Diminished'), notes: C.dim!, together: true }, { label: b('Tăng', 'Augmented'), notes: C.aug!, together: true }] }],
  }),
  checkpoint('ch-cp2', b('Checkpoint: bốn hợp âm ba', 'Checkpoint: four triads'), b('30 câu trưởng, thứ, giảm, tăng', '30 questions, major, minor, diminished, augmented'), TRIADS),
  lesson({
    id: 'ch-7', title: b('Bảy trưởng (maj7)', 'Major seventh (maj7)'), desc: b('Ngọt, hoài niệm', 'Sweet, nostalgic'),
    newItems: ['maj7'], pool: ['maj', 'maj7'], anchors: ['ch-cmaj7'], traps: [pair('maj7', 'maj')],
    slides: [{ title: b('Thêm quãng 7 trưởng', 'Add a major seventh'), body: b('Đô–Mi–Sol–Si: hợp âm trưởng cộng nốt Si. Ngọt, mềm, hơi hoài niệm — rất hay gặp trong jazz và bossa nova.', 'C–E–G–B: a major chord plus B. Sweet, soft, a little nostalgic — common in jazz and bossa nova.'), keys: C.maj7!, examples: demo('maj7', 'Đô maj7', 'Cmaj7') }],
  }),
  lesson({
    id: 'ch-8', title: b('Bảy át (7)', 'Dominant seventh (7)'), desc: b('Blues, đòi giải quyết', 'Bluesy, wants to resolve'),
    newItems: ['dom7'], pool: ['maj7', 'dom7'], anchors: ['ch-blues-i7'], traps: [pair('dom7', 'maj')],
    slides: [{ title: b('Thêm quãng 7 thứ', 'Add a minor seventh'), body: b('Đô–Mi–Sol–Si♭: nghe như blues, và luôn muốn đi tiếp — thường về hợp âm cách nó quãng 5 xuống.', 'C–E–G–B♭: bluesy, and it always wants to move on — usually down a fifth.'), keys: C.dom7!, examples: demo('dom7', 'Đô 7', 'C7') }],
  }),
  lesson({
    id: 'ch-9', title: b('Ngọt hay blues', 'Sweet or bluesy'), desc: b('maj7 hay 7', 'maj7 or 7'),
    pool: ['maj7', 'dom7'], anchors: ['ch-cmaj7', 'ch-blues-i7'], traps: [pair('maj7', 'dom7')],
    slides: [{ title: b('Nốt trên cùng', 'The top note'), body: b('Hai hợp âm chỉ khác nốt trên cùng: Si (ngọt, sát nốt gốc ở trên) hay Si♭ (blues).', 'They only differ on the top note: B (sweet, rubbing against the octave) or B♭ (bluesy).'), examples: [{ label: b('maj7', 'maj7'), notes: C.maj7!, together: true }, { label: b('7', '7'), notes: C.dom7!, together: true }] }],
  }),
  lesson({
    id: 'ch-10', title: b('Bảy thứ (m7)', 'Minor seventh (m7)'), desc: b('Êm, "cool"', 'Smooth and cool'),
    newItems: ['min7'], pool: ['dom7', 'min7', 'maj7'], anchors: ['ch-am7'], traps: [pair('min7', 'min')],
    slides: [{ title: b('Hợp âm thứ cộng quãng 7 thứ', 'Minor chord plus a minor seventh'), body: b('Đô–Mi♭–Sol–Si♭: buồn của hợp âm thứ nhưng êm hơn, "cool" hơn.', 'C–E♭–G–B♭: the sadness of minor, but smoother and cooler.'), keys: C.min7!, examples: demo('min7', 'Đô m7', 'Cm7') }],
  }),
  lesson({
    id: 'ch-11', title: b('Căng hay êm', 'Tense or smooth'), desc: b('7 hay m7', '7 or m7'),
    pool: ['dom7', 'min7'], anchors: ['ch-blues-i7', 'ch-am7'], traps: [pair('dom7', 'min7')],
    slides: [{ title: b('Nốt thứ hai', 'The second note'), body: b('Hai hợp âm khác nhau ở nốt Mi hay Mi♭: 7 sáng mà căng, m7 tối mà êm.', 'They differ on E or E♭: 7 is bright but tense, m7 dark but smooth.'), examples: [{ label: b('7', '7'), notes: C.dom7!, together: true }, { label: b('m7', 'm7'), notes: C.min7!, together: true }] }],
  }),
  checkpoint('ch-cp3', b('Checkpoint: hợp âm 7 thông dụng', 'Checkpoint: common sevenths'), b('30 câu maj7, 7, m7', '30 questions, maj7, 7, m7'), ['maj7', 'dom7', 'min7']),
  lesson({
    id: 'ch-12', title: b('Nửa giảm (m7♭5)', 'Half-diminished (m7♭5)'), desc: b('Tối, bí ẩn', 'Dark and mysterious'),
    newItems: ['m7b5'], pool: ['min7', 'm7b5'], anchors: ['ch-ii-minor'], traps: [pair('m7b5', 'min7')],
    slides: [{ title: b('Hợp âm giảm + quãng 7 thứ', 'Diminished plus a minor seventh'), body: b('Đô–Mi♭–Sol♭–Si♭. Hay đứng ở bậc II của giọng thứ, dẫn sang hợp âm 7 rồi về chủ.', 'C–E♭–G♭–B♭. Often the II chord of a minor key, leading to a 7 chord and home.'), keys: C.m7b5!, examples: demo('m7b5', 'Đô ø7', 'Cø7') }],
  }),
  lesson({
    id: 'ch-13', title: b('Bảy giảm (°7)', 'Diminished seventh (°7)'), desc: b('Đối xứng, rùng rợn', 'Symmetric and eerie'),
    newItems: ['dim7'], pool: ['m7b5', 'dim7'], anchors: ['ch-toccata'], traps: [pair('dim7', 'dim')],
    slides: [{ title: b('Bốn quãng 3 thứ', 'All minor thirds'), body: b('Đô–Mi♭–Sol♭–Si𝄫: mọi nốt cách đều nhau. Nghe rùng rợn, kịch tính — như hợp âm nổi tiếng ở đầu Toccata cung Rê thứ của Bach.', 'C–E♭–G♭–B𝄫: every note equally spaced. Eerie and dramatic — like the famous chord at the start of Bach\'s Toccata in D minor.'), keys: C.dim7!, examples: demo('dim7', 'Đô °7', 'C°7') }],
  }),
  lesson({
    id: 'ch-14', title: b('Hai kiểu giảm', 'Two kinds of diminished'), desc: b('ø7 hay °7', 'ø7 or °7'),
    pool: ['m7b5', 'dim7'], anchors: ['ch-ii-minor', 'ch-toccata'], traps: [pair('m7b5', 'dim7')],
    slides: [{ title: b('Nốt trên cùng', 'The top note'), body: b('ø7 có quãng 7 thứ (Si♭): còn chút ấm. °7 hạ thêm nửa cung (La): hoàn toàn đối xứng, lạnh.', 'ø7 has a minor seventh (B♭): a little warmth left. °7 drops another half step (A): fully symmetric and cold.'), examples: [{ label: b('ø7', 'ø7'), notes: C.m7b5!, together: true }, { label: b('°7', '°7'), notes: C.dim7!, together: true }] }],
  }),
  checkpoint('ch-cp4', b('Checkpoint: tất cả hợp âm 7', 'Checkpoint: all sevenths'), b('30 câu maj7, m7, 7, ø7, °7', '30 questions, maj7, m7, 7, ø7, °7'), SEVENTHS),
  lesson({
    id: 'ch-15', title: b('Hợp âm ba dưới trầm', 'Triads down low'), desc: b('Trưởng / thứ ở quãng tám 2', 'Major / minor in octave 2'),
    pool: ['maj', 'min'], register: 'chordLow', traps: [pair('maj', 'min', 'chordLow')],
    slides: [{ title: b('Tiếng đục', 'A muddy sound'), body: b('Ở âm vực trầm các nốt dính vào nhau, nghe đục. Hãy để ý cảm giác chung: sáng hay tối.', 'Down low the notes blur together. Listen for the overall feel: bright or dark.'), examples: [{ label: b('Đô trưởng trầm', 'Low C major'), notes: [36, 40, 43], together: true }, { label: b('Đô thứ trầm', 'Low C minor'), notes: [36, 39, 43], together: true }] }],
  }),
  lesson({
    id: 'ch-16', title: b('Căng dưới trầm', 'Tension down low'), desc: b('Giảm / tăng ở quãng tám 2', 'Diminished / augmented in octave 2'),
    pool: ['dim', 'aug'], register: 'chordLow', traps: [pair('dim', 'aug', 'chordLow')],
    slides: [{ title: b('Giảm và tăng trầm', 'Low diminished and augmented'), body: b('Hai hợp âm lạ ở dưới trầm nghe càng bí ẩn.', 'The odd pair sounds even more mysterious down low.'), examples: [{ label: b('Giảm', 'Diminished'), notes: [36, 39, 42], together: true }, { label: b('Tăng', 'Augmented'), notes: [36, 40, 44], together: true }] }],
  }),
  lesson({
    id: 'ch-17', title: b('Hợp âm 7 dưới trầm', 'Sevenths down low'), desc: b('Năm loại 7 ở âm vực thấp', 'Five sevenths, low'),
    pool: SEVENTHS, register: 'chordLow', traps: [pair('maj7', 'dom7', 'chordLow')],
    slides: [{ title: b('Năm hợp âm 7', 'Five sevenths'), body: b('Nhớ lại: maj7 ngọt, 7 blues, m7 êm, ø7 bí ẩn, °7 rùng rợn.', 'Recall: maj7 sweet, 7 bluesy, m7 smooth, ø7 mysterious, °7 eerie.') }],
  }),
  checkpoint('ch-cp5', b('Checkpoint: tiếng trầm', 'Checkpoint: the low register'), b('30 câu, 9 loại, âm vực thấp', '30 questions, nine qualities, low'), ALL, 'chordLow'),
  lesson({
    id: 'ch-18', title: b('Hợp âm ba ngẫu nhiên', 'Triads anywhere'), desc: b('Bốn loại, mọi quãng tám', 'Four qualities, any octave'),
    pool: TRIADS, register: 'chordAny', traps: [pair('dim', 'min', 'chordAny')],
    slides: [{ title: b('Mọi độ cao', 'Every height'), body: b('Nốt gốc từ Đô 2 đến Đô 4.', 'Roots from C2 to C4.') }],
  }),
  lesson({
    id: 'ch-19', title: b('Hợp âm 7 ngẫu nhiên', 'Sevenths anywhere'), desc: b('Năm loại, mọi quãng tám', 'Five qualities, any octave'),
    pool: SEVENTHS, register: 'chordAny', traps: [pair('min7', 'm7b5', 'chordAny')],
    slides: [{ title: b('Bài cuối trước khi thi', 'Last lesson before the exam'), body: b('Năm hợp âm 7, nốt gốc bất kỳ.', 'Five sevenths, any root.') }],
  }),
  {
    id: 'ch-final',
    kind: 'final',
    title: b('Thi cuối: bậc thầy hòa âm', 'Final exam: harmony master'),
    desc: b('40 câu, 9 loại, mọi quãng tám, 6 giây mỗi câu', '40 questions, nine qualities, any octave, 6 s each'),
    newItems: [],
    slides: [],
    anchors: [],
    pool: ALL,
    register: 'chordAny',
    traps: [],
    questionCount: 40,
    timeLimitMs: 6000,
  },
];

export const CHORDS_PATH: PathDef = {
  id: 'chords',
  title: b('Hợp âm', 'Chords'),
  tagline: b('Tính chất của hợp âm', 'Chord qualities'),
  color: '#a78bfa',
  items: ALL,
  lessons: LESSONS,
};
