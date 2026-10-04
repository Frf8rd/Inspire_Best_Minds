import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

// Backendul redirecționează aici după login Google (cookie-urile sunt deja setate).
// Parametrul ?user=... conține date personale în URL, deci nu îl folosim și îl scoatem
// din istoric; luăm userul din /auth/me.
export function GoogleSuccessPage() {
  const { refreshUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      const user = await refreshUser();
      if (user) {
        addToast("Autentificare reușită cu Google!", "success");
        navigate("/", { replace: true });
      } else {
        navigate("/login?error=server_error", { replace: true });
      }
    })();
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
      Se finalizează autentificarea...
    </div>
  );
}
