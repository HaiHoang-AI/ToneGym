import { useLiveQuery } from 'dexie-react-hooks';
import { LearnStats } from '../components/learn/LearnStats';
import { useProfile } from '../app/ProfileContext';
import { useL } from '../app/useL';
import { db } from '../db/schema';
import { listProfiles } from '../db/profiles';
import { GAMES } from '../games/registry';
import { SKILL_COLORS, SKILL_NAMES } from '../games/types';
import { useAllProgress, useRecentWorkouts, useStats } from '../progress/hooks';
import { accuracy, earIndex, RANKS, rankFor, skillScores } from '../progress/scoring';
import { gameSkill } from '../progress/store';
import { previousDateKey, workoutDateKey } from '../workout/workout';

function Sparkline({ points, label }: { points: number[]; label: string }) {
  if (points.length < 2) {
    return <div className="mt-4 grid h-[180px] place-items-center rounded-xl bg-surface-2 text-sm text-muted">{label}</div>;
  }
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = Math.max(1, max - min);
  const coords = points.map((v, i) => `${(i / (points.length - 1)) * 600},${170 - ((v - min) / span) * 150}`);
  const last = coords[coords.length - 1]!.split(',');
  return (
    <svg viewBox="0 0 600 180" width="100%" height="180" role="img" aria-label={label} className="mt-4 block">
      <path d="M0 170H600M0 95H600M0 20H600" style={{ stroke: 'var(--surface2)' }} strokeWidth="1" />
      <polyline points={coords.join(' ')} fill="none" stroke="#f4b740" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="5" fill="#f4b740" />
    </svg>
  );
}

