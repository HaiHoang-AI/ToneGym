import type { Bilingual } from '../../theory';
import type { Direction, LessonDef, PathDef, Register, Slide, TrapSpec } from '../types';

const b = (vi: string, en: string): Bilingual => ({ vi, en });

const ALL = ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];

/** Demo: the interval from C4. */
const up = (s: number, from = 60) => [from, from + s];
const pair = (a: string, c: string, direction?: Direction): TrapSpec => ({ kind: 'pair', a, b: c, direction });

/** One-slide explanation with a demo of each interval named. */
const ex = (label: Bilingual, notes: number[], together?: boolean) => ({ label, notes, together });

interface LessonInput {
  id: string;
  title: Bilingual;
  desc: Bilingual;
  newItems?: string[];
  slides: Slide[];
  anchors?: string[];
  pool: string[];
  direction?: Direction;
  register?: Register;
  traps?: TrapSpec[];
  mode?: 'name' | 'yesno';
  yesItem?: string;
  decoys?: string[];
  resolve?: boolean;
}

const lesson = (x: LessonInput): LessonDef => ({
  kind: 'lesson',
  newItems: [],
  anchors: [],
  register: 'wide',
  direction: 'up',
  traps: [],
  questionCount: 20,
  ...x,
});

const checkpoint = (id: string, title: Bilingual, desc: Bilingual, pool: string[], direction: Direction, root?: number): LessonDef => ({
  id, kind: 'checkpoint', title, desc, newItems: [], slides: [], anchors: [], pool, register: 'wide', direction, root, traps: [], questionCount: 30, timeLimitMs: 8000,
});

