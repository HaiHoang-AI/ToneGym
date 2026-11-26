import type { Bilingual } from '../../theory';
import { buildScale, getScale } from '../../theory';
import type { Direction, LessonDef, PathDef, Register, Slide, TrapSpec } from '../types';

const b = (vi: string, en: string): Bilingual => ({ vi, en });

const ALL = [
  'major', 'naturalMinor', 'majorPentatonic', 'minorPentatonic', 'blues', 'harmonicMinor', 'melodicMinor',
  'dorian', 'mixolydian', 'lydian', 'phrygian', 'locrian', 'wholeTone', 'chromatic',
];
const MODES = ['lydian', 'major', 'mixolydian', 'dorian', 'naturalMinor', 'phrygian', 'locrian'];

/** The scale from C4, going up. */
const up = (id: string, root = 60) => buildScale(root, getScale(id));
const ex = (vi: string, en: string, id: string, root?: number) => ({ label: b(vi, en), notes: up(id, root) });
const keysOf = (id: string) => getScale(id).formula.map((s) => 60 + s);
const pair = (a: string, c: string, direction?: Direction): TrapSpec => ({ kind: 'pair', a, b: c, direction });

interface LessonInput {
  id: string;
  title: Bilingual;
  desc: Bilingual;
  newItems?: string[];
  slides: Slide[];
  anchors?: string[];
  pool: string[];
  register?: Register;
  direction?: Direction;
  traps?: TrapSpec[];
  mode?: 'name' | 'yesno';
  yesItem?: string;
  decoys?: string[];
}

const lesson = (x: LessonInput): LessonDef => ({ kind: 'lesson', newItems: [], anchors: [], register: 'scale', direction: 'up', traps: [], questionCount: 20, ...x });
const checkpoint = (id: string, title: Bilingual, desc: Bilingual, pool: string[], direction: Direction = 'up', register: Register = 'scale'): LessonDef => ({
  id, kind: 'checkpoint', title, desc, newItems: [], slides: [], anchors: [], pool, register, direction, traps: [], questionCount: 30, timeLimitMs: 8000,
});

