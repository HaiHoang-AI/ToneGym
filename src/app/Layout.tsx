import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { updateSettings } from '../db/profiles';
import { SECTIONS } from './sections';
import { useProfile } from './ProfileContext';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
    isActive ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink'
  }`;

export function Layout() {
  const { t } = useTranslation();
  const profile = useProfile();
  const nextLang = profile.settings.language === 'vi' ? 'en' : 'vi';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            <span>{t('app.name')}</span>
          </NavLink>
          <nav className="ml-2 flex min-w-0 flex-1 gap-1 overflow-x-auto" aria-label={t('nav.menu')}>
            <NavLink to="/" end className={navClass}>
              {t('nav.home')}
            </NavLink>
            {SECTIONS.map((s) => (
              <NavLink key={s.key} to={s.path} className={navClass}>
                {t(`nav.${s.key}`)}
                {!s.ready && <span className="ml-1 text-[10px] text-muted/70">·{s.phase}</span>}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            className="btn px-2.5 py-1.5 text-xs uppercase"
            onClick={() => void updateSettings(profile.id!, { language: nextLang })}
            title={nextLang === 'en' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
          >
            {nextLang}
          </button>
          <NavLink
            to="/profiles"
            className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-sm hover:border-accent/60"
            title={t('nav.profiles')}
          >
            <span
              className="grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-bg"
              style={{ background: profile.color }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </span>
            <span className="hidden max-w-28 truncate sm:inline">{profile.name}</span>
          </NavLink>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
