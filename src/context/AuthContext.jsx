import { createContext, useContext, useState, useEffect } from 'react';
import { getSession, initUsers } from '../services/auth';
import { initRecipes } from '../services/recipeStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initUsers();
    initRecipes();
    setUser(getSession());
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
