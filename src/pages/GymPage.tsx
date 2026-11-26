import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../app/ProfileContext';
import { useL } from '../app/useL';
import { GameArt } from '../components/art/GameArt';
import { Teacher, Yumika } from '../components/art/Characters';
import { updateSettings } from '../db/profiles';
import { getGame, playableGames } from '../games/registry';
import { SKILL_COLORS, SKILL_NAMES, SKILLS } from '../games/types';
import { useAllProgress, useStats, useWorkout } from '../progress/hooks';
import { earIndex, nextRank, rankFor, skillScores } from '../progress/scoring';
import { gameSkill, rebuildWorkout } from '../progress/store';
import { WORKOUT_COINS } from '../workout/workout';
import { isoWeekKey, themeFor } from '../contest/contest';
import { LESSONS } from '../learn/course';
import { useToolData } from '../tools/useToolData';

function WorkoutPicker({ onClose }: { onClose: () => void }) {
  const profile = useProfile();
  const l = useL();
  const [picked, setPicked] = useState<string[]>(profile.settings.workoutGames ?? []);
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 5 ? p : [...p, id]));
  const save = async () => {
    await updateSettings(profile.id!, { workoutGames: picked });
    await rebuildWorkout(profile.id!);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={l('Chọn game cho workout', 'Choose workout games')}>
      <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto">
        <h2 className="h-display text-xl font-bold">{l('Chọn game cho workout', 'Choose workout games')}</h2>
        <p className="mt-1 text-sm text-muted">
          {l('Chọn tối đa 5 game. Chỗ còn trống sẽ được điền bằng game bạn đang yếu nhất.', 'Pick up to 5 games. Empty slots are filled with your weakest games.')}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {playableGames().map((g) => {
            const on = picked.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(g.id)}
                className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 text-left text-sm font-medium ${on ? 'border-accent bg-accent/15' : 'border-line bg-surface-2'}`}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: SKILL_COLORS[g.skill] }} />
                <span className="flex-1">{l(g.name)}</span>
                {on && <span className="text-xs font-bold text-link">{picked.indexOf(g.id) + 1}</span>}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn" onClick={() => setPicked([])}>{l('Để tự động', 'Automatic')}</button>
          <button type="button" className="btn" onClick={onClose}>{l('Hủy', 'Cancel')}</button>
          <button type="button" className="btn btn-primary" onClick={() => void save()}>{l('Lưu', 'Save')}</button>
        </div>
      </div>
    </div>
  );
}

export function GymPage() {
  const profile = useProfile();
  const l = useL();
  const stats = useStats(profile.id!);
  const progress = useAllProgress(profile.id!);
  const workout = useWorkout(profile.id!, profile.settings.workoutResetHour ?? 4);
  const [picking, setPicking] = useState(false);
  const week = isoWeekKey(new Date());
  const theme = themeFor(week);
  const [lessonsDone] = useToolData<string[]>('lessons-done', []);
  const nextLesson = LESSONS.find((x) => !lessonsDone.includes(x.id));

  const value = earIndex(progress);
  const rank = rankFor(value);
  const upcoming = nextRank(value);
  const toNext = upcoming ? upcoming.min - value : 0;
  const rankPct = upcoming ? Math.round(((value - rank.min) / (upcoming.min - rank.min)) * 100) : 100;
  const skills = skillScores(progress, gameSkill);
  const shownSkills = SKILLS.filter((s) => playableGames().some((g) => g.skill === s) || skills[s] > 0);
  const weakest = shownSkills.reduce((a, b) => (skills[b] < skills[a] ? b : a), shownSkills[0]!);

  const games = workout?.games ?? [];
  const done = workout?.completed ?? [];
  const nextGame = games.find((g) => !done.includes(g));
  const finished = !!workout?.coinsAwarded;
  const remaining = games.length - done.length;
  const progressMap = new Map(progress.map((p) => [p.gameId, p]));
  const today = new Date().toLocaleDateString(l.lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', day: '2-digit', month: '2-digit' });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center gap-4 rounded-[20px] border border-line bg-surface px-5 py-3.5">
        <Yumika mood={finished ? 'cheer' : 'wave'} size={92} outfit={profile.settings.mascotOutfit ?? 'casual'} />
        <div className="min-w-0 flex-[1_1_280px]">
          <div className="inline-block rounded-[18px_18px_18px_4px] border border-line bg-surface-2 px-4 py-3">
            <div className="h-display text-xl font-bold">
              {l(`Chào ${profile.name}! Yumika đây nè ~`, `Hi ${profile.name}! It's Yumika ~`)}
            </div>
            <div className="mt-1 text-[15px] leading-relaxed text-muted">
              {finished
                ? l(`Xong workout hôm nay rồi, giỏi quá! Chuỗi ${stats.streak} ngày, mai gặp lại nhé.`, `Today's workout is done, great job! ${stats.streak}-day streak, see you tomorrow.`)
                : nextGame
                  ? l(`Hôm nay mình luyện ${l(getGame(nextGame)!.name).toLowerCase()} nhé. Còn ${remaining} game nữa là xong workout!`, `Let's practise ${l(getGame(nextGame)!.name)} today. ${remaining} more games to finish the workout!`)
                  : l('Đang chuẩn bị workout…', 'Preparing your workout…')}
            </div>
          </div>
        </div>
        {nextGame && (
          <Link className="btn btn-primary" to={`/play/${nextGame}?workout=1`}>{l('Bắt đầu thôi!', "Let's go!")}</Link>
        )}
      </section>

      <div className="flex flex-wrap items-stretch gap-6">
        <section className="card flex min-w-0 flex-[999_1_640px] flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="label !mb-0">{today} · {l(`đổi bài lúc ${profile.settings.workoutResetHour ?? 4}:00`, `new workout at ${profile.settings.workoutResetHour ?? 4}:00`)}</div>
              <h1 className="h-display mt-1.5 text-[32px] font-bold">{l('Workout hôm nay', "Today's workout")}</h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted">
                {l('Đã xong', 'Done')} <strong className="text-ink">{done.length} / {games.length}</strong> game
              </div>
              <div className="mt-2 h-2 w-[220px] overflow-hidden rounded-full bg-surface-2">
                <div className="h-full bg-accent" style={{ width: `${games.length ? (done.length / games.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {games.map((id) => {
              const g = getGame(id)!;
              const isDone = done.includes(id);
              const isNext = id === nextGame;
              const p = progressMap.get(id);
              return (
                <Link
                  key={id}
                  to={`/play/${id}?workout=1`}
                  className={`flex flex-col gap-2 rounded-[14px] border bg-surface-2 p-3 text-ink no-underline transition hover:border-accent ${isNext ? 'border-accent' : 'border-line'} ${isDone ? 'opacity-70' : ''}`}
                >
                  <div className="overflow-hidden rounded-[10px]">
                    <GameArt skill={g.skill} variant={g.art.variant} mark={g.art.mark} height={96} />
                  </div>
                  <div className="text-[15px] font-semibold leading-snug">{l(g.name)}</div>
                  <div className="text-[13px] text-muted">{l(SKILL_NAMES[g.skill])} · Lv {p?.level ?? 1}</div>
                  <div
                    className={`mt-auto self-start rounded-full px-2.5 py-1 text-xs font-bold ${
                      isDone ? 'bg-good/15 text-good-ink' : isNext ? 'bg-accent text-accent-ink' : 'bg-bg text-muted'
                    }`}
                  >
                    {isDone ? l('Đã xong', 'Done') : isNext ? l('Chơi ngay', 'Play now') : l('Tiếp theo', 'Up next')}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {nextGame && (
              <Link className="btn btn-primary" to={`/play/${nextGame}?workout=1`}>
                {l(`Chơi tiếp: ${l(getGame(nextGame)!.name)}`, `Next: ${l(getGame(nextGame)!.name)}`)}
              </Link>
            )}
            <button type="button" className="btn" onClick={() => setPicking(true)}>{l('Chọn game cho workout', 'Choose workout games')}</button>
            <span className="text-[13px] text-muted">
              {finished
                ? l(`Đã nhận +${WORKOUT_COINS} xu hôm nay`, `+${WORKOUT_COINS} coins earned today`)
                : l(`Xong cả ${games.length} game: +${WORKOUT_COINS} xu và giữ chuỗi ngày`, `Finish all ${games.length}: +${WORKOUT_COINS} coins and keep your streak`)}
            </span>
          </div>
        </section>

        <section className="card flex flex-[1_1_300px] flex-col gap-4">
          <div className="label !mb-0">Ear Index</div>
          <div className="flex items-baseline gap-3">
            <span className="h-display text-[56px] font-bold leading-none">{value}</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
            <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
              <circle cx="20" cy="22" r="13" fill="none" stroke={rank.color} strokeWidth="3" />
              <path d="M13 4l7 9 7-9" fill="none" stroke={rank.color} strokeWidth="3" strokeLinejoin="round" />
            </svg>
            <div className="flex-1">
              <div className="font-bold">{l(`Hạng ${rank.name.vi}`, `${rank.name.en} rank`)}</div>
              <div className="text-[13px] text-muted">
                {upcoming ? l(`Còn ${toNext} điểm lên ${upcoming.name.vi}`, `${toNext} points to ${upcoming.name.en}`) : l('Hạng cao nhất!', 'Top rank!')}
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg">
                <div className="h-full" style={{ width: `${rankPct}%`, background: rank.color }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-surface-2 p-3"><div className="label !mb-0">{l('Chuỗi ngày', 'Streak')}</div><div className="h-display mt-1 text-2xl font-bold">{stats.streak}</div></div>
            <div className="rounded-xl bg-surface-2 p-3"><div className="label !mb-0">Workout</div><div className="h-display mt-1 text-2xl font-bold">{stats.workoutsDone}</div></div>
          </div>
          <Link to="/stats" className="text-sm font-semibold text-link">{l('Xem thống kê đầy đủ →', 'See full stats →')}</Link>
        </section>
      </div>

      <div className="flex flex-wrap gap-6">
        <section className="card min-w-0 flex-[999_1_560px]">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="h-display text-xl font-bold">{l('Kỹ năng của bạn', 'Your skills')}</h2>
            <span className="text-[13px] text-muted">{l('Workout ngày mai ưu tiên kỹ năng yếu nhất', "Tomorrow's workout favours your weakest skill")}</span>
          </div>
          <div className="mt-4 grid gap-x-7 gap-y-3.5 sm:grid-cols-2">
            {shownSkills.map((s) => (
              <div key={s} className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ background: SKILL_COLORS[s] }} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-sm">
                    <span>{l(SKILL_NAMES[s])}</span>
                    <span className={`font-bold ${s === weakest ? 'text-bad-ink' : ''}`}>{skills[s]}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full" style={{ width: `${skills[s]}%`, background: SKILL_COLORS[s] }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-[1_1_300px] flex-col gap-6">
          <section className="card flex flex-col gap-3">
            <div className="label !mb-0">{l('Thử thách tuần', 'Weekly challenge')} · {week}</div>
            <h2 className="h-display text-xl font-bold">{l(theme.name)}</h2>
            <p className="text-sm leading-relaxed text-muted">
              {l(`60 giây ${l(getGame(theme.gameId)!.name).toLowerCase()}, đấu với kỷ lục của bạn và các hồ sơ trên máy.`, `60 seconds of ${l(getGame(theme.gameId)!.name)} against your record and other local profiles.`)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link className="btn self-start" to="/contest">{l('Vào thi · 4 xu', 'Enter · 4 coins')}</Link>
              <Link className="btn btn-sm self-center" to="/shop">{l('Cửa hàng', 'Shop')}</Link>
              <Link className="btn btn-sm self-center" to="/awards">{l('Giải thưởng', 'Awards')}</Link>
            </div>
          </section>
          <section className="card flex flex-col gap-3" id="hoc">
            <div className="flex items-center gap-3">
              <Teacher mood="wave" size={72} />
              <div>
                <div className="label !mb-0">{l('Khóa nhạc lý', 'Theory course')}</div>
                <h2 className="h-display mt-1 text-xl font-bold">{nextLesson ? l(nextLesson.title) : l('Đã học xong cả khóa!', 'Course complete!')}</h2>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-teal" style={{ width: `${(lessonsDone.length / LESSONS.length) * 100}%` }} /></div>
            <Link to={nextLesson ? `/learn/theory/${nextLesson.id}` : '/awards'} className="text-sm font-semibold text-link">
              {nextLesson ? l(`Học tiếp bài ${lessonsDone.length + 1}/${LESSONS.length} →`, `Continue lesson ${lessonsDone.length + 1}/${LESSONS.length} →`) : l('Xem chứng chỉ →', 'See your certificate →')}
            </Link>
          </section>
        </div>
      </div>
      {picking && <WorkoutPicker onClose={() => setPicking(false)} />}
    </div>
  );
}
