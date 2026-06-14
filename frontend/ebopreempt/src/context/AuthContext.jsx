import { createContext, useContext, useState, useEffect } from 'react';
import { isAuthenticated as checkAuth, logout as doLogout } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth());

  useEffect(() => {
    setIsAuthenticated(checkAuth());
  }, []);

  const login = () => setIsAuthenticated(true);

  const logout = () => {
    doLogout();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
