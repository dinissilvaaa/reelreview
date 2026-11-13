// ============================================================================
// components/Navbar.tsx
// Top navigation bar. On small screens the links collapse into a
// "hamburger" menu that opens and closes with a button.
// ============================================================================

import { useState } from 'react'; // State hook
import { Link, NavLink, useNavigate } from 'react-router-dom'; // Navigation components/hooks
import { useAuth } from '../hooks/useAuth'; // Current user + logout

// Classes for a navigation link (highlighted when its page is active)
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-slate-800 text-amber-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white' // Active vs normal
  }`;

export function Navbar() {
  const { user, isAdmin, logout } = useAuth(); // Auth state
  const navigate = useNavigate(); // Programmatic navigation
  const [menuOpen, setMenuOpen] = useState(false); // Mobile menu open?

  const closeMenu = () => setMenuOpen(false); // Close the mobile menu (after clicking a link)

  // Log out and go back to the home page
  const handleLogout = () => {
    logout(); // Forget the session
    closeMenu(); // Hide the mobile menu
    navigate('/'); // Go home
  };

  // The links, reused by the desktop bar and the mobile menu
  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={closeMenu}>
        Browse
      </NavLink>
      {user && (
        <NavLink to="/my-reviews" className={linkClass} onClick={closeMenu}>
          My reviews
        </NavLink>
      )}
      {isAdmin && (
        <NavLink to="/admin" className={linkClass} onClick={closeMenu}>
          Admin panel
        </NavLink>
      )}
    </>
  );

  // Login/register buttons or user name + logout
  const account = user ? (
    <>
      <span className="px-3 py-2 text-sm text-slate-400">
        Hi, <strong className="text-white">{user.username}</strong>
        {isAdmin && <span className="ml-2 rounded bg-amber-400/20 px-1.5 py-0.5 text-xs text-amber-300">admin</span>}
      </span>
      <button type="button" onClick={handleLogout} className="btn btn-secondary">
        Log out
      </button>
    </>
  ) : (
    <>
      <Link to="/login" className="btn btn-ghost" onClick={closeMenu}>
        Log in
      </Link>
      <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
        Sign up
      </Link>
    </>
  );

  return (
    // sticky = stays at the top while scrolling; backdrop-blur = frosted glass effect
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8" aria-label="Main">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight" onClick={closeMenu}>
          <span aria-hidden="true">🎞️</span>
          <span>
            Reel<span className="text-amber-400">Review</span>
          </span>
        </Link>

        {/* Desktop links (hidden below the md breakpoint) */}
        <div className="hidden items-center gap-1 md:flex">{links}</div>
        <div className="hidden items-center gap-2 md:flex">{account}</div>

        {/* Hamburger button (only on small screens) */}
        <button
          type="button"
          className="btn btn-ghost md:hidden" // Hidden from md up
          onClick={() => setMenuOpen((open) => !open)} // Toggle the menu
          aria-expanded={menuOpen} // Tells screen readers if the menu is open
          aria-controls="mobile-menu" // Which element it controls
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile menu (rendered only when open) */}
      {menuOpen && (
        <div id="mobile-menu" className="flex flex-col gap-1 border-t border-slate-800 px-4 py-3 md:hidden">
          {links}
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">{account}</div>
        </div>
      )}
    </header>
  );
}
