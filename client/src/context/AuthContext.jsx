import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/auth.js";
import { notificationsApi } from "../api/notifications.js";

const AuthContext = createContext(null);

function hasSessionCookies() {
  return document.cookie.split("; ").some((cookie) =>
    cookie.startsWith("accessToken=") || cookie.startsWith("refreshToken=")
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Întoarce userul curent (sau null), ca apelanții să poată decide ce urmează.
  const fetchMe = async () => {
    if (!hasSessionCookies()) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const data = await authApi.getMe();
      setUser(data.user);
      if (data.user) {
        fetchUnreadNotificationsCount();
      }
      return data.user || null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadNotificationsCount = async () => {
    try {
      const res = await notificationsApi.getNotifications({ unreadOnly: true, limit: 1 });
      setUnreadCount(res.unreadCount || 0);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  // client.js emite acest eveniment când sesiunea a expirat și refresh-ul a eșuat.
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setUnreadCount(0);
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    setUser(data.user);
    fetchUnreadNotificationsCount();
    return data;
  };

  const register = async (userData) => {
    const data = await authApi.register(userData);
    setUser(data.user);
    fetchUnreadNotificationsCount();
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setUnreadCount(0);
    }
  };

  const updateProfile = async (data) => {
    const updated = await authApi.updateMe(data);
    setUser(updated.user);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        unreadCount,
        login,
        register,
        logout,
        updateProfile,
        refreshUser: fetchMe,
        refreshNotificationsCount: fetchUnreadNotificationsCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
