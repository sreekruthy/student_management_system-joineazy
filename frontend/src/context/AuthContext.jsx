import { createContext, useState, useContext, useCallback } from 'react';
import API from '../services/api';
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');

  return ctx;

}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => {
    try{
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }catch(err){
      return null;
    }
  });

  const setUser = useCallback((userData) => {
    if(userData){
      localStorage.setItem('user', JSON.stringify(userData));
    }else{
      localStorage.removeItem('user');
    }
    setUserState(userData);
  }, []);

  const login = useCallback(async (form) => {
    const res = await API.post('/auth/login', form);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, [setUser]);


  // Centralised register
  const register = useCallback(async (form) => {
    try{
    const res = await API.post('/auth/register', form);

    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));

    setUser(res.data.user);

    return res.data.user;

  } catch(err){
    throw new Error(err.response?.data?.msg || 'Registration failed');
  }
});


  // Centralised logout — one place to clear everything
  const logout = useCallback(async () => {

    try {

      await API.post('/auth/logout'); // clears httpOnly refresh token cookie

    } catch { /* ignore — clear locally regardless */ }

    localStorage.removeItem('token');

    setUser(null);

  }, [setUser]);

  return (

    <AuthContext.Provider value={{ user, setUser, login,register, logout }}>
      {children}
      </AuthContext.Provider>

  );
}