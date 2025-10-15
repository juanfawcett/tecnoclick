import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { user } = await api(`${process.env.API_URL}/api/`);
        setUser(user);
      } catch {}
      setLoading(false);
    })();
  }, []);

  async function login(email, password) {
    const data = await api(`${process.env.API_URL}/api/`, {
      method: 'POST',
      body: { email, password },
    });
    setUser(data.user);
  }
  async function register({ name, email, password }) {
    const data = await api(`${process.env.API_URL}/api/`, {
      method: 'POST',
      body: { name, email, password },
    });
    setUser(data.user);
  }
  async function logout() {
    await api(`${process.env.API_URL}/api/`, { method: 'POST' });
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, register, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
