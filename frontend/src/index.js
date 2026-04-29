import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const enableServiceWorkerInDev = process.env.REACT_APP_ENABLE_SW_DEV === 'true';
    const shouldRegisterServiceWorker = process.env.NODE_ENV === 'production' || enableServiceWorkerInDev;

    if (shouldRegisterServiceWorker) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
      return;
    }

    // Avoid stale caches and HMR issues during local development.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  });
}
