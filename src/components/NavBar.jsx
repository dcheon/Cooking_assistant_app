import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/auth';

export default function NavBar() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const active = (path) =>
    location.pathname === path
      ? 'text-amber-600 font-semibold'
      : 'text-gray-500 hover:text-amber-500 transition-colors';

  function handleLogout() {
    logout();
    setUser(null);
    navigate('/login');
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="text-xl font-bold text-amber-600 mr-auto">
          🍳 요리 도우미
        </Link>

        <Link to="/" className={`text-sm ${active('/')}`}>홈</Link>
        <Link to="/my-recipes" className={`text-sm ${active('/my-recipes')}`}>내 레시피</Link>
        <Link to="/favorites" className={`text-sm ${active('/favorites')}`}>
          <span className={location.pathname === '/favorites' ? 'text-red-500' : 'text-gray-400 hover:text-red-400 transition-colors'}>
            ♥ 즐겨찾기
          </span>
        </Link>
        <Link
          to="/create"
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-1.5 rounded-full transition-colors"
        >
          + 만들기
        </Link>

        <Link to="/settings" className={`text-lg ${active('/settings')}`} aria-label="설정">⚙️</Link>

        <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
          <span className="text-sm text-gray-600 font-medium">{user?.displayName}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}
