import { createContext, useContext, useState, useEffect } from 'react';
import { getSession, initUsers } from '../services/auth';
import { initRecipes } from '../services/recipeStore';
import useRecipeStore from '../store/useRecipeStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initUsers();
    initRecipes();
    const session = getSession();
    setUser(session);
    useRecipeStore.getState().init(session?.id ?? null);
    setReady(true);
  }, []);

  // Re-sync Zustand favorites whenever the logged-in user changes
  useEffect(() => {
    if (ready) {
      useRecipeStore.getState().init(user?.id ?? null);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
