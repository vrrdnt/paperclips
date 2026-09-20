import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import { registerServiceWorker } from './pwa';
import { initializeLocale } from './i18n';
import { initializeDensity } from './browser/density';
import './styles/index.css';

initializeLocale();
initializeDensity();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);

registerServiceWorker();