const LESSONS: LessonDef[] = [
  {
    id: 'iv-intro',
    kind: 'intro',
    title: b('Làm quen với quãng', 'Getting started with intervals'),
    desc: b('Quãng là gì và cách gọi tên', 'What an interval is and how it is named'),
    newItems: [],
    slides: [
      {
        title: b('Quãng là khoảng cách', 'An interval is a distance'),
        body: b(
          'Quãng là khoảng cách giữa hai nốt, đo bằng số nửa cung (số phím đàn, tính cả phím đen). Đô lên Mi là 4 nửa cung; Đô lên Sol là 7.',
          'An interval is the distance between two notes, counted in half steps (piano keys, black ones included). C up to E is 4 half steps; C up to G is 7.',
        ),
        keys: [60, 64, 67],
        examples: [ex(b('Đô → Mi', 'C → E'), up(4)), ex(b('Đô → Sol', 'C → G'), up(7))],
      },
      {
        title: b('Giai điệu và hòa âm', 'Melodic and harmonic'),
        body: b(
          'Hai nốt có thể vang lần lượt (quãng giai điệu, đi lên hoặc đi xuống) hoặc cùng lúc (quãng hòa âm). Lộ trình bắt đầu với quãng đi lên, rồi mới đến đi xuống và hòa âm.',
          'Two notes can sound one after the other (melodic, up or down) or together (harmonic). The path starts with rising intervals, then falling and harmonic ones.',
        ),
        examples: [ex(b('Đi lên', 'Up'), up(7)), ex(b('Đi xuống', 'Down'), [67, 60]), ex(b('Cùng lúc', 'Together'), up(7), true)],
      },
      {
        title: b('Tên quãng', 'Interval names'),
        body: b(
          'Tên gồm số (2, 3, 4…: đếm số tên nốt) và tính chất: P = đúng, M = trưởng, m = thứ, A = tăng. Mẹo nhớ: gắn mỗi quãng với đoạn mở đầu của một bài hát quen thuộc.',
          'A name has a number (2, 3, 4…: counting letter names) and a quality: P = perfect, M = major, m = minor, A = augmented. Tip: tie each one to the opening of a song you know.',
        ),
      },
    ],
    anchors: [],
    pool: ['P8', 'P5'],
    register: 'wide',
    direction: 'up',
    traps: [],
    questionCount: 5,
  },
  lesson({
    id: 'iv-1', title: b('Quãng 8 (P8)', 'Octave (P8)'), desc: b('Cùng tên nốt, cao gấp đôi', 'Same name, twice as high'),
    newItems: ['P8'], pool: ['P8'], mode: 'yesno', yesItem: 'P8', decoys: ['P4', 'm6', 'M6', 'm7', 'M7'],
    anchors: ['iv-octave'], traps: [pair('P8', 'M7')],
    slides: [
      { title: b('Hai nốt cùng tên', 'Two notes, one name'), body: b('Quãng 8 nối một nốt với nốt cùng tên ở trên: Đô 4 lên Đô 5 (12 nửa cung). Hai nốt hòa vào nhau gần như một.', 'An octave joins a note to the next one with the same name: C4 up to C5 (12 half steps). The two blend almost into one.'), keys: [60, 72], examples: [ex(b('Đô 4 → Đô 5', 'C4 → C5'), up(12)), ex(b('Cùng lúc', 'Together'), up(12), true)] },
      { title: b('Rỗng và trọn vẹn', 'Hollow and complete'), body: b('Quãng 8 nghe "trọn", không căng. Bài này chỉ hỏi: có phải quãng 8 không? Câu "không" sẽ gần quãng 8 dần (đến quãng 7 trưởng).', 'An octave sounds complete, with no tension. This lesson only asks: is it an octave? The "no" answers get closer and closer (up to the major 7th).'), examples: [ex(b('P8 rồi M7', 'P8 then M7'), [60, 72, 60, 71])] },
    ],
  }),
  lesson({
    id: 'iv-2', title: b('Quãng 5 đúng (P5)', 'Perfect fifth (P5)'), desc: b('Rỗng và vững', 'Open and steady'),
    newItems: ['P5'], pool: ['P5'], mode: 'yesno', yesItem: 'P5', decoys: ['M2', 'M3', 'm6', 'P4', 'TT'],
    anchors: ['iv-twinkle-p5'], traps: [pair('P5', 'TT')],
    slides: [
      { title: b('Quãng của Twinkle', 'The Twinkle interval'), body: b('Đô lên Sol: 7 nửa cung. Đây là bước nhảy ở "Twinkle, twinkle": C C → G G.', 'C up to G: 7 half steps. It is the leap in "Twinkle, twinkle": C C → G G.'), keys: [60, 67], examples: [ex(b('Đô → Sol', 'C → G'), up(7)), ex(b('Cùng lúc', 'Together'), up(7), true)] },
      { title: b('Tiếng kèn hiệu', 'A fanfare sound'), body: b('Quãng 5 nghe rộng, rỗng, vững như tiếng kèn. Đừng nhầm với quãng 4 tăng ngay bên dưới: quãng đó căng và chói.', 'The fifth sounds wide, hollow and firm, like a horn call. Do not mix it up with the augmented 4th just below: that one is tense and harsh.'), examples: [ex(b('P5 rồi A4', 'P5 then A4'), [60, 67, 60, 66])] },
    ],
  }),
  lesson({
    id: 'iv-3', title: b('Quãng 8 hay quãng 5', 'Octave or fifth'), desc: b('Hai cột trụ', 'The two pillars'),
    pool: ['P8', 'P5'], anchors: ['iv-twinkle-p5', 'iv-octave'], traps: [pair('P5', 'P8')],
    slides: [{ title: b('So sánh', 'Compare'), body: b('Quãng 8: hai nốt "là một". Quãng 5: hai nốt khác nhau nhưng rất hợp. Hãy hát thầm Twinkle để kiểm tra.', 'Octave: the two notes feel like one. Fifth: two different notes that fit very well. Hum Twinkle to check.'), examples: [ex(b('P8', 'P8'), up(12)), ex(b('P5', 'P5'), up(7))] }],
  }),
  lesson({
    id: 'iv-4', title: b('Quãng 4 đúng (P4)', 'Perfect fourth (P4)'), desc: b('Vững nhưng muốn đi tiếp', 'Steady but moving on'),
    newItems: ['P4'], pool: ['P8', 'P5', 'P4'], anchors: ['iv-bridal-p4', 'iv-amazing-p4', 'iv-auld-p4'], traps: [pair('P4', 'P5')],
    slides: [
      { title: b('Năm nửa cung', 'Five half steps'), body: b('Đô lên Fa là quãng 4 đúng. Đó là tiếng mở đầu của Hành khúc cưới, Amazing Grace và Auld Lang Syne.', 'C up to F is a perfect fourth. It opens the Bridal Chorus, Amazing Grace and Auld Lang Syne.'), keys: [60, 65], examples: [ex(b('Đô → Fa', 'C → F'), up(5)), ex(b('Cùng lúc', 'Together'), up(5), true)] },
      { title: b('Như một lời gọi', 'Like a call'), body: b('Quãng 4 nghe như một lời gọi "đi nào!": vững nhưng vẫn muốn bước tiếp, trong khi quãng 5 đã "đến nơi".', 'A fourth sounds like a call to go: steady, yet it wants to move on, while a fifth has arrived.'), examples: [ex(b('P4 rồi P5', 'P4 then P5'), [60, 65, 60, 67])] },
    ],
  }),
  lesson({
    id: 'iv-5', title: b('Hai quãng đúng', 'The two perfect intervals'), desc: b('Quãng 4 hay quãng 5', 'Fourth or fifth'),
    pool: ['P4', 'P5'], anchors: ['iv-bridal-p4', 'iv-twinkle-p5'], traps: [pair('P4', 'P5')],
    slides: [{ title: b('Hai bài hát mốc', 'Two anchor songs'), body: b('Hành khúc cưới (quãng 4) hay Twinkle (quãng 5)? Hát thầm cả hai rồi chọn bài khớp với âm vừa nghe.', 'Bridal Chorus (fourth) or Twinkle (fifth)? Hum both and pick the one that fits.'), examples: [ex(b('P4', 'P4'), up(5)), ex(b('P5', 'P5'), up(7))] }],
  }),
  lesson({
    id: 'iv-6', title: b('Quãng đúng đi xuống', 'Perfect intervals going down'), desc: b('Nghe "ngược"', 'Heard backwards'),
    newItems: ['P4', 'P5', 'P8'], pool: ['P4', 'P5', 'P8'], direction: 'down', anchors: ['iv-adeste-p4d', 'iv-twinkle-p5d'], traps: [pair('P4', 'P5', 'down')],
    slides: [
      { title: b('Cùng khoảng cách, ngược chiều', 'Same distance, other way'), body: b('Quãng đi xuống có cùng tên với quãng đi lên: Sol xuống Đô vẫn là quãng 5. Nhưng màu nghe khác: đi xuống thường nghe như "kết thúc".', 'A falling interval keeps its name: G down to C is still a fifth. It sounds different though: falling often feels like an ending.'), examples: [ex(b('P5 xuống', 'P5 down'), [67, 60]), ex(b('P4 xuống', 'P4 down'), [65, 60]), ex(b('P8 xuống', 'P8 down'), [72, 60])] },
      { title: b('Mốc đi xuống', 'Falling anchors'), body: b('"O come, all ye faithful" có bước quãng 4 đi xuống ngay đầu bài. Twinkle hát ngược (Sol về Đô) là quãng 5 đi xuống.', '"O come, all ye faithful" has a falling fourth at the start. Twinkle backwards (G to C) is a falling fifth.') },
    ],
  }),
  checkpoint('iv-cp1', b('Checkpoint: quãng đúng', 'Checkpoint: perfect intervals'), b('30 câu P4, P5, P8 lên và xuống', '30 questions, P4, P5, P8 up and down'), ['P4', 'P5', 'P8'], 'both'),
  lesson({
    id: 'iv-7', title: b('Quãng 3 trưởng (M3)', 'Major third (M3)'), desc: b('Vui và sáng', 'Happy and bright'),
    newItems: ['M3'], pool: ['M3', 'P4', 'P5', 'P8'], anchors: ['iv-saints-m3'], traps: [pair('M3', 'P4')],
    slides: [
      { title: b('Bốn nửa cung', 'Four half steps'), body: b('Đô lên Mi. Đây là mảnh đầu tiên của hợp âm trưởng nên nghe vui, sáng. Mốc: "Oh when the saints".', 'C up to E. It is the first part of a major chord, so it sounds happy and bright. Anchor: "Oh when the saints".'), keys: [60, 64], examples: [ex(b('Đô → Mi', 'C → E'), up(4)), ex(b('Cùng lúc', 'Together'), up(4), true)] },
      { title: b('Khác quãng 4', 'Not a fourth'), body: b('Quãng 3 trưởng chỉ kém quãng 4 nửa cung nhưng ấm và ngọt hơn nhiều; quãng 4 nghe rỗng.', 'A major third is only a half step smaller than a fourth, but much warmer and sweeter; the fourth sounds hollow.'), examples: [ex(b('M3 rồi P4', 'M3 then P4'), [60, 64, 60, 65])] },
    ],
  }),
  lesson({
    id: 'iv-8', title: b('Quãng 3 thứ (m3)', 'Minor third (m3)'), desc: b('Buồn', 'Sad'),
    newItems: ['m3'], pool: ['m3', 'M3', 'P5'], anchors: ['iv-greensleeves-m3', 'iv-brahms-m3'], traps: [pair('m3', 'M3')],
    slides: [
      { title: b('Ba nửa cung', 'Three half steps'), body: b('La lên Đô, hay Mi lên Sol. Mảnh đầu của hợp âm thứ: buồn, dịu. Mốc: Greensleeves, Khúc hát ru của Brahms.', 'A up to C, or E up to G. The first part of a minor chord: sad and soft. Anchors: Greensleeves, Brahms\' Lullaby.'), keys: [57, 60], examples: [ex(b('La → Đô', 'A → C'), [57, 60]), ex(b('Cùng lúc', 'Together'), [57, 60], true)] },
    ],
  }),
  lesson({
    id: 'iv-9', title: b('Vui hay buồn', 'Happy or sad'), desc: b('Quãng 3 trưởng hay thứ', 'Major or minor third'),
    pool: ['M3', 'm3'], anchors: ['iv-saints-m3', 'iv-greensleeves-m3'], traps: [pair('M3', 'm3')],
    slides: [{ title: b('Chỉ khác nửa cung', 'Just a half step apart'), body: b('Hai quãng 3 chỉ khác nhau một phím đàn nhưng đổi hẳn cảm xúc: trưởng vui, thứ buồn.', 'The two thirds differ by one key but change the whole mood: major happy, minor sad.'), examples: [ex(b('M3', 'M3'), up(4)), ex(b('m3', 'm3'), up(3))] }],
  }),
  lesson({
    id: 'iv-10', title: b('Mảnh của hợp âm trưởng', 'Pieces of a major chord'), desc: b('Quãng 3 trưởng và quãng 5', 'Major third and fifth'),
    pool: ['M3', 'P5'], anchors: ['iv-major-arp'], traps: [pair('M3', 'P5', 'harmonic')],
    slides: [{ title: b('Đô – Mi – Sol', 'C – E – G'), body: b('Hợp âm Đô trưởng chứa Đô–Mi (M3) và Đô–Sol (P5). Câu bẫy của bài này phát hai nốt cùng lúc.', 'The C major chord holds C–E (M3) and C–G (P5). The trap questions here play both notes together.'), keys: [60, 64, 67], examples: [ex(b('M3 cùng lúc', 'M3 together'), up(4), true), ex(b('P5 cùng lúc', 'P5 together'), up(7), true)] }],
  }),
  lesson({
    id: 'iv-11', title: b('Mảnh của hợp âm thứ', 'Pieces of a minor chord'), desc: b('Quãng 3 thứ và quãng 5', 'Minor third and fifth'),
    pool: ['m3', 'P5'], anchors: ['iv-minor-arp'], traps: [pair('m3', 'P4')],
    slides: [{ title: b('La – Đô – Mi', 'A – C – E'), body: b('Hợp âm La thứ chứa La–Đô (m3) và La–Mi (P5).', 'The A minor chord holds A–C (m3) and A–E (P5).'), keys: [57, 60, 64], examples: [ex(b('m3', 'm3'), [57, 60]), ex(b('P5', 'P5'), [57, 64])] }],
  }),
  lesson({
    id: 'iv-12', title: b('Quãng 3 đi xuống', 'Thirds going down'), desc: b('Trưởng và thứ đi xuống', 'Major and minor, falling'),
    newItems: ['M3', 'm3'], pool: ['M3', 'm3'], direction: 'down', anchors: ['iv-fifth-m3d', 'iv-oldman-m3d'], traps: [pair('M3', 'm3', 'down')],
    slides: [{ title: b('Mốc đi xuống', 'Falling anchors'), body: b('Mở đầu Giao hưởng số 5 của Beethoven (Sol Sol Sol Mi♭) là quãng 3 trưởng đi xuống. "This Old Man" mở đầu bằng quãng 3 thứ đi xuống (Sol → Mi).', 'Beethoven\'s Fifth opens with a falling major third (G G G E♭). "This Old Man" opens with a falling minor third (G → E).'), examples: [ex(b('M3 xuống', 'M3 down'), [64, 60]), ex(b('m3 xuống', 'm3 down'), [67, 64])] }],
  }),
  checkpoint('iv-cp2', b('Checkpoint: quãng 3 và quãng đúng', 'Checkpoint: thirds and perfects'), b('30 câu m3, M3, P4, P5, P8 lên và xuống', '30 questions, m3 M3 P4 P5 P8 up and down'), ['m3', 'M3', 'P4', 'P5', 'P8'], 'both'),
  lesson({
    id: 'iv-13', title: b('Quãng 2 trưởng (M2)', 'Major second (M2)'), desc: b('Một bước', 'One step'),
    newItems: ['M2'], pool: ['M2', 'm3', 'M3'], anchors: ['iv-birthday-m2', 'iv-frere-m2'], traps: [pair('M2', 'm3')],
    slides: [{ title: b('Bước đi của giai điệu', 'The step of a melody'), body: b('Đô lên Rê: hai nửa cung, một "bước" bình thường. Phần lớn giai điệu đi bằng những bước như thế. Mốc: "Happy birth-day", Frère Jacques.', 'C up to D: two half steps, a normal step. Most melodies move like this. Anchors: "Happy birth-day", Frère Jacques.'), keys: [60, 62], examples: [ex(b('Đô → Rê', 'C → D'), up(2)), ex(b('Cùng lúc', 'Together'), up(2), true)] }],
  }),
  lesson({
    id: 'iv-14', title: b('Quãng 2 thứ (m2)', 'Minor second (m2)'), desc: b('Nửa cung, căng', 'A half step, tense'),
    newItems: ['m2'], pool: ['m2', 'M2'], anchors: ['iv-ode-m2'], traps: [pair('m2', 'M2')],
    slides: [{ title: b('Hai phím liền nhau', 'Two keys side by side'), body: b('Mi lên Fa, Si lên Đô: nửa cung, quãng nhỏ nhất. Vang cùng lúc nghe rất chói. Mốc: "Ode to Joy" (Mi Mi Fa).', 'E up to F, B up to C: a half step, the smallest interval. Together it clashes. Anchor: "Ode to Joy" (E E F).'), keys: [64, 65], examples: [ex(b('Mi → Fa', 'E → F'), [64, 65]), ex(b('Cùng lúc', 'Together'), [64, 65], true)] }],
  }),
  lesson({
    id: 'iv-15', title: b('Bước hay nhảy', 'Step or skip'), desc: b('Quãng 2 trưởng hay quãng 3 trưởng', 'Major second or major third'),
    pool: ['M2', 'M3'], anchors: ['iv-birthday-m2', 'iv-saints-m3'], traps: [pair('M2', 'M3')],
    slides: [{ title: b('Bước (2) và nhảy (3)', 'Step (2) and skip (3)'), body: b('Quãng 2 là bước sang nốt kế bên; quãng 3 bỏ qua một nốt.', 'A second steps to the next note; a third skips one.'), examples: [ex(b('M2', 'M2'), up(2)), ex(b('M3', 'M3'), up(4))] }],
  }),
  lesson({
    id: 'iv-16', title: b('Quãng nhỏ', 'Small intervals'), desc: b('m2, M2, m3', 'm2, M2, m3'),
    pool: ['m2', 'M2', 'm3'], anchors: ['iv-ode-m2', 'iv-greensleeves-m3'], traps: [pair('m3', 'M2')],
    slides: [{ title: b('1, 2, 3 nửa cung', '1, 2, 3 half steps'), body: b('Ba quãng nhỏ nhất. Quãng 3 thứ đã nghe như một "bước nhảy" buồn, không còn là bước liền.', 'The three smallest intervals. The minor third already sounds like a sad skip, not a step.'), examples: [ex(b('m2', 'm2'), up(1)), ex(b('M2', 'M2'), up(2)), ex(b('m3', 'm3'), up(3))] }],
  }),
  lesson({
    id: 'iv-17', title: b('Quãng 2 đi xuống', 'Seconds going down'), desc: b('Trưởng và thứ đi xuống', 'Major and minor, falling'),
    newItems: ['M2', 'm2'], pool: ['M2', 'm2'], direction: 'down', anchors: ['iv-mary-m2d', 'iv-furelise-m2d'], traps: [pair('m2', 'M2', 'down')],
    slides: [{ title: b('Mốc đi xuống', 'Falling anchors'), body: b('"Mary had a little lamb" bắt đầu bằng Mi → Rê (M2 xuống). Für Elise bắt đầu bằng Mi → Rê♯ (m2 xuống).', '"Mary had a little lamb" starts E → D (M2 down). Für Elise starts E → D♯ (m2 down).'), examples: [ex(b('M2 xuống', 'M2 down'), [64, 62]), ex(b('m2 xuống', 'm2 down'), [76, 75])] }],
  }),
  checkpoint('iv-cp3', b('Checkpoint: quãng nhỏ', 'Checkpoint: small intervals'), b('30 câu từ m2 đến P4, lên và xuống', '30 questions, m2 to P4, up and down'), ['m2', 'M2', 'm3', 'M3', 'P4'], 'both'),
  lesson({
    id: 'iv-18', title: b('Quãng 6 trưởng (M6)', 'Major sixth (M6)'), desc: b('Rộng và ấm', 'Wide and warm'),
    newItems: ['M6'], pool: ['M6', 'P5', 'P8'], anchors: ['iv-bonnie-m6'], traps: [pair('M6', 'P5')],
    slides: [{ title: b('Chín nửa cung', 'Nine half steps'), body: b('Sol lên Mi (hay Đô lên La). Rộng, ấm, như đang mở lòng. Mốc: "My Bon-nie".', 'G up to E (or C up to A). Wide and warm, opening up. Anchor: "My Bon-nie".'), keys: [60, 69], examples: [ex(b('Đô → La', 'C → A'), up(9)), ex(b('Cùng lúc', 'Together'), up(9), true)] }],
  }),
  lesson({
    id: 'iv-19', title: b('Quãng 6 thứ (m6)', 'Minor sixth (m6)'), desc: b('Da diết', 'Yearning'),
    newItems: ['m6'], pool: ['m6', 'M6'], anchors: ['iv-entertainer-m6'], traps: [pair('m6', 'P5')],
    slides: [{ title: b('Tám nửa cung', 'Eight half steps'), body: b('Mi lên Đô. Nghe da diết, hơi buồn. Mốc: đoạn mở đầu The Entertainer (Rê Rê♯ Mi → Đô).', 'E up to C. Yearning, a little sad. Anchor: the opening of The Entertainer (D D♯ E → C).'), keys: [64, 72], examples: [ex(b('Mi → Đô', 'E → C'), [64, 72]), ex(b('Cùng lúc', 'Together'), [64, 72], true)] }],
  }),
  lesson({
    id: 'iv-20', title: b('Quãng thuận', 'Consonant intervals'), desc: b('Quãng 3 và quãng 6', 'Thirds and sixths'),
    pool: ['m3', 'M3', 'm6', 'M6'], anchors: ['iv-greensleeves-m3', 'iv-bonnie-m6'], traps: [pair('m3', 'M6')],
    slides: [{ title: b('Quãng 3 lật ngược là quãng 6', 'A third turned over is a sixth'), body: b('Đô–Mi (M3) lật lên thành Mi–Đô (m6); La–Đô (m3) lật thành Đô–La (M6). Trưởng thành thứ, thứ thành trưởng.', 'C–E (M3) turned over is E–C (m6); A–C (m3) turned over is C–A (M6). Major becomes minor and back.'), examples: [ex(b('M3 → m6', 'M3 → m6'), [60, 64, 64, 72]), ex(b('m3 → M6', 'm3 → M6'), [57, 60, 60, 69])] }],
  }),
  checkpoint('iv-cp4', b('Checkpoint: thuận âm', 'Checkpoint: consonances'), b('30 câu m3 M3 P4 P5 m6 M6 P8', '30 questions, m3 M3 P4 P5 m6 M6 P8'), ['m3', 'M3', 'P4', 'P5', 'm6', 'M6', 'P8'], 'up'),
  lesson({
    id: 'iv-21', title: b('Quãng 7 trưởng (M7)', 'Major seventh (M7)'), desc: b('Gần chạm quãng 8', 'Almost an octave'),
    newItems: ['M7'], pool: ['M7', 'P8', 'M6'], anchors: ['iv-leading-m7'], traps: [pair('M7', 'P8')],
    slides: [{ title: b('Mười một nửa cung', 'Eleven half steps'), body: b('Đô lên Si: thiếu đúng nửa cung là thành quãng 8. Tai muốn Si bước thêm lên Đô.', 'C up to B: one half step short of an octave. The ear wants B to step up to C.'), keys: [60, 71], examples: [ex(b('Đô → Si', 'C → B'), up(11)), ex(b('Đô → Si → Đô', 'C → B → C'), [60, 71, 72])] }],
  }),
  lesson({
    id: 'iv-22', title: b('Quãng 7 thứ (m7)', 'Minor seventh (m7)'), desc: b('Hơi "funky"', 'A bit funky'),
    newItems: ['m7'], pool: ['m7', 'M7', 'M6'], anchors: ['iv-g7-m7'], traps: [pair('m7', 'M6')],
    slides: [{ title: b('Mười nửa cung', 'Ten half steps'), body: b('Sol lên Fa: hai nốt ngoài của hợp âm Sol 7. Nghe hơi "jazz", chưa muốn dừng.', 'G up to F: the outer notes of a G7 chord. Jazzy, not ready to stop.'), keys: [55, 65], examples: [ex(b('Sol → Fa', 'G → F'), [55, 65]), ex(b('Cùng lúc', 'Together'), [55, 65], true)] }],
  }),
  lesson({
    id: 'iv-23', title: b('Quãng rộng', 'Wide intervals'), desc: b('M6, m7, M7, P8', 'M6, m7, M7, P8'),
    pool: ['M6', 'm7', 'M7', 'P8'], anchors: ['iv-bonnie-m6', 'iv-g7-m7'], traps: [pair('m7', 'M7')],
    slides: [{ title: b('Đếm từ quãng 8 xuống', 'Count down from the octave'), body: b('Quãng rộng dễ nhận hơn khi so với quãng 8: M7 thiếu 1 nửa cung, m7 thiếu 2, M6 thiếu 3.', 'Wide intervals are easier against the octave: M7 is 1 half step short, m7 is 2, M6 is 3.'), examples: [ex(b('M6', 'M6'), up(9)), ex(b('m7', 'm7'), up(10)), ex(b('M7', 'M7'), up(11)), ex(b('P8', 'P8'), up(12))] }],
  }),
  lesson({
    id: 'iv-24', title: b('Hai cực', 'The two extremes'), desc: b('Quãng 2 thứ và quãng 7 trưởng', 'Minor second and major seventh'),
    pool: ['m2', 'M7'], anchors: ['iv-ode-m2', 'iv-leading-m7'], traps: [pair('m2', 'M7', 'harmonic')],
    slides: [{ title: b('Hai quãng chói nhất', 'The two harshest'), body: b('m2 và M7 là đảo của nhau, đều chói khi vang cùng lúc. Một cái sát, một cái xa.', 'm2 and M7 are inversions of each other, both harsh together. One close, one far.'), examples: [ex(b('m2 cùng lúc', 'm2 together'), up(1), true), ex(b('M7 cùng lúc', 'M7 together'), up(11), true)] }],
  }),
  checkpoint('iv-cp5', b('Checkpoint: quãng giãn', 'Checkpoint: wide intervals'), b('30 câu m2 M6 m7 M7 P8', '30 questions, m2 M6 m7 M7 P8'), ['m2', 'M6', 'm7', 'M7', 'P8'], 'up'),
  lesson({
    id: 'iv-25', title: b('Tritone (A4)', 'Tritone (A4)'), desc: b('Đứng giữa quãng 8, rất căng', 'Half an octave, very tense'),
    newItems: ['TT'], pool: ['TT', 'P4', 'P5'], anchors: ['iv-macabre-tt'], traps: [pair('TT', 'P5')],
    slides: [{ title: b('Sáu nửa cung', 'Six half steps'), body: b('Fa lên Si: ba cung, đúng giữa quãng 8. Ngày xưa gọi là "quãng ma quỷ". Danse Macabre mở đầu bằng vĩ cầm chơi quãng này.', 'F up to B: three whole steps, half an octave. Once called the "devil\'s interval". Danse Macabre opens with a violin playing it.'), keys: [65, 71], examples: [ex(b('Fa → Si', 'F → B'), [65, 71]), ex(b('Cùng lúc', 'Together'), [65, 71], true)] }],
  }),
  lesson({
    id: 'iv-26', title: b('Nghịch âm', 'Dissonances'), desc: b('m2, A4, M7', 'm2, A4, M7'),
    pool: ['m2', 'TT', 'M7'], anchors: ['iv-macabre-tt'], traps: [pair('TT', 'M7')],
    slides: [{ title: b('Ba quãng căng nhất', 'The three tensest'), body: b('Ba quãng này "đòi" được giải quyết. Phân biệt bằng độ rộng: sát (m2), giữa (A4), gần quãng 8 (M7).', 'These three demand resolution. Tell them by width: close (m2), middle (A4), near the octave (M7).'), examples: [ex(b('m2', 'm2'), up(1)), ex(b('A4', 'A4'), up(6)), ex(b('M7', 'M7'), up(11))] }],
  }),
  lesson({
    id: 'iv-27', title: b('Bốn – tăng – năm', 'Fourth, tritone, fifth'), desc: b('P4, A4, P5', 'P4, A4, P5'),
    pool: ['P4', 'TT', 'P5'], anchors: ['iv-bridal-p4', 'iv-macabre-tt', 'iv-twinkle-p5'], traps: [pair('P4', 'TT')],
    slides: [{ title: b('Ba phím liền nhau', 'Three neighbouring keys'), body: b('Fa, Fa♯, Sol tính từ Đô: P4 vững, A4 căng, P5 vững. Nghe xem có "căng" không trước khi chọn.', 'F, F♯, G counted from C: P4 steady, A4 tense, P5 steady. Listen for tension first.'), examples: [ex(b('P4', 'P4'), up(5)), ex(b('A4', 'A4'), up(6)), ex(b('P5', 'P5'), up(7))] }],
  }),
  checkpoint('iv-cp6', b('Checkpoint: đủ 12 quãng từ Đô', 'Checkpoint: all twelve from C'), b('30 câu, 12 quãng đi lên, gốc Đô 4', '30 questions, twelve intervals up from C4'), ALL, 'up', 60),
  lesson({
    id: 'iv-28', title: b('Quãng 2 và 3 ngẫu nhiên', 'Seconds and thirds anywhere'), desc: b('Gốc bất kỳ', 'Any starting note'),
    pool: ['m2', 'M2', 'm3', 'M3'], traps: [pair('M2', 'm3')],
    slides: [{ title: b('Gốc nào cũng được', 'Any root'), body: b('Từ đây nốt gốc thay đổi liên tục. Đừng nghe độ cao, hãy nghe khoảng cách.', 'From now on the starting note keeps changing. Listen to the distance, not the height.') }],
  }),
  lesson({
    id: 'iv-29', title: b('Quãng đúng ngẫu nhiên', 'Perfect intervals anywhere'), desc: b('P4, P5, P8', 'P4, P5, P8'),
    pool: ['P4', 'P5', 'P8'], traps: [pair('P4', 'P5')],
    slides: [{ title: b('Ôn quãng đúng', 'Review the perfects'), body: b('Hành khúc cưới, Twinkle và quãng 8 — ở mọi độ cao.', 'Bridal Chorus, Twinkle and the octave — at every height.') }],
  }),
  lesson({
    id: 'iv-30', title: b('Quãng 6 và 7 ngẫu nhiên', 'Sixths and sevenths anywhere'), desc: b('m6, M6, m7, M7', 'm6, M6, m7, M7'),
    pool: ['m6', 'M6', 'm7', 'M7'], traps: [pair('M6', 'm7')],
    slides: [{ title: b('Bốn quãng rộng', 'Four wide ones'), body: b('Nhớ mốc: The Entertainer (m6), My Bonnie (M6), Sol 7 (m7), nốt dẫn (M7).', 'Anchors: The Entertainer (m6), My Bonnie (M6), G7 (m7), leading note (M7).') }],
  }),
  lesson({
    id: 'iv-31', title: b('Xu hướng giải quyết', 'Where intervals want to go'), desc: b('Nghe quãng và nơi nó "về"', 'Hear an interval and where it resolves'),
    pool: ['TT', 'm7', 'm2', 'P4'], resolve: true, anchors: ['iv-resolve'], traps: [pair('TT', 'P4')],
    slides: [
      { title: b('Căng rồi chùng', 'Tension and release'), body: b('Quãng căng luôn muốn đi đâu đó: Fa–Si mở ra Mi–Đô; Sol–Fa về Đô–Mi; Si–Đô về Đô; quãng 4 "treo" về quãng 3. Mỗi câu ở bài này phát quãng rồi phát nơi nó về.', 'Tense intervals want to move: F–B opens to E–C; G–F goes to C–E; B–C goes to C; a suspended fourth falls to a third. Each question here plays the interval, then where it goes.'), examples: [ex(b('A4 → m6', 'A4 → m6'), [65, 71]), ex(b('Nơi nó về', 'Where it goes'), [64, 72], true)] },
    ],
  }),
  lesson({
    id: 'iv-32', title: b('Nhảy xa đi xuống', 'Wide leaps down'), desc: b('M6, m7, M7, A4 đi xuống', 'M6, m7, M7, A4 falling'),
    newItems: ['M6', 'm7', 'M7', 'TT'], pool: ['M6', 'm7', 'M7', 'TT'], direction: 'down', traps: [pair('m7', 'M6', 'down')],
    slides: [{ title: b('Rơi từ trên cao', 'Falling from high'), body: b('Quãng rộng đi xuống khó hơn đi lên. Mẹo: hát thầm ngược lại từ nốt thấp lên nốt cao.', 'Wide falling intervals are harder than rising ones. Tip: sing it back up from the low note.'), examples: [ex(b('M6 xuống', 'M6 down'), [69, 60]), ex(b('m7 xuống', 'm7 down'), [70, 60])] }],
  }),
  lesson({
    id: 'iv-33', title: b('Mọi hướng', 'Every direction'), desc: b('Lên, xuống, cùng lúc', 'Up, down, together'),
    pool: ALL, direction: 'all', traps: [pair('m3', 'M3', 'all')],
    slides: [{ title: b('Tổng hợp', 'All together'), body: b('12 quãng, ba cách phát. Quãng hòa âm: nghe độ "hợp" của hai nốt trước, rồi mới đoán khoảng cách.', 'Twelve intervals, three ways of playing. Harmonic ones: judge how well the notes blend first, then the distance.') }],
  }),
  checkpoint('iv-cp7', b('Checkpoint: mọi hướng', 'Checkpoint: every direction'), b('30 câu, 12 quãng, lên và xuống', '30 questions, twelve intervals, up and down'), ALL, 'both'),
  {
    id: 'iv-final',
    kind: 'final',
    title: b('Thi cuối: bậc thầy quãng', 'Final exam: interval master'),
    desc: b('40 câu, 12 quãng, lên / xuống / cùng lúc, 6 giây mỗi câu', '40 questions, twelve intervals, up / down / together, 6 s each'),
    newItems: [],
    slides: [],
    anchors: [],
    pool: ALL,
    register: 'wide',
    direction: 'all',
    traps: [],
    questionCount: 40,
    timeLimitMs: 6000,
  },
];

export const INTERVALS_PATH: PathDef = {
  id: 'intervals',
  title: b('Quãng', 'Intervals'),
  tagline: b('Khoảng cách giữa hai nốt', 'The distance between two notes'),
  color: '#60a5fa',
  items: ALL,
  lessons: LESSONS,
};
