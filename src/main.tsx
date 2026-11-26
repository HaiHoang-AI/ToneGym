import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import App from './App';
import { db } from './db/schema';

// Lets the e2e tests seed data (coins, progress) in development builds only.
if (import.meta.env.DEV) (window as unknown as { __earlabDb: typeof db }).__earlabDb = db;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
