import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSession, initUsers } from '../services/auth';
import { initRecipes } from '../services/recipeStore';
import useRecipeStore from '../store/useRecipeStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [ready, setReady] = useState(false);

  const setUser = useCallback((session) => {
    useRecipeStore.getState().init(session?.id ?? null);
    setUserState(session);
  }, []);

  useEffect(() => {
    (async () => {
      await initUsers();
      initRecipes();
      const { data: session } = getSession();
      setUser(session);
      setReady(true);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
