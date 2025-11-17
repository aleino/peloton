import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { env } from '@/config/env';

if (env.VITE_ENABLE_DEBUG_MODE) {
  console.log('Environment loaded:', {
    apiUrl: env.VITE_API_BASE_URL,
    locale: env.VITE_DEFAULT_LOCALE,
    env: env.VITE_ENV,
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
