import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
// SB Admin 2-inspired: Bootstrap 5 and Icons
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Polyfill for process.env in browser environment
// This ensures compatibility with libraries that expect Node.js globals
if (typeof global === 'undefined') {
  window.global = window;
}

if (typeof process === 'undefined') {
  window.process = {
    env: {
      NODE_ENV: import.meta.env.MODE || 'development',
      // Map Vite environment variables to process.env for compatibility
      ...Object.keys(import.meta.env).reduce((acc, key) => {
        if (key.startsWith('VITE_')) {
          // Map VITE_ prefixed vars to REACT_APP_ for backward compatibility
          const reactKey = key.replace('VITE_', 'REACT_APP_');
          acc[reactKey] = import.meta.env[key];
        }
        acc[key] = import.meta.env[key];
        return acc;
      }, {})
    }
  };
}

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);