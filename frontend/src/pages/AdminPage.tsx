// ============================================================================
// pages/AdminPage.tsx
// Admin panel (admin-only route) with two tabs: Movies and Users.
// ============================================================================

import { useState } from 'react'; // State hook
import { useDocumentTitle } from '../hooks/useDocumentTitle'; // Tab title
import { AdminMoviesTab } from '../components/admin/AdminMoviesTab'; // Movies management
import { AdminUsersTab } from '../components/admin/AdminUsersTab'; // Users management

type Tab = 'movies' | 'users'; // Available tabs

const TABS: { id: Tab; label: string }[] = [
  { id: 'movies', label: '🎬 Movies' }, // Tab 1
  { id: 'users', label: '👥 Users' }, // Tab 2
];

export function AdminPage() {
  useDocumentTitle('Admin panel'); // Tab title
  const [tab, setTab] = useState<Tab>('movies'); // Selected tab

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Admin panel</h1>
        <p className="mt-1 text-slate-400">Manage the movie catalogue and user accounts.</p>
      </div>

      {/* Tab buttons (ARIA tab pattern for accessibility) */}
      <div role="tablist" aria-label="Admin sections" className="flex gap-2 border-b border-slate-800">
        {TABS.map((item) => (
          <button
            key={item.id}
            id={`tab-${item.id}`} // Referenced by the panel
            type="button"
            role="tab" // It is a tab
            aria-selected={tab === item.id} // Is it the active one?
            aria-controls={`panel-${item.id}`} // Which panel it shows
            onClick={() => setTab(item.id)} // Switch tab
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
              tab === item.id ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Active panel (only one is mounted at a time) */}
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'movies' ? <AdminMoviesTab /> : <AdminUsersTab />}
      </div>
    </div>
  );
}
