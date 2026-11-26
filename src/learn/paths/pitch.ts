import type { Bilingual } from '../../theory';
import type { LessonDef, PathDef, Register, Slide, TrapSpec } from '../types';

const b = (vi: string, en: string): Bilingual => ({ vi, en });

const WHITE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ALL12 = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const BLACK = ['Db', 'Eb', 'F#', 'Ab', 'Bb'];
const PENTA = ['C', 'D', 'E', 'G', 'A'];

const pair = (a: string, c: string, register?: Register): TrapSpec => ({ kind: 'pair', a, b: c, register });
const last = (register?: Register): TrapSpec => ({ kind: 'last', register });

interface LessonInput {
  id: string;
  title: Bilingual;
  desc: Bilingual;
  newItems?: string[];
  slides?: Slide[];
  anchors?: string[];
  pool: string[];
  register?: Register;
  traps?: TrapSpec[];
  mode?: 'name' | 'yesno';
  yesItem?: string;
  decoys?: string[];
}

const lesson = (x: LessonInput): LessonDef => ({
  kind: 'lesson',
  newItems: [],
  slides: [],
  anchors: [],
  register: 'mid',
  traps: [],
  questionCount: 20,
  ...x,
});

const checkpoint = (id: string, title: Bilingual, desc: Bilingual, pool: string[], register: Register): LessonDef => ({
  id, kind: 'checkpoint', title, desc, newItems: [], slides: [], anchors: [], pool, register, traps: [], questionCount: 30, timeLimitMs: 8000,
});