const LESSONS: LessonDef[] = [
  {
    id: 'sc-intro',
    kind: 'intro',
    title: b('Làm quen với âm giai', 'Getting started with scales'),
    desc: b('Âm giai là gì, "màu" của âm giai', 'What a scale is and its colour'),
    newItems: [],
    slides: [
      { title: b('Bộ nốt có thứ tự', 'An ordered set of notes'), body: b('Âm giai là một bộ nốt xếp từ thấp lên cao, bắt đầu và kết thúc ở cùng một nốt (chủ âm). Mỗi âm giai có công thức khoảng cách riêng.', 'A scale is a set of notes from low to high, starting and ending on the same note (the tonic). Each scale has its own pattern of steps.'), keys: keysOf('major'), examples: [ex('Đô trưởng', 'C major', 'major')] },
      { title: b('Nghe "màu", không đếm nốt', 'Hear the colour, do not count'), body: b('Bạn không cần đếm từng bước. Hãy nghe cảm giác chung: sáng, tối, lạ, Tây Ban Nha, blues… Mỗi bài sẽ chỉ ra nốt tạo màu riêng.', 'You do not need to count steps. Listen to the overall feel: bright, dark, exotic, Spanish, bluesy… Each lesson points out the note that gives the colour.'), keys: keysOf('naturalMinor'), examples: [ex('Đô thứ', 'C minor', 'naturalMinor')] },
    ],
    anchors: [],
    pool: ['major', 'naturalMinor'],
    register: 'scale',
    direction: 'up',
    traps: [],
    questionCount: 5,
  },
  lesson({
    id: 'sc-1', title: b('Âm giai trưởng', 'Major scale'), desc: b('N–N–½–N–N–N–½', 'W–W–H–W–W–W–H'),
    newItems: ['major'], pool: ['major'], mode: 'yesno', yesItem: 'major', decoys: ['chromatic', 'wholeTone', 'naturalMinor', 'mixolydian'],
    anchors: ['sc-joy-major'], traps: [pair('major', 'mixolydian')],
    slides: [
      { title: b('Công thức', 'The pattern'), body: b('Nguyên – nguyên – nửa – nguyên – nguyên – nguyên – nửa. Đô trưởng là bảy phím trắng từ Đô đến Đô. "Joy to the World" chính là âm giai trưởng đi xuống.', 'Whole – whole – half – whole – whole – whole – half. C major is the seven white keys from C to C. "Joy to the World" is the major scale going down.'), keys: keysOf('major'), examples: [ex('Đi lên', 'Up', 'major'), { label: b('Đi xuống', 'Down'), notes: [...up('major')].reverse() }] },
    ],
  }),
  lesson({
    id: 'sc-2', title: b('Thứ tự nhiên', 'Natural minor'), desc: b('♭3, ♭6, ♭7', '♭3, ♭6, ♭7'),
    newItems: ['naturalMinor'], pool: ['major', 'naturalMinor'], anchors: ['sc-greensleeves-minor'], traps: [pair('naturalMinor', 'major')],
    slides: [{ title: b('Ba nốt hạ xuống', 'Three lowered notes'), body: b('So với trưởng cùng chủ âm, thứ tự nhiên hạ bậc 3, 6 và 7 nửa cung. Nghe tối, buồn. La thứ là bảy phím trắng từ La.', 'Against the major scale on the same tonic, natural minor lowers the 3rd, 6th and 7th. Dark and sad. A minor is the white keys from A.'), keys: keysOf('naturalMinor'), examples: [ex('Đô thứ', 'C minor', 'naturalMinor'), ex('La thứ', 'A minor', 'naturalMinor', 57)] }],
  }),
  lesson({
    id: 'sc-3', title: b('Sáng hay tối', 'Bright or dark'), desc: b('Trưởng hay thứ', 'Major or minor'),
    pool: ['major', 'naturalMinor'], direction: 'both', anchors: ['sc-joy-major', 'sc-greensleeves-minor'], traps: [pair('major', 'naturalMinor', 'down')],
    slides: [{ title: b('Nghe nốt thứ ba', 'Listen to the third note'), body: b('Bậc 3 quyết định: Mi (sáng) hay Mi♭ (tối). Câu hỏi giờ có cả đi lên và đi xuống.', 'The 3rd decides: E (bright) or E♭ (dark). Questions now go up and down.'), examples: [ex('Trưởng', 'Major', 'major'), ex('Thứ', 'Minor', 'naturalMinor')] }],
  }),
  checkpoint('sc-cp1', b('Checkpoint: hai âm giai gốc', 'Checkpoint: the two basic scales'), b('30 câu trưởng / thứ, lên và xuống', '30 questions, major / minor, up and down'), ['major', 'naturalMinor'], 'both'),
  lesson({
    id: 'sc-4', title: b('Ngũ cung trưởng', 'Major pentatonic'), desc: b('Năm nốt, không nửa cung', 'Five notes, no half steps'),
    newItems: ['majorPentatonic'], pool: ['major', 'naturalMinor', 'majorPentatonic'], anchors: ['sc-amazing-penta', 'sc-auld-penta'], traps: [pair('majorPentatonic', 'major')],
    slides: [{ title: b('Bỏ Fa và Si', 'Drop F and B'), body: b('Đô Rê Mi Sol La: âm giai trưởng bỏ hai nốt căng. Rất nhiều dân ca khắp thế giới — kể cả dân ca Việt Nam — dùng năm nốt này. Amazing Grace và Auld Lang Syne cũng vậy.', 'C D E G A: the major scale without its two tense notes. Folk songs all over the world — Vietnamese ones too — use these five. So do Amazing Grace and Auld Lang Syne.'), keys: keysOf('majorPentatonic'), examples: [ex('Ngũ cung Đô', 'C pentatonic', 'majorPentatonic')] }],
  }),
  lesson({
    id: 'sc-5', title: b('Ngũ cung thứ', 'Minor pentatonic'), desc: b('Âm giai của guitar rock', 'The rock guitar scale'),
    newItems: ['minorPentatonic'], pool: ['naturalMinor', 'majorPentatonic', 'minorPentatonic'], anchors: ['sc-minor-penta'], traps: [pair('minorPentatonic', 'naturalMinor')],
    slides: [{ title: b('Thứ bỏ hai nốt', 'Minor minus two'), body: b('La Đô Rê Mi Sol: cùng năm nốt với Đô ngũ cung trưởng, nhưng chủ âm là La. Nghe buồn, mộc, rất "rock".', 'A C D E G: the same five notes as C major pentatonic, with A as home. Sad, raw, very rock.'), keys: [57, 60, 62, 64, 67], examples: [ex('La ngũ cung thứ', 'A minor pentatonic', 'minorPentatonic', 57)] }],
  }),
  lesson({
    id: 'sc-6', title: b('Hai ngũ cung', 'The two pentatonics'), desc: b('Trưởng hay thứ', 'Major or minor'),
    pool: ['majorPentatonic', 'minorPentatonic'], direction: 'both', anchors: ['sc-auld-penta', 'sc-minor-penta'], traps: [pair('majorPentatonic', 'minorPentatonic')],
    slides: [{ title: b('Cùng nốt, khác nhà', 'Same notes, different home'), body: b('Nghe xem âm giai bắt đầu bằng bước nguyên (trưởng) hay nhảy quãng 3 thứ (thứ).', 'Listen whether it starts with a whole step (major) or a minor-third jump (minor).'), examples: [ex('Ngũ cung trưởng', 'Major pentatonic', 'majorPentatonic'), ex('Ngũ cung thứ', 'Minor pentatonic', 'minorPentatonic')] }],
  }),
  lesson({
    id: 'sc-7', title: b('Blues', 'Blues'), desc: b('Thêm nốt "blue" ♭5', 'Add the blue note ♭5'),
    newItems: ['blues'], pool: ['minorPentatonic', 'blues', 'majorPentatonic'], anchors: ['sc-blues'], traps: [pair('blues', 'minorPentatonic')],
    slides: [{ title: b('Nốt chen giữa', 'The note in between'), body: b('Ngũ cung thứ thêm Fa♯ (♭5) giữa Fa và Sol. Nốt này nghe "lệch", rất blues.', 'Minor pentatonic plus F♯ (♭5) between F and G. That bent, off note is the blues.'), keys: keysOf('blues'), examples: [ex('Blues Đô', 'C blues', 'blues')] }],
  }),
  checkpoint('sc-cp2', b('Checkpoint: gia đình ngũ cung', 'Checkpoint: the pentatonic family'), b('30 câu', '30 questions'), ['major', 'naturalMinor', 'majorPentatonic', 'minorPentatonic', 'blues']),
  lesson({
    id: 'sc-8', title: b('Thứ hòa âm', 'Harmonic minor'), desc: b('♯7 tạo bước quãng 2 tăng', '♯7 makes an augmented second'),
    newItems: ['harmonicMinor'], pool: ['naturalMinor', 'harmonicMinor'], anchors: ['sc-harmonic-minor'], traps: [pair('harmonicMinor', 'naturalMinor')],
    slides: [{ title: b('Nốt dẫn trong giọng thứ', 'A leading note in minor'), body: b('Nâng bậc 7 lên nửa cung để có nốt dẫn về chủ âm. Giữa bậc 6 và 7 thành một bước rộng (quãng 2 tăng) nghe rất "phương Đông".', 'Raise the 7th a half step to get a leading note. Between the 6th and 7th opens a wide gap (augmented second) that sounds exotic.'), keys: keysOf('harmonicMinor'), examples: [ex('Đô thứ hòa âm', 'C harmonic minor', 'harmonicMinor')] }],
  }),
  lesson({
    id: 'sc-9', title: b('Thứ giai điệu', 'Melodic minor'), desc: b('♯6 và ♯7', '♯6 and ♯7'),
    newItems: ['melodicMinor'], pool: ['naturalMinor', 'harmonicMinor', 'melodicMinor'], anchors: ['sc-melodic-minor'], traps: [pair('harmonicMinor', 'melodicMinor')],
    slides: [{ title: b('Lấp khoảng trống', 'Filling the gap'), body: b('Nâng cả bậc 6 và 7: nửa dưới là thứ, nửa trên giống trưởng. Bước đi trơn tru, không còn quãng 2 tăng.', 'Raise both the 6th and 7th: the bottom half is minor, the top half like major. Smooth, no augmented second.'), keys: keysOf('melodicMinor'), examples: [ex('Đô thứ giai điệu', 'C melodic minor', 'melodicMinor')] }],
  }),
  lesson({
    id: 'sc-10', title: b('Ba dạng thứ', 'Three minors'), desc: b('Tự nhiên, hòa âm, giai điệu', 'Natural, harmonic, melodic'),
    pool: ['naturalMinor', 'harmonicMinor', 'melodicMinor'], traps: [pair('naturalMinor', 'harmonicMinor')],
    slides: [{ title: b('Nghe nửa trên', 'Listen to the top half'), body: b('Cả ba giống nhau ở nửa dưới. Nửa trên: tự nhiên buồn đều, hòa âm có bước rộng lạ, giai điệu sáng như trưởng.', 'All three share the bottom half. Top half: natural stays sad, harmonic has the odd wide step, melodic brightens like major.'), examples: [ex('Tự nhiên', 'Natural', 'naturalMinor'), ex('Hòa âm', 'Harmonic', 'harmonicMinor'), ex('Giai điệu', 'Melodic', 'melodicMinor')] }],
  }),
  checkpoint('sc-cp3', b('Checkpoint: âm giai thứ', 'Checkpoint: minor scales'), b('30 câu ba dạng thứ và trưởng', '30 questions, three minors and major'), ['major', 'naturalMinor', 'harmonicMinor', 'melodicMinor']),
  lesson({
    id: 'sc-11', title: b('Dorian', 'Dorian'), desc: b('Thứ có bậc 6 sáng', 'Minor with a bright 6th'),
    newItems: ['dorian'], pool: ['naturalMinor', 'dorian'], anchors: ['sc-dorian'], traps: [pair('dorian', 'naturalMinor')],
    slides: [{ title: b('Thứ nhưng có La', 'Minor, but with A'), body: b('Giống thứ tự nhiên nhưng bậc 6 không hạ. Buồn mà có chút hy vọng — màu của nhiều dân ca Anh như Scarborough Fair. Rê Dorian là phím trắng từ Rê.', 'Like natural minor but the 6th is not lowered. Sad with a hint of hope — the colour of English folk songs like Scarborough Fair. D Dorian is the white keys from D.'), keys: keysOf('dorian'), examples: [ex('Đô Dorian', 'C Dorian', 'dorian'), ex('Rê Dorian (phím trắng)', 'D Dorian (white keys)', 'dorian', 62)] }],
  }),
  lesson({
    id: 'sc-12', title: b('Mixolydian', 'Mixolydian'), desc: b('Trưởng có ♭7', 'Major with ♭7'),
    newItems: ['mixolydian'], pool: ['major', 'mixolydian'], anchors: ['sc-mixolydian'], traps: [pair('mixolydian', 'major')],
    slides: [{ title: b('Trưởng nhưng hơi "rock"', 'Major with a rock edge'), body: b('Âm giai trưởng hạ bậc 7. Nghe vui mà phóng khoáng, hay gặp trong rock và nhạc đồng quê. Sol Mixolydian là phím trắng từ Sol.', 'Major with a lowered 7th. Happy but loose — common in rock and fiddle tunes. G Mixolydian is the white keys from G.'), keys: keysOf('mixolydian'), examples: [ex('Đô Mixolydian', 'C Mixolydian', 'mixolydian')] }],
  }),
  lesson({
    id: 'sc-13', title: b('Dorian hay thứ', 'Dorian or minor'), desc: b('Nghe bậc 6', 'Listen to the 6th'),
    pool: ['dorian', 'naturalMinor'], direction: 'both', traps: [pair('dorian', 'naturalMinor', 'down')],
    slides: [{ title: b('Một nốt quyết định', 'One deciding note'), body: b('La (Dorian) hay La♭ (thứ tự nhiên) trên chủ âm Đô.', 'A (Dorian) or A♭ (natural minor) over a C tonic.'), examples: [ex('Dorian', 'Dorian', 'dorian'), ex('Thứ', 'Minor', 'naturalMinor')] }],
  }),
  lesson({
    id: 'sc-14', title: b('Mixolydian hay trưởng', 'Mixolydian or major'), desc: b('Nghe bậc 7', 'Listen to the 7th'),
    pool: ['mixolydian', 'major'], direction: 'both', traps: [pair('mixolydian', 'major', 'down')],
    slides: [{ title: b('Si hay Si♭', 'B or B♭'), body: b('Ở cuối âm giai: Si dẫn thẳng lên Đô (trưởng) hay Si♭ thong thả (Mixolydian).', 'At the top: B pulls up to C (major) or B♭ relaxes (Mixolydian).'), examples: [ex('Trưởng', 'Major', 'major'), ex('Mixolydian', 'Mixolydian', 'mixolydian')] }],
  }),
  checkpoint('sc-cp4', b('Checkpoint: điệu thức "anh em"', 'Checkpoint: sibling modes'), b('30 câu trưởng, thứ, Dorian, Mixolydian', '30 questions, major, minor, Dorian, Mixolydian'), ['major', 'naturalMinor', 'dorian', 'mixolydian'], 'both'),
  lesson({
    id: 'sc-15', title: b('Lydian', 'Lydian'), desc: b('♯4 lấp lánh', 'The sparkling ♯4'),
    newItems: ['lydian'], pool: ['major', 'lydian'], anchors: ['sc-lydian'], traps: [pair('lydian', 'major')],
    slides: [{ title: b('Trưởng sáng hơn nữa', 'Brighter than major'), body: b('Nâng bậc 4: Fa thành Fa♯. Nghe mơ, bay bổng như nhạc phim phép thuật. Fa Lydian là phím trắng từ Fa.', 'Raise the 4th: F becomes F♯. Dreamy and floating, like film music about magic. F Lydian is the white keys from F.'), keys: keysOf('lydian'), examples: [ex('Đô Lydian', 'C Lydian', 'lydian')] }],
  }),
  lesson({
    id: 'sc-16', title: b('Phrygian', 'Phrygian'), desc: b('♭2 kiểu Tây Ban Nha', 'The Spanish ♭2'),
    newItems: ['phrygian'], pool: ['naturalMinor', 'phrygian'], anchors: ['sc-phrygian'], traps: [pair('phrygian', 'naturalMinor')],
    slides: [{ title: b('Bước đầu tiên chỉ nửa cung', 'The first step is a half step'), body: b('Thứ tự nhiên hạ thêm bậc 2. Đô → Rê♭ ngay đầu nghe rất flamenco. Mi Phrygian là phím trắng từ Mi.', 'Natural minor with a lowered 2nd. C → D♭ at the start sounds like flamenco. E Phrygian is the white keys from E.'), keys: keysOf('phrygian'), examples: [ex('Đô Phrygian', 'C Phrygian', 'phrygian'), ex('Mi Phrygian (phím trắng)', 'E Phrygian (white keys)', 'phrygian', 64)] }],
  }),
  lesson({
    id: 'sc-17', title: b('Locrian', 'Locrian'), desc: b('♭2 và ♭5, rất bất ổn', '♭2 and ♭5, very unstable'),
    newItems: ['locrian'], pool: ['phrygian', 'locrian'], anchors: ['sc-locrian'], traps: [pair('locrian', 'phrygian')],
    slides: [{ title: b('Không có nhà vững', 'No stable home'), body: b('Hạ cả bậc 2 và 5: hợp âm chủ thành hợp âm giảm. Nghe lơ lửng, khó chịu. Si Locrian là phím trắng từ Si.', 'Both the 2nd and 5th lowered: the home chord becomes diminished. Hanging, uneasy. B Locrian is the white keys from B.'), keys: keysOf('locrian'), examples: [ex('Đô Locrian', 'C Locrian', 'locrian')] }],
  }),
  lesson({
    id: 'sc-18', title: b('Bảy điệu thức', 'The seven modes'), desc: b('Từ sáng nhất đến tối nhất', 'From brightest to darkest'),
    pool: MODES, traps: [pair('major', 'lydian'), pair('naturalMinor', 'phrygian')],
    slides: [{ title: b('Thang độ sáng', 'The brightness ladder'), body: b('Lydian → Trưởng → Mixolydian → Dorian → Thứ → Phrygian → Locrian. Mỗi bậc trên thang chỉ khác bậc kề bên đúng một nốt.', 'Lydian → Major → Mixolydian → Dorian → Minor → Phrygian → Locrian. Each step on the ladder changes exactly one note.'), examples: MODES.map((id) => ({ label: getScale(id).name, notes: up(id) })) }],
  }),
  checkpoint('sc-cp5', b('Checkpoint: điệu thức', 'Checkpoint: modes'), b('30 câu, bảy điệu thức', '30 questions, seven modes'), MODES),
  lesson({
    id: 'sc-19', title: b('Toàn cung', 'Whole tone'), desc: b('Sáu nốt cách đều', 'Six evenly spaced notes'),
    newItems: ['wholeTone'], pool: ['major', 'wholeTone', 'lydian'], anchors: ['sc-whole-tone'], traps: [pair('wholeTone', 'lydian')],
    slides: [{ title: b('Toàn bước nguyên', 'All whole steps'), body: b('Đô Rê Mi Fa♯ Sol♯ La♯: không có nốt nào làm "nhà". Nghe mơ hồ như sương — Debussy rất thích âm giai này.', 'C D E F♯ G♯ A♯: no note feels like home. Hazy like mist — Debussy loved it.'), keys: keysOf('wholeTone'), examples: [ex('Toàn cung', 'Whole tone', 'wholeTone')] }],
  }),
  lesson({
    id: 'sc-20', title: b('Chromatic', 'Chromatic'), desc: b('Đủ 12 nốt', 'All twelve notes'),
    newItems: ['chromatic'], pool: ['wholeTone', 'chromatic', 'major'], anchors: ['sc-chromatic'], traps: [pair('chromatic', 'wholeTone')],
    slides: [{ title: b('Từng nửa cung', 'Every half step'), body: b('Đi qua cả 12 phím, kể cả phím đen. Nghe như trượt, như ong vo ve.', 'Every one of the twelve keys. It slides, like a buzzing bee.'), examples: [ex('Chromatic', 'Chromatic', 'chromatic')] }],
  }),
  lesson({
    id: 'sc-21', title: b('Âm giai đi xuống', 'Scales going down'), desc: b('Nghe ngược', 'Heard backwards'),
    pool: ['major', 'naturalMinor', 'majorPentatonic', 'minorPentatonic', 'harmonicMinor', 'dorian'], direction: 'down', traps: [pair('major', 'naturalMinor', 'both')],
    slides: [{ title: b('Từ trên xuống', 'From the top'), body: b('Đi xuống, nốt tạo màu đến theo thứ tự ngược: bậc 7 và 6 nghe trước, bậc 3 nghe sau.', 'Going down, the colour notes come in reverse: the 7th and 6th first, the 3rd later.') }],
  }),
  lesson({
    id: 'sc-22', title: b('Gốc và quãng tám ngẫu nhiên', 'Any root, any octave'), desc: b('Mười âm giai', 'Ten scales'),
    pool: ['major', 'naturalMinor', 'majorPentatonic', 'minorPentatonic', 'blues', 'harmonicMinor', 'dorian', 'mixolydian', 'lydian', 'phrygian'], register: 'scaleAny', direction: 'both', traps: [pair('dorian', 'mixolydian')],
    slides: [{ title: b('Tổng ôn', 'Full review'), body: b('Mười âm giai, chủ âm bất kỳ, lên hoặc xuống.', 'Ten scales, any tonic, up or down.') }],
  }),
  checkpoint('sc-cp6', b('Checkpoint: âm giai tổng hợp', 'Checkpoint: all scales'), b('30 câu, 14 âm giai', '30 questions, 14 scales'), ALL, 'both', 'scaleAny'),
  {
    id: 'sc-final',
    kind: 'final',
    title: b('Thi cuối: bậc thầy âm giai', 'Final exam: scale master'),
    desc: b('40 câu, 14 âm giai, lên / xuống, 6 giây mỗi câu', '40 questions, 14 scales, up / down, 6 s each'),
    newItems: [],
    slides: [],
    anchors: [],
    pool: ALL,
    register: 'scaleAny',
    direction: 'both',
    traps: [],
    questionCount: 40,
    timeLimitMs: 6000,
  },
];

export const SCALES_PATH: PathDef = {
  id: 'scales',
  title: b('Âm giai', 'Scales'),
  tagline: b('Màu của âm giai và điệu thức', 'Colours of scales and modes'),
  color: '#f4b740',
  items: ALL,
  lessons: LESSONS,
};
