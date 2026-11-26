import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { audio } from '../audio/engine';
import { ensureActiveProfile, getActiveProfile } from '../db/profiles';
import type { Profile } from '../db/schema';
import i18n from '../i18n';

const ProfileContext = createContext<Profile | null>(null);

/** Loads (or creates) the active profile and applies its settings to i18n and audio. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [bootError, setBootError] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    ensureActiveProfile(i18n.t('profiles.defaultName'))
      .then(() => setBooted(true))
      .catch((err: unknown) => setBootError(String(err)));
  }, []);

  const profile = useLiveQuery(() => (booted ? getActiveProfile() : null), [booted]);
  const settings = profile?.settings;

  useEffect(() => {
    if (!settings) return;
    if (i18n.language !== settings.language) void i18n.changeLanguage(settings.language);
    document.documentElement.lang = settings.language;
    audio.setVolume(settings.volume);
    audio.setInstrument(settings.instrument);
  }, [settings]);

  if (bootError) {
    return (
      <div className="p-8 text-bad">
        Could not open local storage (IndexedDB). Private windows or blocked site data can cause this.
        <pre className="mt-2 text-xs text-muted">{bootError}</pre>
      </div>
    );
  }
  if (!profile) return <div className="p-8 text-muted">…</div>;
  return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>;
}

export function useProfile(): Profile {
  const profile = useContext(ProfileContext);
  if (!profile) throw new Error('useProfile() must be used inside <ProfileProvider>');
  return profile;
}
