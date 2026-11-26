import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../../app/ProfileContext';
import { useL } from '../../app/useL';
import { Teacher, Yumika } from '../../components/art/Characters';
import { LESSONS } from '../../learn/course';
import { pathMastery } from '../../learn/mastery';
import { getPath, PATH_CARDS, type PathCard } from '../../learn/paths';
import { countDone } from '../../learn/stars';
import { useAllLearnData } from '../../learn/store';
import { useToolData } from '../../tools/useToolData';
import { localDate } from '../../learn/store';
import { DAILY_DONE_KEY, dailySummary } from './DailySession';

export function LearnHub() {
  const l = useL();
  const profile = useProfile();
  const data = useAllLearnData(profile.id);
  const [theoryDone] = useToolData<string[]>('lessons-done', []);
  const [open, setOpen] = useState<PathCard | null>(null);
  const [dailyDone] = useToolData<string[]>(DAILY_DONE_KEY, []);
  const daily = data ? dailySummary(data.progress, data.mastery) : null;
  const doneToday = dailyDone.includes(localDate());
  const overall = data
    ? Math.round(
        (PATH_CARDS.reduce((sum, c) => {
          const path = getPath(c.id)!;
          return sum + pathMastery(path.items, new Map(data.mastery.filter((m) => m.pathId === c.id).map((m) => [m.itemId, m])));
        }, 0) /
          PATH_CARDS.length) *
          100,
      )
    : 0;

  const stat = (card: PathCard) => {
    const path = getPath(card.id);
    if (!path || !data) return { done: 0, mastery: 0, pinned: 0, pinnedIds: [] as string[] };
    const progress = new Map(data.progress.filter((p) => p.pathId === card.id).map((p) => [p.lessonId, p]));
    const mastery = new Map(data.mastery.filter((m) => m.pathId === card.id).map((m) => [m.itemId, m]));
    return {
      done: countDone(path.lessons, progress),
      mastery: Math.round(pathMastery(path.items, mastery) * 100),
      pinned: [...progress.values()].filter((p) => p.pinned).length,
      pinnedIds: path.lessons.filter((x) => progress.get(x.id)?.pinned).map((x) => x.id),
    };
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center gap-4 rounded-[20px] border border-line bg-surface px-5 py-4">
        <Teacher mood="wave" size={92} />
        <div className="min-w-0 flex-[1_1_280px]">
          <div className="label !mb-0">{l('Lộ trình học', 'Learning paths')}</div>
          <h1 className="h-display mt-1 text-[30px] font-bold">{l('Học từng bước, luyện thật nhiều', 'Learn step by step, practise a lot')}</h1>
          <p className="mt-1 text-muted">
            {l(
              'Mỗi bài: lý thuyết ngắn, một giai điệu quen làm mốc, rồi hàng chục câu luyện. Đạt 2★ là mở bài sau; checkpoint luôn mở để thi vượt cấp.',
              'Each lesson: short theory, a familiar tune as an anchor, then dozens of questions. 2★ opens the next one; checkpoints are always open so you can test out.',
            )}
          </p>
        </div>
        <Yumika mood="cheer" size={84} outfit={profile.settings.mascotOutfit ?? 'casual'} />
      </section>

      <Link to="/learn/daily" data-testid="daily-card" className="flex flex-wrap items-center gap-4 rounded-[20px] border-2 border-accent/60 bg-accent/10 px-5 py-4 text-ink no-underline hover:bg-accent/15">
        <span className="text-4xl" aria-hidden="true">{doneToday ? '✅' : '🎧'}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold">{l('Buổi luyện hôm nay', "Today's session")}</span>
          <span className="text-sm text-muted">
            {doneToday ? l('Đã xong hôm nay — luyện thêm nếu muốn. ', 'Done today — practise more if you like. ') : ''}
            {l('~3 phút', '~3 min')}{daily ? l(` · ${daily.reviews} câu ôn · +${daily.fresh} mới`, ` · ${daily.reviews} reviews · +${daily.fresh} new`) : ''}
          </span>
        </span>
        <span className="text-right">
          <span className="block text-xs text-muted">{l('Thành thạo chung', 'Overall mastery')}</span>
          <span className="h-display text-2xl font-bold">{overall}%</span>
        </span>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PATH_CARDS.map((card) => {
          const ready = !!getPath(card.id);
          const s = stat(card);
          return (
            <button
              key={card.id}
              type="button"
              data-path={card.id}
              disabled={!ready}
              onClick={() => setOpen(card)}
              className="card relative flex flex-col gap-3 text-left transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-60"
              style={{ borderTop: `5px solid ${card.color}` }}
            >
              {s.pinned > 0 && <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-[#fb923c]" title={l('Có bài đã ghim', 'Has pinned lessons')} />}
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="h-display text-2xl font-bold" style={{ color: card.color }}>{l(card.title)}</h2>
                {ready ? <span className="text-sm font-semibold text-muted">{s.mastery}%</span> : <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{l('Sắp có', 'Coming soon')}</span>}
              </div>
              <p className="text-sm text-muted">{l(card.tagline)}</p>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full" style={{ width: `${(s.done / card.size) * 100}%`, background: card.color }} />
              </div>
              <div className="text-xs text-muted">{s.done} / {card.size}</div>
            </button>
          );
        })}
        <Link to="/learn/theory" className="card flex flex-col gap-3 text-ink no-underline transition-transform hover:-translate-y-0.5" style={{ borderTop: '5px solid #34d399' }}>
          <h2 className="h-display text-2xl font-bold text-[#34d399]">{l('Nhạc lý cơ bản', 'Music theory basics')}</h2>
          <p className="text-sm text-muted">{l('Khóa 7 chương cùng thầy nhạc', 'The seven-unit course with the teacher')}</p>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-[#34d399]" style={{ width: `${(theoryDone.length / LESSONS.length) * 100}%` }} /></div>
          <div className="text-xs text-muted">{theoryDone.length} / {LESSONS.length}</div>
        </Link>
      </div>

      {open && <PathSheet card={open} pinnedIds={stat(open).pinnedIds} onClose={() => setOpen(null)} />}
    </div>
  );
}

function PathSheet({ card, pinnedIds, onClose }: { card: PathCard; pinnedIds: string[]; onClose: () => void }) {
  const l = useL();
  const pinned = pinnedIds.length;
  const path = getPath(card.id);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose} role="dialog" aria-modal="true" aria-label={l(card.title)}>
      <div className="w-full max-w-md rounded-t-3xl border border-line bg-surface p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="h-display text-2xl font-bold" style={{ color: card.color }}>{l(card.title)}</h2>
          <button type="button" className="btn btn-sm" onClick={onClose} aria-label={l('Đóng', 'Close')}>✕</button>
        </div>
        <div className="flex flex-col gap-3">
          <Link to={`/learn/${card.id}`} className="flex items-center justify-between rounded-2xl border border-line bg-surface-2 px-4 py-3 text-ink no-underline hover:border-accent">
            <span>
              <span className="block text-lg font-bold">{l('Học', 'Learn')}</span>
              <span className="text-sm text-muted">{pinned > 0 ? l(`${pinned} bài đã ghim để ôn`, `${pinned} lessons pinned for review`) : l('Học từng bước', 'Step by step')}</span>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
          {pinned > 0 && path && (
            <ul className="flex flex-col gap-1.5 pl-2" aria-label={l('Bài đã ghim', 'Pinned lessons')}>
              {pinnedIds.map((id) => (
                <li key={id}><Link to={`/learn/${card.id}/${id}`} className="text-sm font-semibold text-link">📌 {l(path.lessons.find((x) => x.id === id)!.title)}</Link></li>
              ))}
            </ul>
          )}
          <Link to={`/learn/${card.id}/practice`} className="flex items-center justify-between rounded-2xl border border-line bg-surface-2 px-4 py-3 text-ink no-underline hover:border-accent">
            <span>
              <span className="block text-lg font-bold">{l('Luyện', 'Practice')}</span>
              <span className="text-sm text-muted">{l('Quiz 60 giây với các mục đã học', '60-second quiz on what you have learned')}</span>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
