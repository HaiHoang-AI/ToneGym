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
import { ToolsPage } from './pages/tools/ToolsPage';
import { PerfectPitchTool, TunerTool, VocalRangeTool } from './pages/tools/MicTools';
import { SightSingingTool, WarmupTool } from './pages/tools/SingingTools';
import { ChordTool, CircleTool, ProgressionTool, ScaleTool } from './pages/tools/TheoryTools';
import { IntervalMemorizerTool, MetronomeTool, PianoRecorderTool } from './pages/tools/PracticeTools';
import { LearnPage, LessonPage } from './pages/LearnPage';
import { ContestPage } from './pages/ContestPage';
import { AwardsPage, ShopPage } from './pages/ShopAwardsPages';

/** Highest build phase merged into this app (gates "coming soon" items). */
export const SHIPPED_PHASE = 7;

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
            <Route path="tools" element={<ToolsPage shipped={SHIPPED_PHASE} />} />
            <Route path="tools/tuner" element={<TunerTool />} />
            <Route path="tools/vocal-range" element={<VocalRangeTool />} />
            <Route path="tools/perfect-pitch" element={<PerfectPitchTool />} />
            <Route path="tools/sight-singing" element={<SightSingingTool />} />
            <Route path="tools/warmup" element={<WarmupTool />} />
            <Route path="tools/progressions" element={<ProgressionTool />} />
            <Route path="tools/circle" element={<CircleTool />} />
            <Route path="tools/scales" element={<ScaleTool />} />
            <Route path="tools/chords" element={<ChordTool />} />
            <Route path="tools/interval-memorizer" element={<IntervalMemorizerTool />} />
            <Route path="tools/piano" element={<PianoRecorderTool />} />
            <Route path="tools/metronome" element={<MetronomeTool />} />
            <Route path="learn" element={<LearnPage />} />
            <Route path="learn/:lessonId" element={<LessonPage />} />
            <Route path="contest" element={<ContestPage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="awards" element={<AwardsPage />} />
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
