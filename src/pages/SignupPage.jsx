import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../services/auth';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [username, setUsername]           = useState('');
  const [password, setPassword]           = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName]     = useState('');
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    const { data: session, error: signupError } = await signup(
      username.trim(),
      password,
      displayName.trim() || username.trim()
    );
    setLoading(false);

    if (session) {
      setUser(session);
      navigate('/');
    } else {
      setError(signupError ?? '회원가입에 실패했습니다.');
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🍳</div>
          <h1 className="text-2xl font-bold text-gray-800">회원가입</h1>
          <p className="text-gray-400 text-sm mt-1">요리 도우미 계정 만들기</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">아이디</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="영문·숫자"
              autoComplete="username"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300
                         focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">닉네임</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="화면에 표시될 이름 (선택)"
              autoComplete="nickname"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300
                         focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="최소 4자"
              autoComplete="new-password"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300
                         focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">비밀번호 확인</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 재입력"
              autoComplete="new-password"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300
                         focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60
                       text-white font-bold rounded-xl transition active:scale-95 mt-2"
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-amber-600 font-semibold hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
