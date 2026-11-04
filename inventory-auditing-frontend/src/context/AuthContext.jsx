import { createContext, useState, useEffect, useRef } from "react";
import { API_URL } from "../api.js";

const AuthContext = createContext();

function decodeToken(token) {
  if (!token) return null;
  const payload = token.split(".")[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64));
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  useEffect(() => {
    async function refresh() {
      try {
        const response = await fetch(`${API_URL}/refresh`, {
          method: "POST",
          credentials: "include",
        });

        const data = await response.json();
        if (response.ok) {
          setToken(data.token);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }

    if (hasRun.current) return;
    hasRun.current = true;
    refresh();
  }, []);

  const user = decodeToken(token);
  const role = user?.role;
  const userId = user?.userId;

  const refreshPromise = useRef(null);

  async function authFetch(url, options = {}) {
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (response.status === 401) {
      if (!refreshPromise.current) {
        refreshPromise.current = fetch(`${API_URL}/refresh`, {
          method: "POST",
          credentials: "include",
        })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              setToken(data.token);
              return data.token;
            }
            return null;
          })
          .finally(() => {
            refreshPromise.current = null;
          });
      }

      const newToken = await refreshPromise.current;

      if (newToken) {
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
          credentials: "include",
        });
      }
    }

    return response;
  }

  return (
    <AuthContext.Provider
      value={{ token, setToken, loading, setLoading, role, userId, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
