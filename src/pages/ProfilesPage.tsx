import { useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { useProfile } from '../app/ProfileContext';
import {
  createProfile, deleteProfile, listProfiles, renameProfile, setActiveProfile, updateSettings,
} from '../db/profiles';
import type { Profile, ProfileSettings } from '../db/schema';
import { displayNoteName, midiToName } from '../theory';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function ProfileRow({ profile, active, canDelete }: { profile: Profile; active: boolean; canDelete: boolean }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await renameProfile(profile.id!, name);
    setEditing(false);
  };

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-bg"
        style={{ background: profile.color }}
      >
        {profile.name.charAt(0).toUpperCase()}
      </span>
      {editing ? (
        <form onSubmit={save} className="flex min-w-0 flex-1 gap-2">
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={40} />
          <button className="btn btn-primary" type="submit">{t('common.save')}</button>
          <button className="btn" type="button" onClick={() => setEditing(false)}>{t('common.cancel')}</button>
        </form>
      ) : (
        <>
          <span className="min-w-24 flex-1 truncate font-medium">{profile.name}</span>
          {active ? (
            <span className="rounded-full bg-good/15 px-2 py-0.5 text-xs font-semibold text-good">{t('common.active')}</span>
          ) : (
            <button className="btn" type="button" onClick={() => void setActiveProfile(profile.id!)}>
              {t('common.use')}
            </button>
          )}
          <button className="btn" type="button" onClick={() => setEditing(true)}>{t('common.rename')}</button>
          {canDelete && (
            <button
              className="btn hover:border-bad/60 hover:text-bad"
              type="button"
              onClick={() => {
                if (window.confirm(t('profiles.confirmDelete', { name: profile.name }))) void deleteProfile(profile.id!);
              }}
            >
              {t('common.delete')}
            </button>
          )}
        </>
      )}
    </li>
  );
}

const VOCAL_NOTES = Array.from({ length: 49 }, (_, i) => 36 + i); // C2 … C6

export function ProfilesPage() {
  const { t } = useTranslation();
  const profile = useProfile();
  const profiles = useLiveQuery(() => listProfiles(), []) ?? [];
  const [newName, setNewName] = useState('');
  const s = profile.settings;

  const set = (patch: Partial<ProfileSettings>) => void updateSettings(profile.id!, patch);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const id = await createProfile(newName, { language: s.language });
    await setActiveProfile(id);
    setNewName('');
  };

  const noteLabel = (m: number) => displayNoteName(midiToName(m, s.accidentals), s.noteNaming);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section className="card space-y-4">
        <div>
          <h1 className="text-xl font-semibold">{t('profiles.listTitle')}</h1>
          <p className="text-sm text-muted">{t('profiles.listNote')}</p>
        </div>
        <ul className="space-y-2">
          {profiles.map((p) => (
            <ProfileRow key={p.id} profile={p} active={p.id === profile.id} canDelete={profiles.length > 1} />
          ))}
        </ul>
        <form onSubmit={create} className="flex gap-2">
          <input
            className="field"
            placeholder={t('profiles.newName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={40}
          />
          <button className="btn btn-primary" type="submit" disabled={!newName.trim()}>
            + {t('common.create')}
          </button>
        </form>
      </section>

      <section className="card space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t('profiles.settingsTitle', { name: profile.name })}</h2>
          <Link to="/sound" className="btn btn-sm">{t('nav.sound')}</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('profiles.language')}>
            <select className="field" value={s.language} onChange={(e) => set({ language: e.target.value as 'vi' | 'en' })}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </Field>
          <Field label={s.language === 'vi' ? 'Giao diện' : 'Theme'}>
            <select className="field" value={s.theme ?? 'dark'} onChange={(e) => set({ theme: e.target.value as ProfileSettings['theme'] })}>
              <option value="dark">{s.language === 'vi' ? 'Tối' : 'Dark'}</option>
              <option value="light">{s.language === 'vi' ? 'Sáng' : 'Light'}</option>
            </select>
          </Field>
          <Field label={s.language === 'vi' ? 'Trang phục Yumika' : "Yumika's outfit"}>
            <select className="field" value={s.mascotOutfit ?? 'casual'} onChange={(e) => set({ mascotOutfit: e.target.value as ProfileSettings['mascotOutfit'] })}>
              <option value="casual">{s.language === 'vi' ? 'Áo khoác jean' : 'Denim jacket'}</option>
              <option value="maid">{s.language === 'vi' ? 'Hầu gái' : 'Maid'}</option>
            </select>
          </Field>
          <Field label={t('profiles.instrument')}>
            <select
              className="field"
              value={s.instrument}
              onChange={(e) => set({ instrument: e.target.value as ProfileSettings['instrument'] })}
            >
              <option value="piano">{t('profiles.instruments.piano')}</option>
              <option value="synth">{t('profiles.instruments.synth')}</option>
            </select>
          </Field>
          <Field label={`${t('profiles.volume')} · ${Math.round(s.volume * 100)}%`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={s.volume}
              onChange={(e) => set({ volume: Number(e.target.value) })}
              className="w-full accent-[var(--color-accent)]"
            />
          </Field>
          <Field label={t('profiles.noteNaming')}>
            <select
              className="field"
              value={s.noteNaming}
              onChange={(e) => set({ noteNaming: e.target.value as ProfileSettings['noteNaming'] })}
            >
              <option value="letters">{t('profiles.namings.letters')}</option>
              <option value="solfege">{t('profiles.namings.solfege')}</option>
            </select>
          </Field>
          <Field label={t('profiles.accidentals')}>
            <select
              className="field"
              value={s.accidentals}
              onChange={(e) => set({ accidentals: e.target.value as ProfileSettings['accidentals'] })}
            >
              <option value="sharp">{t('profiles.accidentalOptions.sharp')}</option>
              <option value="flat">{t('profiles.accidentalOptions.flat')}</option>
            </select>
          </Field>
          <Field label={t('profiles.tapLatency')}>
            <input
              type="number"
              className="field"
              min={-200}
              max={200}
              step={5}
              value={s.tapLatencyMs}
              onChange={(e) => set({ tapLatencyMs: Number(e.target.value) || 0 })}
            />
          </Field>
        </div>
        <fieldset className="space-y-2">
          <legend className="label">{t('profiles.vocalRange')}</legend>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('profiles.vocalLow')}>
              <select
                className="field"
                value={s.vocalRange.low}
                onChange={(e) => set({ vocalRange: { ...s.vocalRange, low: Number(e.target.value) } })}
              >
                {VOCAL_NOTES.filter((m) => m < s.vocalRange.high - 4).map((m) => (
                  <option key={m} value={m}>{noteLabel(m)}</option>
                ))}
              </select>
            </Field>
            <Field label={t('profiles.vocalHigh')}>
              <select
                className="field"
                value={s.vocalRange.high}
                onChange={(e) => set({ vocalRange: { ...s.vocalRange, high: Number(e.target.value) } })}
              >
                {VOCAL_NOTES.filter((m) => m > s.vocalRange.low + 4).map((m) => (
                  <option key={m} value={m}>{noteLabel(m)}</option>
                ))}
              </select>
            </Field>
          </div>
        </fieldset>
      </section>
    </div>
  );
}
