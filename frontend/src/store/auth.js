import { createContext, useContext, useState } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,   setUser]   = useState(() => { try { return JSON.parse(localStorage.getItem('user'));   } catch { return null; } });
  const [tenant, setTenant] = useState(() => { try { return JSON.parse(localStorage.getItem('tenant')); } catch { return null; } });

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user, tenant, token } = res.data.data;
    localStorage.setItem('token',  token);
    localStorage.setItem('user',   JSON.stringify(user));
    localStorage.setItem('tenant', JSON.stringify(tenant));
    setUser(user);
    setTenant(tenant);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider value={{ user, tenant, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
