import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProfileProvider } from './app/ProfileContext';
import { Layout } from './app/Layout';
import { SECTIONS } from './app/sections';
import { GymPage } from './pages/GymPage';
import { GamesPage } from './pages/GamesPage';
import { PlayPage } from './pages/PlayPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { StatsPage } from './pages/StatsPage';
import { SoundCheckPage } from './pages/SoundCheckPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { MelodyPlaygroundPage } from './pages/MelodyPlaygroundPage';
import { SightReadingPlaygroundPage } from './pages/SightReadingPlaygroundPage';

/** Highest build phase merged into this app (gates "coming soon" items). */
export const SHIPPED_PHASE = 4;

export default function App() {
  return (
    <ProfileProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<GymPage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="play/:gameId" element={<PlayPage />} />
            <Route path="exercises" element={<ExercisesPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="playground" element={<PlaygroundPage shipped={SHIPPED_PHASE} />} />
            <Route path="playground/melody" element={<MelodyPlaygroundPage />} />
            <Route path="playground/sight-reading" element={<SightReadingPlaygroundPage />} />
            <Route path="sound" element={<SoundCheckPage />} />
            <Route path="profiles" element={<ProfilesPage />} />
            {SECTIONS.filter((s) => !s.ready).map((s) => (
              <Route key={s.key} path={s.path.slice(1)} element={<ComingSoonPage section={s} />} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProfileProvider>
  );
}
