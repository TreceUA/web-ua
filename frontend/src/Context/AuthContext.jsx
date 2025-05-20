import { createContext, useContext, useState, useEffect } from 'react';
import { applyUserPreferences } from '../Utils';

const apiUrl = process.env.REACT_APP_API_URL;
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(() => sessionStorage.getItem('userId'));

  const isAuth = !!userId;

  const login = async (id) => {
    sessionStorage.setItem('userId', id);
    setUserId(id);

    try {
      const res = await fetch(`${apiUrl}/api/users/${id}`);
      if (!res.ok) throw new Error();
      const user = await res.json();
      applyUserPreferences({ theme: user.theme, fontSize: user.fontSize });
      localStorage.setItem(
        'userPreferences',
        JSON.stringify({ theme: user.theme, fontSize: user.fontSize })
      );
    } catch (err) {
      console.error("No se pudieron aplicar preferencias tras login:", err);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('userId');
    setUserId(null);
    window.location.href = "${apiUrl}/login"
  };

  // useEffect para recuperar el userId al cargar
  useEffect(() => {
    const storedId = sessionStorage.getItem('userId');
    if (storedId) {
      setUserId(storedId);
    }
  }, [userId]);

  // useEffect para aplicar las preferencias al cargar
  useEffect(() => {
    const storedPrefs = localStorage.getItem('userPreferences');
    if (storedPrefs) {
      const { theme, fontSize } = JSON.parse(storedPrefs);
      console.log(theme, fontSize);
      applyUserPreferences({ theme: theme, fontSize: fontSize });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ userId, isAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