export function StatsPage() {
  const profile = useProfile();
  const l = useL();
  const progress = useAllProgress(profile.id!);
  const stats = useStats(profile.id!);
  const workouts = useRecentWorkouts(profile.id!);
  const value = earIndex(progress);
  const rank = rankFor(value);
  const skills = skillScores(progress, gameSkill);
  const playedSkills = Object.entries(skills).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const strongest = playedSkills[0]?.[0] as keyof typeof SKILL_NAMES | undefined;
  const weakest = playedSkills[playedSkills.length - 1]?.[0] as keyof typeof SKILL_NAMES | undefined;

  const board = useLiveQuery(async () => {
    const profiles = await listProfiles();
    return Promise.all(
      profiles.map(async (p) => ({
        id: p.id!,
        name: p.name,
        color: p.color,
        score: earIndex(await db.gameProgress.where('profileId').equals(p.id!).toArray()),
      })),
    );
  }, []) ?? [];
  board.sort((a, b) => b.score - a.score);

  const history = stats.earIndexHistory.slice(-84).map((h) => h.value);
  const firstValue = stats.earIndexHistory[0]?.value ?? 0;

  // 28-day calendar ending today.
  const today = workoutDateKey(new Date(), profile.settings.workoutResetHour ?? 4);
  const days: string[] = [today];
  while (days.length < 28) days.unshift(previousDateKey(days[0]!));
  const byDate = new Map(workouts.map((w) => [w.date, w]));
  const progressById = new Map(progress.map((p) => [p.gameId, p]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="h-display text-[32px] font-bold">{l('Thống kê & hạng', 'Stats & ranks')}</h1>

      <div className="flex flex-wrap gap-6">
        <section className="card min-w-0 flex-[999_1_560px]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="label !mb-0">Ear Index</div>
              <div className="mt-1.5 flex items-baseline gap-3">
                <span className="h-display text-5xl font-bold leading-none">{value}</span>
                {value - firstValue > 0 && <span className="text-sm font-semibold text-good-ink">+{value - firstValue} {l('từ lúc bắt đầu', 'since you started')}</span>}
              </div>
            </div>
            <div className="max-w-[300px] text-[13px] leading-relaxed text-muted">
              {l('Tính từ số level đã qua và độ chính xác ở mọi game. Game chưa chơi thì chưa cộng điểm.', 'Built from levels passed and accuracy in every game. Unplayed games add nothing yet.')}
            </div>
          </div>
          <Sparkline points={history} label={l('Chơi thêm vài ngày để thấy biểu đồ Ear Index', 'Play a few more days to see your Ear Index chart')} />
        </section>

        <section className="card flex flex-[1_1_320px] flex-col gap-2.5">
          <div className="label !mb-0">{l('Thang hạng', 'Ranks')}</div>
          {[...RANKS].reverse().map((r) => (
            <div key={r.id} className={`flex items-center gap-3 rounded-[10px] border px-3 py-2.5 ${r.id === rank.id ? 'bg-surface-2' : 'border-transparent'}`} style={r.id === rank.id ? { borderColor: r.color } : undefined}>
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: r.color }} />
              <span className="flex-1 font-semibold">{l(r.name)}</span>
              <span className="text-[13px] text-muted">{l(`từ ${r.min}`, `from ${r.min}`)}</span>
            </div>
          ))}
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{l('Huy chương hạng chỉ được trao khi bạn hoàn thành workout trong ngày.', 'Rank medals are awarded when you finish a daily workout.')}</p>
        </section>
      </div>

      <LearnStats />

      <div className="flex flex-wrap gap-6">
        <section className="card min-w-0 flex-[999_1_560px]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="h-display text-xl font-bold">{l('Từng game', 'Per game')}</h2>
            {strongest && weakest && strongest !== weakest && (
              <span className="text-[13px] text-muted">
                {l('Điểm mạnh', 'Strongest')} <strong className="text-good-ink">{l(SKILL_NAMES[strongest])}</strong> · {l('Cần luyện', 'Needs work')} <strong className="text-bad-ink">{l(SKILL_NAMES[weakest])}</strong>
              </span>
            )}
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted">
                  <th className="border-b border-line px-3 py-2.5 font-semibold">Game</th>
                  <th className="border-b border-line px-3 py-2.5 font-semibold">Level</th>
                  <th className="border-b border-line px-3 py-2.5 font-semibold">{l('Đã qua', 'Passed')}</th>
                  <th className="border-b border-line px-3 py-2.5 font-semibold">{l('Chính xác', 'Accuracy')}</th>
                  <th className="border-b border-line px-3 py-2.5 font-semibold">{l('Lần chơi', 'Plays')}</th>
                </tr>
              </thead>
              <tbody>
                {GAMES.filter((g) => g.makeQuestion).map((g) => {
                  const p = progressById.get(g.id);
                  return (
                    <tr key={g.id}>
                      <td className="border-b border-surface-2 px-3 py-2.5">
                        <span className="inline-flex items-center gap-2.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SKILL_COLORS[g.skill] }} />{l(g.name)}</span>
                      </td>
                      <td className="border-b border-surface-2 px-3 py-2.5 font-bold">{p?.level ?? 1}</td>
                      <td className="border-b border-surface-2 px-3 py-2.5">{p?.levelsPassed ?? 0}</td>
                      <td className="border-b border-surface-2 px-3 py-2.5">{p ? `${Math.round(accuracy(p) * 100)}%` : '—'}</td>
                      <td className="border-b border-surface-2 px-3 py-2.5 text-muted">{p?.plays ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-[1_1_320px] flex-col gap-6">
          <section className="card">
            <h2 className="h-display mb-3 text-xl font-bold">{l('Bảng xếp hạng trên máy', 'Local leaderboard')}</h2>
            <ol className="flex flex-col gap-2">
              {board.map((p, i) => (
                <li key={p.id} className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 ${p.id === profile.id ? 'bg-surface-2' : ''}`}>
                  <span className="w-5 font-bold text-muted">{i + 1}</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full font-bold text-accent-ink" style={{ background: p.color }}>{p.name.charAt(0).toUpperCase()}</span>
                  <span className="flex-1 font-semibold">{p.name}</span>
                  <span className="h-display font-bold">{p.score}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="card">
            <div className="label">{l('28 ngày gần nhất', 'Last 28 days')}</div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d) => {
                const w = byDate.get(d);
                const full = !!w?.coinsAwarded;
                const part = !full && (w?.completed.length ?? 0) > 0;
                return (
                  <span
                    key={d}
                    title={`${d}: ${full ? l('đủ workout', 'full workout') : part ? l('một phần', 'partial') : l('nghỉ', 'rest')}`}
                    className="aspect-square rounded-md"
                    style={{ background: full ? '#f4b740' : part ? '#f4b74055' : 'var(--surface2)' }}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex gap-3.5 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-accent" />{l('Đủ workout', 'Full workout')}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: '#f4b74055' }} />{l('Một phần', 'Partial')}</span>
            </div>
            <div className="mt-3 text-[13px] text-muted">
              {l(`Chuỗi hiện tại ${stats.streak} · dài nhất ${stats.bestStreak}`, `Current streak ${stats.streak} · best ${stats.bestStreak}`)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
