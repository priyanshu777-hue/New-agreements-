import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully handle benign dev environment websocket errors in iframe
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.filename?.includes('@vite/client') ||
      event.message?.includes('WebSocket') ||
      event.message?.includes('failed to fetch')
    ) {
      event.stopImmediatePropagation();
    }
  });
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.message?.includes('WebSocket') ||
      event.reason?.stack?.includes('@vite/client')
    ) {
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);

