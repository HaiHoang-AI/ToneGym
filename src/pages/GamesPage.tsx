import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../app/ProfileContext';
import { useL } from '../app/useL';
import { GameArt } from '../components/art/GameArt';
import { GAMES } from '../games/registry';
import { SKILL_COLORS, SKILL_NAMES, SKILLS, type Skill } from '../games/types';
import { useAllProgress } from '../progress/hooks';
import { accuracy } from '../progress/scoring';

type Sort = 'skill' | 'level' | 'recent';

export function GamesPage() {
  const profile = useProfile();
  const l = useL();
  const progress = new Map(useAllProgress(profile.id!).map((p) => [p.gameId, p]));
  const [filter, setFilter] = useState<Skill | 'all'>('all');
  const [sort, setSort] = useState<Sort>('skill');

  let games = GAMES.filter((g) => filter === 'all' || g.skill === filter);
  if (sort === 'level') games = [...games].sort((a, b) => (progress.get(b.id)?.maxLevel ?? 0) - (progress.get(a.id)?.maxLevel ?? 0));
  if (sort === 'recent') games = [...games].sort((a, b) => (progress.get(b.id)?.updatedAt ?? 0) - (progress.get(a.id)?.updatedAt ?? 0));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label !mb-0">{l('18 game · mọi game đều mở', '18 games · all unlocked')}</div>
          <h1 className="h-display mt-1.5 text-[32px] font-bold">{l('Thư viện game', 'Game library')}</h1>
          <p className="mt-2 max-w-[620px] leading-relaxed text-muted">
            {l('Mỗi level 8 chặng, 3 mạng, 2 phao gợi ý. Qua level 10 có thể lùi tối đa 10 level để ôn lại.', 'Each level has 8 rounds, 3 lives and 2 hints. After level 10 you can step back up to 10 levels to review.')}
          </p>
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase text-muted">
          {l('Sắp xếp', 'Sort')}
          <select className="field !w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="skill">{l('Theo kỹ năng', 'By skill')}</option>
            <option value="level">{l('Level cao nhất', 'Highest level')}</option>
            <option value="recent">{l('Chơi gần đây', 'Recently played')}</option>
          </select>
        </label>
      </div>

      <div role="group" aria-label={l('Lọc theo kỹ năng', 'Filter by skill')} className="flex flex-wrap gap-2">
        {(['all', ...SKILLS] as const).map((k) => {
          const on = k === filter;
          const color = k === 'all' ? '#f4b740' : SKILL_COLORS[k];
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(k)}
              className="chip"
              style={on ? { background: `${color}24`, borderColor: color, color: 'var(--ink)' } : undefined}
            >
              {k === 'all' ? l('Tất cả', 'All') : l(SKILL_NAMES[k])}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
        {games.map((g) => {
          const p = progress.get(g.id);
          const ready = !!g.makeQuestion;
          const acc = p ? Math.round(accuracy(p) * 100) : 0;
          return (
            <article key={g.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="relative border-b border-line">
                <GameArt skill={g.skill} variant={g.art.variant} mark={g.art.mark} height={176} />
                <span
                  className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{ background: 'rgba(14,16,20,.88)', color: SKILL_COLORS[g.skill] }}
                >
                  {ready ? `Lv ${p?.level ?? 1}` : l(`Giai đoạn ${g.phase}`, `Phase ${g.phase}`)}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted">{l(SKILL_NAMES[g.skill])}</div>
                <h2 className="h-display text-lg font-semibold">{l(g.name)}</h2>
                <p className="text-sm leading-snug text-muted">{l(g.desc)}</p>
                <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full" style={{ width: `${acc}%`, background: SKILL_COLORS[g.skill] }} />
                  </div>
                  <span>{p ? l(`${p.levelsPassed} level · ${acc}% đúng`, `${p.levelsPassed} levels · ${acc}%`) : l('Chưa chơi', 'Not played')}</span>
                </div>
                {ready ? (
                  <Link className="btn mt-1" to={`/play/${g.id}`}>{l('Chơi', 'Play')}</Link>
                ) : (
                  <button type="button" className="btn mt-1" disabled>{l('Sắp có', 'Coming soon')}</button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
