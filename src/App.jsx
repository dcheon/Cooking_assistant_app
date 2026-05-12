import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import CookingModePage from './pages/CookingModePage';
import CreateRecipePage from './pages/CreateRecipePage';
import MyRecipesPage from './pages/MyRecipesPage';
import FavoritesPage from './pages/FavoritesPage';

function Guard({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-amber-50">
      {user && <NavBar />}
      <main className="max-w-2xl mx-auto px-4 py-6 fade-in">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/"            element={<Guard><HomePage /></Guard>} />
          <Route path="/recipe/:id"  element={<Guard><RecipeDetailPage /></Guard>} />
          <Route path="/cook/:id"    element={<Guard><CookingModePage /></Guard>} />
          <Route path="/create"      element={<Guard><CreateRecipePage /></Guard>} />
          <Route path="/my-recipes"  element={<Guard><MyRecipesPage /></Guard>} />
          <Route path="/favorites"   element={<Guard><FavoritesPage /></Guard>} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
