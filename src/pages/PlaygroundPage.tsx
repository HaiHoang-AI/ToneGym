import { Link } from 'react-router-dom';
import { useL } from '../app/useL';
import { GameArt } from '../components/art/GameArt';

const ITEMS = [
  {
    path: '/playground/melody', phase: 3, skill: 'melody' as const, variant: 1,
    name: { vi: 'Chép giai điệu', en: 'Melody dictation' },
    desc: { vi: 'Nghe giai điệu ở bất kỳ điệu thức nào và ghi lại trên phím đàn. 4 cấp độ.', en: 'Hear a melody in any mode and write it down on the keyboard. 4 levels.' },
  },
  {
    path: '/playground/sight-reading', phase: 4, skill: 'reading' as const, variant: 0,
    name: { vi: 'Đọc nốt', en: 'Sight-reading' },
    desc: { vi: 'Khóa Sol, Đô, Fa: đọc nốt, quãng, hợp âm, thế đảo trên khuông nhạc.', en: 'Treble, alto and bass clefs: read notes, intervals, chords and inversions.' },
  },
];

/** The two training playgrounds. Phases that have not shipped show as coming soon. */
export function PlaygroundPage({ shipped }: { shipped: number }) {
  const l = useL();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="label !mb-0">Playground</div>
        <h1 className="h-display mt-1 text-[32px] font-bold">{l('Luyện chuyên sâu', 'Focused training')}</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map((it) => {
          const ready = it.phase <= shipped;
          return (
            <article key={it.path} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <GameArt skill={it.skill} variant={it.variant} height={170} />
              <div className="flex flex-col gap-2 p-5">
                <h2 className="h-display text-xl font-bold">{l(it.name)}</h2>
                <p className="text-sm text-muted">{l(it.desc)}</p>
                {ready ? (
                  <Link className="btn btn-primary mt-2 self-start" to={it.path}>{l('Vào luyện', 'Open')}</Link>
                ) : (
                  <span className="mt-2 text-sm font-semibold text-link">{l(`Giai đoạn ${it.phase}`, `Phase ${it.phase}`)}</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
