import React, { useState, useEffect } from "react";
import { notificationsApi } from "../api/notifications.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Bell, CheckCheck, Trash2, Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NotificationsPage() {
  const { refreshNotificationsCount } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getNotifications({ unreadOnly, limit: 50 });
      setNotifications(res.notifications || []);
      refreshNotificationsCount();
    } catch (err) {
      addToast("Nu s-au putut încărca notificările.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const handleMarkAsRead = async (id) => {
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
      addToast("Toate notificările au fost marcate ca citite.", "success");
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      refreshNotificationsCount();
    } catch {}
  };

  return (
    <div className="container-custom" style={{ padding: "2.5rem 1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2.36rem", marginBottom: "0.5rem" }}>
            Centru de Notificări
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.12rem" }}>
            Fii la curent cu toate noutățile despre sesizările tale.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`btn btn-sm ${unreadOnly ? "btn-primary" : "btn-secondary"}`}
          >
            {unreadOnly ? "Afișează toate" : "Doar necitite"}
          </button>
          <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm">
            <CheckCheck size={16} /> Marchează toate citite
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: "1.5rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Se încarcă...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            Nu ai nicio notificare.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "12px",
                  backgroundColor: n.isRead ? "#ffffff" : "#f0f9ff",
                  border: "1px solid",
                  borderColor: n.isRead ? "#e2e8f0" : "#bae6fd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <div
                  style={{ cursor: n.link ? "pointer" : "default", flex: 1 }}
                  onClick={() => {
                    if (!n.isRead) handleMarkAsRead(n.id);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "1.12rem", color: "#0f172a", marginBottom: "2px" }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: "1.03rem", color: "#475569" }}>{n.message}</div>
                  <div style={{ fontSize: "0.89rem", color: "#94a3b8", marginTop: "4px" }}>
                    {new Date(n.createdAt).toLocaleString("ro-RO")}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="btn btn-secondary btn-sm"
                      title="Marchează citită"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: "#ef4444" }}
                    title="Șterge"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
