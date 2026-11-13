// ============================================================================
// main.tsx
// Entry point of the React app: mounts <App /> into <div id="root">.
// ============================================================================

import { StrictMode } from 'react'; // Extra development checks (double-runs effects to find bugs)
import { createRoot } from 'react-dom/client'; // React 18+ rendering API
import { BrowserRouter } from 'react-router-dom'; // Enables client-side routing with real URLs
import { AuthProvider } from './context/AuthProvider'; // Shares the logged-in user with every component
import App from './App'; // The application
import './index.css'; // Global styles (Tailwind)

const rootElement = document.getElementById('root'); // The <div id="root"> from index.html
if (!rootElement) throw new Error('Root element #root not found in index.html'); // Fail loudly if the HTML is wrong

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
