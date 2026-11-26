import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProfileProvider } from './app/ProfileContext';
import { Layout } from './app/Layout';
import { SECTIONS } from './app/sections';
import { HomePage } from './pages/HomePage';
import { SoundCheckPage } from './pages/SoundCheckPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { ComingSoonPage } from './pages/ComingSoonPage';

export default function App() {
  return (
    <ProfileProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
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
