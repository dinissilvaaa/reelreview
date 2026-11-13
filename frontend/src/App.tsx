// ============================================================================
// App.tsx
// Application layout (navbar + page + footer) and client-side routes.
// React Router swaps the page component without reloading the browser (SPA).
// ============================================================================

import { Route, Routes } from 'react-router-dom'; // Routing components
import { Navbar } from './components/Navbar'; // Top bar
import { Footer } from './components/Footer'; // Bottom bar
import { ProtectedRoute } from './components/ProtectedRoute'; // Login/admin guard
import { ScrollToTop } from './components/ScrollToTop'; // Scroll reset on navigation
import { HomePage } from './pages/HomePage'; // /
import { MovieDetailsPage } from './pages/MovieDetailsPage'; // /movies/:id
import { LoginPage } from './pages/LoginPage'; // /login
import { RegisterPage } from './pages/RegisterPage'; // /register
import { MyReviewsPage } from './pages/MyReviewsPage'; // /my-reviews
import { AdminPage } from './pages/AdminPage'; // /admin
import { NotFoundPage } from './pages/NotFoundPage'; // anything else

export default function App() {
  return (
    // Full-height column so the footer sticks to the bottom on short pages
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      {/* Main content, centred with a maximum width and responsive side padding */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} /> {/* Browse / search */}
          <Route path="/movies/:id" element={<MovieDetailsPage />} /> {/* One movie + reviews */}
          <Route path="/login" element={<LoginPage />} /> {/* Log in */}
          <Route path="/register" element={<RegisterPage />} /> {/* Sign up */}
          <Route
            path="/my-reviews"
            element={
              <ProtectedRoute>
                <MyReviewsPage />
              </ProtectedRoute>
            }
          /> {/* Logged-in users only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          /> {/* Admins only */}
          <Route path="*" element={<NotFoundPage />} /> {/* 404 */}
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