const LESSONS: LessonDef[] = [
  {
    id: 'pitch-intro',
    kind: 'intro',
    title: b('Làm quen với luyện cao độ', 'Getting started with pitch'),
    desc: b('Cao độ là gì và lộ trình này dạy bạn thế nào', 'What pitch is and how this path teaches it'),
    newItems: [],
    slides: [
      {
        title: b('Cao độ là gì?', 'What is pitch?'),
        body: b(
          'Mỗi nốt nhạc là một rung động có tần số riêng: rung nhanh nghe cao, rung chậm nghe trầm. Trên đàn piano, càng sang phải nốt càng cao.',
          'Every note is a vibration with its own frequency: fast sounds high, slow sounds low. On a piano, notes rise as you move right.',
        ),
        examples: [
          { label: b('Trầm → cao', 'Low → high'), notes: [48, 60, 72] },
        ],
      },
      {
        title: b('Gọi tên nốt khi nghe riêng lẻ', 'Naming a note on its own'),
        body: b(
          'Nghe một nốt rồi gọi đúng tên của nó, không cần nốt chuẩn để so: đó là "cao độ tuyệt đối". Không phải ai sinh ra cũng có, nhưng tập đều thì ai cũng tiến bộ. Mẹo là gắn mỗi nốt với một giai điệu quen thuộc.',
          'Hearing a note and naming it without a reference is "absolute pitch". Few are born with it, but everyone improves with steady practice. The trick is to tie each note to a tune you know.',
        ),
        keys: [60, 67],
        examples: [{ label: b('Đô và Sol', 'C and G'), notes: [60, 67] }],
      },
      {
        title: b('Lộ trình vận hành thế nào', 'How the path works'),
        body: b(
          'Mỗi bài: vài trang lý thuyết, một bài hát làm mốc, 6 câu nghe có dẫn, 20 câu luyện tính sao và 6 câu bẫy. Đạt 75 % trở lên (2★) là mở bài sau; 90 % được 3★. Checkpoint luôn mở: thi đạt là được bỏ qua các bài trước nó.',
          'Each lesson: a few theory slides, an anchor song, 6 guided questions, 20 graded questions and 6 trap questions. 75 % or more (2★) opens the next lesson; 90 % earns 3★. Checkpoints are always open: pass one to skip the lessons before it.',
        ),
      },
    ],
    anchors: [],
    pool: ['C', 'G'],
    register: 'mid',
    traps: [],
    questionCount: 5,
  },
  lesson({
    id: 'pitch-1',
    title: b('Đô giữa — ngôi nhà', 'Middle C — home'),
    desc: b('Nhận ra Đô giữa giữa các nốt khác', 'Spot middle C among other notes'),
    newItems: ['C'],
    mode: 'yesno',
    yesItem: 'C',
    decoys: ['F#', 'A', 'E', 'D'],
    pool: ['C'],
    anchors: ['frere-c', 'twinkle-c'],
    traps: [pair('C', 'D')],
    slides: [
      {
        title: b('Đô giữa ở đâu?', 'Where is middle C?'),
        body: b(
          'Đô giữa (C4) là phím trắng ngay bên trái nhóm hai phím đen ở giữa bàn phím. Mọi bài trong lộ trình này bắt đầu từ "ngôi nhà" này.',
          'Middle C (C4) is the white key just left of the group of two black keys in the middle of the piano. Everything in this path starts from this "home".',
        ),
        keys: [60],
        examples: [{ label: b('Nghe Đô giữa', 'Hear middle C'), notes: [60] }],
      },
      {
        title: b('Ngân theo để nhớ', 'Hum it to remember'),
        body: b(
          'Nghe Đô vài lần rồi ngân nhẹ theo. Cảm giác "đứng yên, vững" chính là màu của Đô: nhiều bài hát bắt đầu và kết thúc ở đây.',
          'Listen to C a few times and hum along. That settled, "at rest" feeling is C\'s colour: many songs start and end on it.',
        ),
        keys: [60],
        examples: [{ label: b('Đô ba lần', 'C three times'), notes: [60, 60, 60] }],
      },
      {
        title: b('Đô khác nốt bên cạnh thế nào', 'C next to its neighbours'),
        body: b(
          'Nghe Đô rồi đến Rê, Mi, La: các nốt khác "lơ lửng" hơn, như chưa về nhà. Ở bài này bạn chỉ cần trả lời: nốt vừa nghe có phải Đô không?',
          'Play C, then D, E, A: the others feel "up in the air", not home yet. In this lesson you only answer: was that note C?',
        ),
        keys: [60, 62, 64, 69],
        examples: [{ label: b('Đô – Rê – Đô – La – Đô', 'C – D – C – A – C'), notes: [60, 62, 60, 69, 60] }],
      },
    ],
  }),
  lesson({
    id: 'pitch-2',
    title: b('Đô và Sol — hai cột trụ', 'C and G — the two pillars'),
    desc: b('Phân biệt Đô và Sol', 'Tell C from G'),
    newItems: ['G'],
    pool: ['C', 'G'],
    anchors: ['twinkle-cg'],
    traps: [last()],
    slides: [
      {
        title: b('Sol ở đâu?', 'Where is G?'),
        body: b(
          'Sol (G4) cách Đô bốn phím trắng về bên phải. Đô và Sol là cặp nốt vững nhất trong âm nhạc: cùng nhau chúng như hai cột trụ của ngôi nhà.',
          'G (G4) is four white keys to the right of C. C and G are the steadiest pair in music: together they are the two pillars of the house.',
        ),
        keys: [60, 67],
        examples: [{ label: b('Đô rồi Sol', 'C then G'), notes: [60, 67] }, { label: b('Cùng lúc', 'Together'), notes: [60, 67], together: true }],
      },
      {
        title: b('Màu của Sol', 'The colour of G'),
        body: b(
          'Sol nghe sáng và mở, như đang hướng lên. Sau khi nghe Sol, tai muốn trở về Đô.',
          'G sounds bright and open, as if reaching up. After G, the ear wants to return to C.',
        ),
        keys: [67],
        examples: [{ label: b('Sol về Đô', 'G back to C'), notes: [67, 60] }],
      },
    ],
  }),
  lesson({
    id: 'pitch-3',
    title: b('Thêm Mi — thành hợp âm', 'Add E — a chord appears'),
    desc: b('Đô, Mi, Sol', 'C, E, G'),
    newItems: ['E'],
    pool: ['C', 'E', 'G'],
    anchors: ['saints-ce', 'frere-e'],
    traps: [pair('E', 'G'), last()],
    slides: [
      {
        title: b('Mi nằm giữa Đô và Sol', 'E sits between C and G'),
        body: b(
          'Mi (E4) là phím trắng thứ ba tính từ Đô. Ba nốt Đô – Mi – Sol vang cùng lúc tạo thành hợp âm Đô trưởng.',
          'E (E4) is the third white key from C. C – E – G sounding together make the C major chord.',
        ),
        keys: [60, 64, 67],
        examples: [{ label: b('Đô – Mi – Sol', 'C – E – G'), notes: [60, 64, 67] }, { label: b('Hợp âm Đô trưởng', 'C major chord'), notes: [60, 64, 67], together: true }],
      },
      {
        title: b('Mi là nốt "sáng"', 'E is the "bright" note'),
        body: b(
          'Mi làm hợp âm nghe vui. Đừng nhầm Mi với Sol: Mi thấp hơn và "ấm" hơn, Sol cao và "rộng" hơn.',
          'E is what makes the chord sound happy. Do not mix it up with G: E is lower and warmer, G higher and wider.',
        ),
        keys: [64, 67],
        examples: [{ label: b('Mi – Sol – Mi', 'E – G – E'), notes: [64, 67, 64] }],
      },
    ],
  }),
  lesson({
    id: 'pitch-4',
    title: b('Ngũ cung — không nốt nào lạc', 'Pentatonic — no wrong notes'),
    desc: b('Thêm Rê và La', 'Add D and A'),
    newItems: ['D', 'A'],
    pool: PENTA,
    anchors: ['twinkle-a', 'birthday-a'],
    traps: [pair('D', 'E'), pair('G', 'A')],
    slides: [
      {
        title: b('Năm nốt ngũ cung', 'The five pentatonic notes'),
        body: b(
          'Đô – Rê – Mi – Sol – La là âm giai ngũ cung. Không có hai nốt nào cách nhau nửa cung nên chơi kiểu gì cũng nghe hiền. Rất nhiều dân ca Việt Nam dùng năm nốt này.',
          'C – D – E – G – A is the pentatonic scale. No two notes are a half step apart, so any order sounds gentle. Many folk songs use just these five.',
        ),
        keys: [60, 62, 64, 67, 69],
        examples: [{ label: b('Ngũ cung đi lên', 'Pentatonic up'), notes: [60, 62, 64, 67, 69, 72] }],
      },
      {
        title: b('Rê và La', 'D and A'),
        body: b(
          'Rê đứng ngay trên Đô, như một bước đi ra khỏi nhà. La đứng ngay trên Sol: trong Twinkle, đó là nốt cao nhất của câu đầu.',
          'D is one step above C, a step out of the house. A is one step above G: in Twinkle it is the top of the first phrase.',
        ),
        keys: [62, 69],
        examples: [{ label: b('Đô – Rê', 'C – D'), notes: [60, 62] }, { label: b('Sol – La', 'G – A'), notes: [67, 69] }],
      },
    ],
  }),
  lesson({
    id: 'pitch-5',
    title: b('Fa và Si — hai nốt căng', 'F and B — the tense ones'),
    desc: b('Đủ bảy phím trắng', 'All seven white keys'),
    newItems: ['F', 'B'],
    pool: WHITE,
    anchors: ['ode-f', 'birthday-b'],
    traps: [pair('E', 'F'), pair('B', 'A'), pair('F', 'G')],
    slides: [
      {
        title: b('Hai nửa cung của phím trắng', 'The two half steps of the white keys'),
        body: b(
          'Giữa Mi–Fa và Si–Đô không có phím đen: đó là hai chỗ chỉ cách nửa cung. Vì sát nhau nên Fa và Si nghe "căng", muốn đi tiếp.',
          'There is no black key between E–F and B–C: they are only a half step apart. Being so close, F and B sound tense and want to move on.',
        ),
        keys: [64, 65, 71, 72],
        examples: [{ label: b('Mi – Fa', 'E – F'), notes: [64, 65] }, { label: b('Si – Đô', 'B – C'), notes: [71, 72] }],
      },
      {
        title: b('Fa muốn về Mi, Si muốn về Đô', 'F leans to E, B leans to C'),
        body: b(
          'Nghe Fa rồi để nó rơi xuống Mi; nghe Si rồi để nó bước lên Đô. Cảm giác "được giải quyết" đó là dấu hiệu nhận ra hai nốt này.',
          'Hear F fall to E, and B rise to C. That feeling of release is how you recognise these two.',
        ),
        keys: [65, 71],
        examples: [{ label: b('Fa → Mi', 'F → E'), notes: [65, 64] }, { label: b('Si → Đô', 'B → C'), notes: [71, 72] }],
      },
      {
        title: b('Bảy phím trắng', 'All seven white keys'),
        body: b('Giờ bạn có đủ bảy nốt của âm giai Đô trưởng: Đô Rê Mi Fa Sol La Si.', 'Now you have all seven notes of C major: C D E F G A B.'),
        keys: [60, 62, 64, 65, 67, 69, 71],
        examples: [{ label: b('Âm giai Đô trưởng', 'C major scale'), notes: [60, 62, 64, 65, 67, 69, 71, 72] }],
      },
    ],
  }),
  checkpoint('pitch-cp1', b('Checkpoint: phím trắng quãng giữa', 'Checkpoint: white keys, middle'), b('30 câu, 7 nốt, 8 giây mỗi câu', '30 questions, 7 notes, 8 s each'), WHITE, 'mid'),
  lesson({
    id: 'pitch-6',
    title: b('Fa thăng — sáng và gắt', 'F sharp — bright and edgy'),
    desc: b('Phím đen đầu tiên', 'Your first black key'),
    newItems: ['F#'],
    pool: [...WHITE, 'F#'],
    anchors: ['gmajor-fs'],
    traps: [pair('F#', 'F'), pair('F#', 'G')],
    slides: [
      {
        title: b('Phím đen giữa Fa và Sol', 'The black key between F and G'),
        body: b(
          'Fa thăng (F♯) cao hơn Fa nửa cung. Nó là "nốt dẫn" của âm giai Sol trưởng: nghe xong là muốn bước lên Sol.',
          'F♯ is a half step above F. It is the leading note of G major: once you hear it you want to step up to G.',
        ),
        keys: [65, 66, 67],
        examples: [{ label: b('Fa – Fa♯ – Sol', 'F – F♯ – G'), notes: [65, 66, 67] }],
      },
      {
        title: b('Nghe "lạ" giữa các phím trắng', 'It stands out among white keys'),
        body: b('Chơi Đô rồi Fa♯: hai nốt cách nhau đúng nửa quãng tám, nghe rất căng. Nhớ cảm giác gắt đó.', 'Play C then F♯: exactly half an octave apart, very tense. Remember that edge.'),
        keys: [60, 66],
        examples: [{ label: b('Đô – Fa♯', 'C – F♯'), notes: [60, 66] }],
      },
    ],
  }),
  lesson({
    id: 'pitch-7',
    title: b('Si giáng — mềm, hơi blues', 'B flat — soft and bluesy'),
    desc: b('Thêm Si♭', 'Add B♭'),
    newItems: ['Bb'],
    pool: [...WHITE, 'F#', 'Bb'],
    anchors: ['c7-bb'],
    traps: [pair('Bb', 'B'), pair('Bb', 'A')],
    slides: [
      {
        title: b('Si giáng ở đâu?', 'Where is B♭?'),
        body: b('Si giáng (B♭) là phím đen giữa La và Si, thấp hơn Si nửa cung.', 'B♭ is the black key between A and B, a half step below B.'),
        keys: [69, 70, 71],
        examples: [{ label: b('La – Si♭ – Si', 'A – B♭ – B'), notes: [69, 70, 71] }],
      },
      {
        title: b('Màu blues', 'The blues colour'),
        body: b('Thêm Si♭ vào Đô – Mi – Sol ta được hợp âm Đô 7: chất blues, hơi "lười", chưa muốn dừng.', 'Add B♭ to C – E – G and you get C7: bluesy, laid back, not ready to stop.'),
        keys: [60, 64, 67, 70],
        examples: [{ label: b('Đô 7', 'C7'), notes: [60, 64, 67, 70], together: true }],
      },
    ],
  }),
  lesson({
    id: 'pitch-8',
    title: b('Mi giáng — buồn và tối', 'E flat — sad and dark'),
    desc: b('Thêm Mi♭', 'Add E♭'),
    newItems: ['Eb'],
    pool: [...WHITE, 'F#', 'Bb', 'Eb'],
    anchors: ['cmaj-cmin'],
    traps: [pair('Eb', 'E'), pair('Eb', 'D')],
    slides: [
      {
        title: b('Mi giáng ở đâu?', 'Where is E♭?'),
        body: b('Mi giáng (E♭) là phím đen giữa Rê và Mi.', 'E♭ is the black key between D and E.'),
        keys: [62, 63, 64],
        examples: [{ label: b('Rê – Mi♭ – Mi', 'D – E♭ – E'), notes: [62, 63, 64] }],
      },
      {
        title: b('Từ trưởng sang thứ', 'From major to minor'),
        body: b('Đổi Mi thành Mi♭ trong Đô – Mi – Sol là hợp âm vui hóa buồn: Đô thứ. Mi♭ mang màu tối đó.', 'Swap E for E♭ in C – E – G and the happy chord turns sad: C minor. E♭ carries that darkness.'),
        keys: [60, 63, 67],
        examples: [{ label: b('Đô trưởng', 'C major'), notes: [60, 64, 67], together: true }, { label: b('Đô thứ', 'C minor'), notes: [60, 63, 67], together: true }],
      },
    ],
  }),
  lesson({
    id: 'pitch-9',
    title: b('La giáng và Rê giáng — phía tối', 'A flat and D flat — the dark side'),
    desc: b('Đủ 12 nốt', 'All twelve notes'),
    newItems: ['Ab', 'Db'],
    pool: ALL12,
    anchors: ['cminor-ab', 'phrygian-db'],
    traps: [pair('Ab', 'A'), pair('Ab', 'G'), pair('Db', 'C'), pair('Db', 'D')],
    slides: [
      {
        title: b('La giáng trong Đô thứ', 'A♭ in C minor'),
        body: b('La giáng (A♭) là bậc 6 của âm giai Đô thứ: nặng, u buồn, hay rơi về Sol.', 'A♭ is the 6th of C minor: heavy and mournful, it likes to fall to G.'),
        keys: [67, 68, 69],
        examples: [{ label: b('La♭ → Sol', 'A♭ → G'), notes: [68, 67] }],
      },
      {
        title: b('Rê giáng "kiểu Tây Ban Nha"', 'D♭, the "Spanish" note'),
        body: b('Rê giáng (D♭) sát ngay trên Đô. Đô – Rê♭ – Đô nghe như nhạc flamenco.', 'D♭ sits right above C. C – D♭ – C sounds like flamenco.'),
        keys: [60, 61],
        examples: [{ label: b('Đô – Rê♭ – Đô', 'C – D♭ – C'), notes: [60, 61, 60] }],
      },
      {
        title: b('Đủ 12 nốt', 'All twelve'),
        body: b('Bảy phím trắng và năm phím đen: mọi nốt của âm nhạc phương Tây đều lặp lại theo 12 nốt này.', 'Seven white and five black keys: all of Western music repeats these twelve.'),
        keys: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71],
        examples: [{ label: b('12 nốt đi lên', 'Twelve notes up'), notes: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72] }],
      },
    ],
  }),
  checkpoint('pitch-cp2', b('Checkpoint: 12 nốt quãng giữa', 'Checkpoint: twelve notes, middle'), b('30 câu, đủ 12 nốt', '30 questions, all twelve notes'), ALL12, 'mid'),
  lesson({
    id: 'pitch-10',
    title: b('Đô và Sol dưới trầm', 'C and G down low'),
    desc: b('Cùng tên nốt, tiếng trầm hơn', 'Same names, a lower sound'),
    newItems: ['C', 'G'],
    pool: ['C', 'G'],
    register: 'low',
    anchors: ['twinkle-low'],
    traps: [pair('C', 'G', 'lowmid'), pair('G', 'F', 'low')],
    slides: [
      {
        title: b('Một quãng tám thấp hơn', 'An octave lower'),
        body: b('Đô 3 (C3) cùng tên với Đô giữa nhưng thấp hơn một quãng tám. Tiếng "đục" hơn, nhưng tính chất vẫn y nguyên: vững, như ở nhà.', 'C3 has the same name as middle C, one octave lower. It sounds duller but keeps the same settled character.'),
        keys: [48, 55, 60],
        examples: [{ label: b('Đô 3 – Đô 4', 'C3 – C4'), notes: [48, 60] }, { label: b('Đô 3 – Sol 3', 'C3 – G3'), notes: [48, 55] }],
      },
      {
        title: b('Trả lời theo tên', 'Answer by name'),
        body: b('Bàn phím trả lời vẫn là một quãng tám: chỉ cần chọn đúng tên nốt, quãng tám nào cũng được.', 'The answer keyboard is still one octave: pick the right name, whatever the octave.'),
      },
    ],
  }),
  lesson({
    id: 'pitch-11',
    title: b('Hợp âm Đô dưới trầm', 'C chord down low'),
    desc: b('Đô, Mi, Sol ở quãng tám 3', 'C, E, G in octave 3'),
    newItems: ['E'],
    pool: ['C', 'E', 'G'],
    register: 'low',
    anchors: ['arp-low'],
    traps: [pair('E', 'F', 'low')],
    slides: [
      {
        title: b('Nghe ra Mi trong tiếng trầm', 'Hearing E down low'),
        body: b('Ở âm vực trầm, Mi và Fa rất dễ lẫn. Tập trung vào cảm giác "ấm, vui" của Mi so với "căng" của Fa.', 'Down low, E and F blur together. Listen for E\'s warm, happy feel against F\'s tension.'),
        keys: [48, 52, 55],
        examples: [{ label: b('Đô – Mi – Sol trầm', 'Low C – E – G'), notes: [48, 52, 55] }, { label: b('Mi 3 – Fa 3', 'E3 – F3'), notes: [52, 53] }],
      },
    ],
  }),
  lesson({
    id: 'pitch-12',
    title: b('Âm giai trắng dưới trầm', 'White keys down low'),
    desc: b('Bảy phím trắng ở quãng tám 3', 'All seven white keys in octave 3'),
    newItems: ['D', 'F', 'A', 'B'],
    pool: WHITE,
    register: 'low',
    anchors: ['scale-low'],
    traps: [pair('E', 'F', 'low'), pair('B', 'C', 'low')],
    slides: [
      {
        title: b('Bảy nốt ở tầng dưới', 'Seven notes downstairs'),
        body: b('Cùng bảy nốt bạn đã thuộc, chỉ là thấp hơn. Chú ý hai cặp nửa cung Mi–Fa và Si–Đô.', 'The same seven notes you know, just lower. Watch the half steps E–F and B–C.'),
        keys: [48, 50, 52, 53, 55, 57, 59],
        examples: [{ label: b('Âm giai Đô 3', 'C3 scale'), notes: [48, 50, 52, 53, 55, 57, 59, 60] }],
      },
    ],
  }),
  checkpoint('pitch-cp3', b('Checkpoint: tầng hầm', 'Checkpoint: the basement'), b('30 câu, phím trắng quãng tám 3', '30 questions, white keys in octave 3'), WHITE, 'low'),
  lesson({
    id: 'pitch-13',
    title: b('Đô và Sol trên cao', 'C and G up high'),
    desc: b('Quãng tám 5', 'Octave 5'),
    newItems: ['C', 'G'],
    pool: ['C', 'G'],
    register: 'high',
    anchors: ['twinkle-high'],
    traps: [pair('G', 'A', 'high')],
    slides: [
      {
        title: b('Âm cao trong và rõ', 'High notes are clear'),
        body: b('Đô 5 và Sol 5 cao hơn quãng giữa một quãng tám: tiếng trong, mảnh, như hộp nhạc.', 'C5 and G5 are an octave above the middle: thin and clear, like a music box.'),
        keys: [72, 79],
        examples: [{ label: b('Đô 5 – Sol 5', 'C5 – G5'), notes: [72, 79] }],
      },
    ],
  }),
  lesson({
    id: 'pitch-14',
    title: b('Hợp âm Đô trên cao', 'C chord up high'),
    desc: b('Đô, Mi, Sol ở quãng tám 5', 'C, E, G in octave 5'),
    newItems: ['E'],
    pool: ['C', 'E', 'G'],
    register: 'high',
    anchors: ['arp-high'],
    traps: [pair('E', 'D', 'high')],
    slides: [
      {
        title: b('Mi rất sáng trên cao', 'E shines up high'),
        body: b('Trên cao Mi gần như "lấp lánh". Đừng nhầm với Rê ngay bên dưới.', 'Up high E almost sparkles. Do not confuse it with D just below.'),
        keys: [72, 76, 79],
        examples: [{ label: b('Đô – Mi – Sol cao', 'High C – E – G'), notes: [72, 76, 79] }, { label: b('Rê 5 – Mi 5', 'D5 – E5'), notes: [74, 76] }],
      },
    ],
  }),
  lesson({
    id: 'pitch-15',
    title: b('Âm giai trắng trên cao', 'White keys up high'),
    desc: b('Bảy phím trắng ở quãng tám 5', 'All seven white keys in octave 5'),
    newItems: ['D', 'F', 'A', 'B'],
    pool: WHITE,
    register: 'high',
    anchors: ['scale-high'],
    traps: [pair('E', 'F', 'high'), pair('B', 'C', 'high')],
    slides: [
      {
        title: b('Bảy nốt ở tầng trên', 'Seven notes upstairs'),
        body: b('Trên cao các nốt sát nhau nghe rất gần, hãy nghe kỹ từng bước.', 'Up high, neighbouring notes sound very close: listen carefully.'),
        keys: [72, 74, 76, 77, 79, 81, 83],
        examples: [{ label: b('Âm giai Đô 5', 'C5 scale'), notes: [72, 74, 76, 77, 79, 81, 83, 84] }],
      },
    ],
  }),
  checkpoint('pitch-cp4', b('Checkpoint: gác mái', 'Checkpoint: the attic'), b('30 câu, phím trắng quãng tám 5', '30 questions, white keys in octave 5'), WHITE, 'high'),
  lesson({
    id: 'pitch-16',
    title: b('Đô hay Sol, ở đâu cũng được', 'C or G, anywhere'),
    desc: b('Ba quãng tám trộn lẫn', 'Three octaves mixed'),
    pool: ['C', 'G'],
    register: 'any',
    anchors: ['twinkle-cg'],
    traps: [pair('C', 'G', 'any')],
    slides: [
      {
        title: b('Tên nốt không đổi theo quãng tám', 'Names do not change with the octave'),
        body: b('Từ giờ nốt có thể ở bất kỳ quãng tám nào từ Đô 3 đến Si 5. Hãy nghe "màu" của nốt chứ đừng nghe độ cao.', 'From now on a note can be in any octave from C3 to B5. Listen for the colour, not the height.'),
        keys: [48, 60, 72],
        examples: [{ label: b('Ba Đô', 'Three Cs'), notes: [48, 60, 72] }, { label: b('Ba Sol', 'Three Gs'), notes: [55, 67, 79] }],
      },
    ],
  }),
  lesson({
    id: 'pitch-17',
    title: b('Hợp âm Đô mọi quãng tám', 'C chord in every octave'),
    desc: b('Đô, Mi, Sol trộn quãng tám', 'C, E, G in mixed octaves'),
    pool: ['C', 'E', 'G'],
    register: 'any',
    anchors: ['saints-ce'],
    traps: [pair('E', 'G', 'any')],
    slides: [
      {
        title: b('Mi trầm hay Sol cao?', 'Low E or high G?'),
        body: b('Một Mi trầm có thể nghe "thấp" hơn một Sol cao nhưng vẫn là Mi. Đừng để độ cao đánh lừa.', 'A low E sounds lower than a high G but it is still E. Do not let the height fool you.'),
        examples: [{ label: b('Mi 3 – Sol 5', 'E3 – G5'), notes: [52, 79] }],
      },
    ],
  }),
  lesson({
    id: 'pitch-18',
    title: b('Ngũ cung mọi quãng tám', 'Pentatonic in every octave'),
    desc: b('Đô Rê Mi Sol La', 'C D E G A'),
    pool: PENTA,
    register: 'any',
    anchors: ['auld-penta'],
    traps: [pair('D', 'E', 'any')],
    slides: [
      {
        title: b('Năm nốt, ba quãng tám', 'Five notes, three octaves'),
        body: b('Giai điệu quen thuộc này chỉ dùng năm nốt ngũ cung. Nghe nó để nhớ lại Rê và La.', 'This well-known tune uses only the five pentatonic notes. Use it to recall D and A.'),
        keys: [60, 62, 64, 67, 69],
      },
    ],
  }),
  lesson({
    id: 'pitch-19',
    title: b('Bảy phím trắng mọi quãng tám', 'All white keys, every octave'),
    desc: b('Đủ âm giai Đô trưởng', 'The whole C major scale'),
    pool: WHITE,
    register: 'any',
    anchors: ['ode-f'],
    traps: [pair('E', 'F', 'any'), pair('B', 'C', 'any')],
    slides: [
      {
        title: b('Bài tổng hợp phím trắng', 'White-key review'),
        body: b('Bảy nốt, ba quãng tám. Khi phân vân, hãy nghĩ: nốt này muốn đi đâu? Fa rơi về Mi, Si bước lên Đô.', 'Seven notes, three octaves. When unsure, ask where the note wants to go: F falls to E, B rises to C.'),
        keys: [60, 62, 64, 65, 67, 69, 71],
      },
    ],
  }),
  checkpoint('pitch-cp5', b('Checkpoint: thuần thục phím trắng', 'Checkpoint: white-key mastery'), b('30 câu, 7 nốt, ba quãng tám', '30 questions, 7 notes, three octaves'), WHITE, 'any'),
  lesson({
    id: 'pitch-20',
    title: b('Fa♯/Sol♭ và Si♭ mọi quãng tám', 'F♯/G♭ and B♭ everywhere'),
    desc: b('Hai phím đen quen nhất', 'The two most common black keys'),
    pool: [...WHITE, 'F#', 'Bb'],
    register: 'any',
    anchors: ['gmajor-fs', 'c7-bb'],
    traps: [pair('F#', 'G', 'any'), pair('Bb', 'B', 'any')],
    slides: [
      {
        title: b('Một phím, hai tên', 'One key, two names'),
        body: b('Fa♯ và Sol♭ là cùng một phím (gọi là trùng âm). Tên nào được dùng tùy giọng của bài; ở đây ta gọi theo tên quen nhất.', 'F♯ and G♭ are the same key (enharmonic). Which name is used depends on the key of the piece; here we use the most common one.'),
        keys: [66, 70],
        examples: [{ label: b('Fa♯ – Si♭', 'F♯ – B♭'), notes: [66, 70] }],
      },
    ],
  }),
  lesson({
    id: 'pitch-21',
    title: b('Năm phím đen', 'The five black keys'),
    desc: b('Chỉ phím đen', 'Black keys only'),
    newItems: BLACK,
    pool: BLACK,
    register: 'any',
    anchors: ['black-penta'],
    traps: [pair('Db', 'Eb', 'any'), pair('F#', 'Ab', 'any'), pair('Ab', 'Bb', 'any')],
    slides: [
      {
        title: b('Ngũ cung trên phím đen', 'A pentatonic on the black keys'),
        body: b('Năm phím đen tạo thành một âm giai ngũ cung, chơi kiểu gì cũng hay. Nhóm hai phím: Rê♭ Mi♭; nhóm ba phím: Fa♯ La♭ Si♭.', 'The five black keys form a pentatonic scale. Group of two: D♭ E♭; group of three: F♯ A♭ B♭.'),
        keys: [61, 63, 66, 68, 70],
        examples: [{ label: b('Năm phím đen', 'Five black keys'), notes: [61, 63, 66, 68, 70] }],
      },
    ],
  }),
  checkpoint('pitch-cp6', b('Checkpoint: thuần thục phím đen', 'Checkpoint: black-key mastery'), b('30 câu, năm phím đen, ba quãng tám', '30 questions, five black keys, three octaves'), BLACK, 'any'),
  lesson({
    id: 'pitch-22',
    title: b('Nửa cung sát nhau', 'Half steps side by side'),
    desc: b('Mi, Fa, Si, Đô', 'E, F, B, C'),
    pool: ['E', 'F', 'B', 'C'],
    register: 'any',
    anchors: ['ode-f'],
    traps: [pair('E', 'F', 'any'), pair('B', 'C', 'any')],
    slides: [
      {
        title: b('Hai cặp khó nhất của phím trắng', 'The two hardest white-key pairs'),
        body: b('Mi–Fa và Si–Đô chỉ cách nửa cung. Mi và Đô nghe "yên", Fa và Si nghe "căng".', 'E–F and B–C are a half step apart. E and C feel calm; F and B feel tense.'),
        keys: [64, 65, 71, 72],
        examples: [{ label: b('Mi – Fa – Si – Đô', 'E – F – B – C'), notes: [64, 65, 71, 72] }],
      },
    ],
  }),
  lesson({
    id: 'pitch-23',
    title: b('Tritone Fa–Si', 'The F–B tritone'),
    desc: b('Quãng 4 tăng: khó nhất', 'The augmented fourth: the hardest'),
    pool: ['F', 'B', 'G', 'E'],
    register: 'any',
    anchors: ['tritone-fb'],
    traps: [pair('F', 'B', 'any')],
    slides: [
      {
        title: b('Quãng "ma quỷ"', 'The "devil\'s interval"'),
        body: b('Fa và Si cách nhau ba cung, đúng nửa quãng tám. Khi nghe riêng lẻ, hai nốt này dễ lẫn vì chúng chia đôi quãng tám.', 'F and B are three whole steps apart, exactly half an octave. Heard alone they are easy to confuse.'),
        keys: [65, 71],
        examples: [{ label: b('Fa – Si', 'F – B'), notes: [65, 71] }, { label: b('Cùng lúc', 'Together'), notes: [65, 71], together: true }],
      },
    ],
  }),
  lesson({
    id: 'pitch-24',
    title: b('Chùm nốt sát', 'Close clusters'),
    desc: b('Đô, Rê♭, Rê', 'C, D♭, D'),
    pool: ['C', 'Db', 'D'],
    register: 'any',
    anchors: ['phrygian-db'],
    traps: [pair('Db', 'C', 'any'), pair('Db', 'D', 'any'), last('any')],
    slides: [
      {
        title: b('Ba nốt liền nhau', 'Three neighbours'),
        body: b('Đô, Rê♭ và Rê chỉ cách nhau nửa cung. Đây là bài luyện tai tinh nhất trước kỳ thi cuối.', 'C, D♭ and D are a half step apart each. The finest drill before the final exam.'),
        keys: [60, 61, 62],
        examples: [{ label: b('Đô – Rê♭ – Rê', 'C – D♭ – D'), notes: [60, 61, 62] }],
      },
    ],
  }),
  {
    id: 'pitch-final',
    kind: 'final',
    title: b('Thi cuối: cao độ tuyệt đối', 'Final exam: absolute pitch'),
    desc: b('40 câu, 12 nốt, ba quãng tám, 6 giây mỗi câu', '40 questions, 12 notes, three octaves, 6 s each'),
    newItems: [],
    slides: [],
    anchors: [],
    pool: ALL12,
    register: 'any',
    traps: [],
    questionCount: 40,
    timeLimitMs: 6000,
  },
];

export const PITCH_PATH: PathDef = {
  id: 'pitch',
  title: b('Cao độ', 'Pitch'),
  tagline: b('Gọi tên nốt khi nghe riêng lẻ', 'Name single notes by ear'),
  color: '#fb923c',
  items: ALL12,
  lessons: LESSONS,
};
