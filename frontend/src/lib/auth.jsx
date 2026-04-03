import { createContext, useContext, useState, useCallback } from 'react'
import axios from 'axios'

const STORAGE_KEY = 'jawara_token'

const AuthContext = createContext(null)

function getToken() {
  return localStorage.getItem(STORAGE_KEY)
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken())

  const login = useCallback(async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password })
    const { token: t } = res.data
    localStorage.setItem(STORAGE_KEY, t)
    setToken(t)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
