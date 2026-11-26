import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { updateSettings } from '../db/profiles';
import { useStats } from '../progress/hooks';
import { SECTIONS } from './sections';
import { useProfile } from './ProfileContext';
import { useL } from './useL';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'
  }`;

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} />
      <g fill="none" strokeLinecap="round" strokeWidth="5">
        <path d="M14 32h4" stroke="#39d0c0" />
        <path d="M24 24v16" stroke="#39d0c0" />
        <path d="M32 16v32" stroke="#f4b740" />
        <path d="M40 22v20" stroke="#39d0c0" />
        <path d="M48 28v8" stroke="#39d0c0" />
      </g>
    </svg>
  );
}

export function ThemeToggle() {
  const profile = useProfile();
  const l = useL();
  const dark = (profile.settings.theme ?? 'dark') === 'dark';
  const label = dark ? l('Chuyển sang chế độ sáng', 'Switch to light mode') : l('Chuyển sang chế độ tối', 'Switch to dark mode');
  return (
    <button
      type="button"
      onClick={() => void updateSettings(profile.id!, { theme: dark ? 'light' : 'dark' })}
      aria-label={label}
      title={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface-2 text-ink hover:border-accent"
    >
      {dark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </svg>
      )}
    </button>
  );
}

export function Layout() {
  const profile = useProfile();
  const stats = useStats(profile.id!);
  const l = useL();
  const location = useLocation();
  const nextLang = profile.settings.language === 'vi' ? 'en' : 'vi';
  // The play screen is full-focus and draws its own top bar.
  const focus = location.pathname.startsWith('/play/');

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      {!focus && (
        <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1216px] flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
            <NavLink to="/" className="flex items-center gap-2.5 text-ink no-underline">
              <Logo />
              <span className="h-display text-[19px] font-bold">EarLab</span>
            </NavLink>
            <nav className="order-last flex w-full gap-0.5 overflow-x-auto sm:order-none sm:w-auto sm:flex-1" aria-label={l('Menu chính', 'Main menu')}>
              {SECTIONS.map((s) => (
                <NavLink key={s.key} to={s.path} end={s.path === '/'} className={navClass}>
                  {l(s.name)}
                  {!s.ready && <span className="ml-1 text-[10px] text-muted">·{s.phase}</span>}
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <span title={l('Chuỗi ngày', 'Day streak')} className="hidden items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm font-semibold sm:inline-flex">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 3" />
                </svg>
                {stats.streak}
              </span>
              <span title={l('Xu', 'Coins')} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f4b740" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" />
                </svg>
                {stats.coins.toLocaleString(l.lang === 'vi' ? 'vi-VN' : 'en-US')}
              </span>
              <ThemeToggle />
              <button
                type="button"
                className="grid h-10 min-w-10 place-items-center rounded-full border border-line bg-surface-2 px-2 text-xs font-bold uppercase hover:border-accent"
                onClick={() => void updateSettings(profile.id!, { language: nextLang })}
                title={nextLang === 'en' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
              >
                {nextLang}
              </button>
              <NavLink
                to="/profiles"
                aria-label={l(`Hồ sơ: ${profile.name}`, `Profile: ${profile.name}`)}
                className="grid h-10 w-10 place-items-center rounded-full border-2 border-line text-[15px] font-bold text-accent-ink"
                style={{ background: profile.color }}
              >
                {profile.name.charAt(0).toUpperCase()}
              </NavLink>
            </div>
          </div>
        </header>
      )}
      <main className={focus ? 'flex flex-1 flex-col' : 'mx-auto w-full max-w-[1216px] flex-1 px-4 py-6 sm:px-8 sm:py-8'}>
        <Outlet />
      </main>
    </div>
  );
}
