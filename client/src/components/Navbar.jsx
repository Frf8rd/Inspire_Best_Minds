import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { notificationsApi } from "../api/notifications.js";
import {
  MapPin,
  PlusCircle,
  Bell,
  User,
  LogOut,
  Shield,
  Briefcase,
  Layers,
  Check,
  CheckCheck,
  Menu,
  X,
} from "lucide-react";

export function Navbar() {
  const { user, logout, unreadCount, refreshNotificationsCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleNotif = async () => {
    const nextState = !showNotifDropdown;
    setShowNotifDropdown(nextState);
    if (nextState && user) {
      try {
        const res = await notificationsApi.getNotifications({ limit: 5 });
        setNotifications(res.notifications || []);
      } catch {
        setNotifications([]);
      }
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      refreshNotificationsCount();
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshNotificationsCount();
    } catch {}
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 5000,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div
        className="container-custom"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "70px",
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            }}
          >
            <MapPin size={22} />
          </div>
          <div>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.03em",
              }}
            >
              Urban<span style={{ color: "#2563eb" }}>Pulse</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
          }}
          className="desktop-nav"
        >
          <Link
            to="/map"
            style={{
              fontWeight: 600,
              color: isActive("/map") ? "#2563eb" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <MapPin size={18} /> Hartă
          </Link>
          <Link
            to="/problems"
            style={{
              fontWeight: 600,
              color: isActive("/problems") ? "#2563eb" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <Layers size={18} /> Sesizări
          </Link>

          {user && (
            <Link
              to="/dashboard"
              style={{
                fontWeight: 600,
                color: isActive("/dashboard") ? "#2563eb" : "#475569",
              }}
            >
              Dashboard
            </Link>
          )}

          {user?.role === "STAFF" && (
            <Link
              to="/staff"
              style={{
                fontWeight: 600,
                color: isActive("/staff") ? "#2563eb" : "#475569",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              <Briefcase size={18} /> Panou Staff
            </Link>
          )}

          {user?.role === "ADMIN" && (
            <Link
              to="/admin"
              style={{
                fontWeight: 600,
                color: isActive("/admin") ? "#2563eb" : "#475569",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              <Shield size={18} /> Admin
            </Link>
          )}
        </div>

        {/* Action Buttons & Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link to="/problems/create" className="btn btn-primary btn-sm">
            <PlusCircle size={18} /> Raportează
          </Link>

          {user ? (
            <>
              {/* Notification Bell */}
              <div ref={notifRef} style={{ position: "relative" }}>
                <button
                  onClick={handleToggleNotif}
                  style={{
                    position: "relative",
                    background: "#f1f5f9",
                    border: "none",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#334155",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-2px",
                        right: "-2px",
                        backgroundColor: "#ef4444",
                        color: "#ffffff",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #ffffff",
                      }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifDropdown && (
                  <div
                    className="animate-fade-in card"
                    style={{
                      position: "absolute",
                      top: "50px",
                      right: 0,
                      width: "340px",
                      zIndex: 6000,
                      padding: "0.875rem",
                      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.75rem",
                        paddingBottom: "0.5rem",
                        borderBottom: "1px solid var(--border-color)",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Notificări</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#2563eb",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <CheckCheck size={14} /> Marchează toate citite
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "1.5rem 0",
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                        }}
                      >
                        Nu ai notificări noi.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setShowNotifDropdown(false);
                              if (n.link) navigate(n.link);
                            }}
                            style={{
                              padding: "0.625rem",
                              borderRadius: "8px",
                              backgroundColor: n.isRead ? "#ffffff" : "#f0f9ff",
                              border: "1px solid",
                              borderColor: n.isRead ? "#f1f5f9" : "#bae6fd",
                              cursor: "pointer",
                              fontSize: "0.825rem",
                              transition: "background 0.15s ease",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontWeight: 700,
                                marginBottom: "2px",
                                color: "#0f172a",
                              }}
                            >
                              <span>{n.title}</span>
                              {!n.isRead && (
                                <button
                                  onClick={(e) => handleMarkAsRead(n.id, e)}
                                  title="Marchează citită"
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#0284c7",
                                    cursor: "pointer",
                                  }}
                                >
                                  <Check size={14} />
                                </button>
                              )}
                            </div>
                            <div style={{ color: "#475569", lineHeight: "1.3" }}>{n.message}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: "0.75rem", textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: "0.5rem" }}>
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifDropdown(false)}
                        style={{ fontSize: "0.8rem", fontWeight: 600, color: "#2563eb" }}
                      >
                        Vezi toate notificările &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu Dropdown */}
              <div ref={profileRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid var(--border-color)",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#334155" }}>
                    {user.name.split(" ")[0]}
                  </span>
                </button>

                {showProfileDropdown && (
                  <div
                    className="animate-fade-in card"
                    style={{
                      position: "absolute",
                      top: "45px",
                      right: 0,
                      width: "200px",
                      zIndex: 6000,
                      padding: "0.5rem",
                      boxShadow: "0 15px 25px -5px rgba(0,0,0,0.12)",
                    }}
                  >
                    <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{user.email}</div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowProfileDropdown(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.85rem",
                        color: "#334155",
                        borderRadius: "6px",
                      }}
                    >
                      <User size={16} /> Profilul meu
                    </Link>

                    <Link
                      to="/my-problems"
                      onClick={() => setShowProfileDropdown(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.85rem",
                        color: "#334155",
                        borderRadius: "6px",
                      }}
                    >
                      <Layers size={16} /> Sesizările mele
                    </Link>

                    <button
                      onClick={logout}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.85rem",
                        color: "#ef4444",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: "6px",
                        textAlign: "left",
                      }}
                    >
                      <LogOut size={16} /> Deconectare
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Autentificare
              </Link>
              <Link to="/register" className="btn btn-outline btn-sm">
                Înregistrare
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
