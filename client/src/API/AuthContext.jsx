import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Load user on refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.message && !parsed.companyRole) {
          // Bad session cached from raw login. Try pulling from backend
          import('./authApi').then(({ getSession }) => {
            getSession().then(sessionData => {
              localStorage.setItem("user", JSON.stringify(sessionData));
              setUser(sessionData);
              setLoading(false);
            }).catch(() => {
              localStorage.removeItem("user");
              setUser(null);
              setLoading(false);
            });
          });
          return; // Don't setLoading(false) yet
        }
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData); // 🚀 triggers Nav re-render
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null); // 🚀 triggers Nav re-render
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// custom hook (clean AF)
export const useAuth = () => useContext(AuthContext);
