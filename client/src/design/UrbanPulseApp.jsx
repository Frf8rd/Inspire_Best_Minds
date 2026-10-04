import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { ProtectedRoute, PublicRoute } from "../components/ProtectedRoute.jsx";
import { AdminDashboardPage } from "../pages/AdminDashboardPage.jsx";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage.jsx";
import { GoogleSuccessPage } from "../pages/GoogleSuccessPage.jsx";
import { MyProblemsPage } from "../pages/MyProblemsPage.jsx";
import { NotificationsPage } from "../pages/NotificationsPage.jsx";
import { ProblemDetailsPage } from "../pages/ProblemDetailsPage.jsx";
import { ResetPasswordPage } from "../pages/ResetPasswordPage.jsx";
import { StaffDashboardPage } from "../pages/StaffDashboardPage.jsx";
import { TransparencyPage } from "../pages/TransparencyPage.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import ProblemDetails from "./components/ProblemDetails.jsx";
import PreferenceControls from "./components/PreferenceControls.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import MapPage from "./pages/MapPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import { TRANSLATIONS } from "./data/translations.js";
import { api } from "./services/api.js";

const ROUTE_PAGE = {
  "/": "home",
  "/map": "map",
  "/report": "report",
  "/problems/create": "report",
  "/profile": "profile",
  "/problems": "map",
  "/my-problems": "my-problems",
  "/notifications": "notifications",
  "/staff": "staff",
  "/admin": "admin",
};

function readPreference(key, fallback, acceptedValues) {
  try {
    const value = localStorage.getItem(key);
    return acceptedValues.includes(value) ? value : fallback;
  } catch (error) {
    console.error(`Unable to read ${key} preference`, error);
    return fallback;
  }
}

function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    phone: user.phone || "",
    role: ["STAFF", "ADMIN", "emp"].includes(user.role) ? "emp" : "cit",
    serverRole: user.role,
  };
}

export default function UrbanPulseApp() {
  const { user: account, loading, login, register, logout, updateProfile, unreadCount } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const user = normalizeUser(account);
  const accountId = account?.id;
  const accountName = account?.name;
  const [reports, setReports] = useState([]);
  const [myReportsState, setMyReportsState] = useState({ userId: null, items: [] });
  const [supportedReports, setSupportedReports] = useState({});
  const [categories, setCategories] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [locale, setLocale] = useState(() => readPreference("up_locale", "ro", ["ro", "ru"]));
  const [theme, setTheme] = useState(() => readPreference("up_theme", "light", ["light", "dark"]));
  const path = location.pathname;
  const t = useCallback(
    (key) => TRANSLATIONS[locale]?.[key] || TRANSLATIONS.ro[key] || key,
    [locale],
  );

  const savePreference = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Unable to save ${key} preference`, error);
      addToast("Preferința nu a putut fi salvată pe acest dispozitiv.", "warning");
    }
  };

  const changeLocale = (value) => {
    setLocale(value);
    savePreference("up_locale", value);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    savePreference("up_theme", nextTheme);
  };

  const refreshReports = useCallback(async () => {
    try {
      setReports(await api.list());
    } catch (error) {
      addToast(error.message || "Sesizările nu au putut fi încărcate.", "error");
    }
  }, [addToast]);

  const refreshMyReports = useCallback(async () => {
    if (!accountId) return;
    try {
      const items = await api.listMine(accountName);
      setMyReportsState({ userId: accountId, items });
    } catch (error) {
      addToast(error.message || "Sesizările tale nu au putut fi încărcate.", "error");
    }
  }, [accountId, accountName, addToast]);

  const openReport = useCallback((id) => {
    setSelectedId(id);
    if (!user?.id) return;
    api.getProblem(id)
      .then((report) => {
        setSupportedReports((current) => ({ ...current, [id]: report.isSupported }));
      })
      .catch((error) => {
        addToast(error.message || "Detaliile sesizării nu au putut fi încărcate.", "error");
      });
  }, [addToast, user?.id]);

  const openReportOnMap = useCallback((id) => {
    setSelectedId(null);
    navigate(`/map?report=${encodeURIComponent(id)}`);
  }, [navigate]);

  useEffect(() => {
    api.getCategories()
      .then(setCategories)
      .catch((error) => {
        console.error("Unable to load report categories", error);
        addToast(error.message || "Categoriile nu au putut fi încărcate.", "error");
      });
  }, [addToast]);

  useEffect(() => {
    let active = true;
    api.list()
      .then((items) => {
        if (active) setReports(items);
      })
      .catch((error) => {
        if (active) addToast(error.message || "Sesizările nu au putut fi încărcate.", "error");
      });
    return () => {
      active = false;
    };
  }, [addToast]);

  useEffect(() => {
    if (!account?.id) return undefined;
    let active = true;
    api.listMine(account.name)
      .then((items) => {
        if (active) setMyReportsState({ userId: account.id, items });
      })
      .catch((error) => {
        if (active) addToast(error.message || "Sesizările tale nu au putut fi încărcate.", "error");
      });
    return () => {
      active = false;
    };
  }, [account?.id, account?.name, addToast]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "dark" ? "#202329" : "#f3f4f6",
    );
  }, [theme, locale]);

  useEffect(() => {
    document.body.classList.toggle("auth", !accountId);
  }, [accountId]);

  const actions = useMemo(() => ({
    login: async (email, password) => (await login({ email, password })).user,
    register: async (accountData) => (await register(accountData)).user,
    logout: async () => {
      await logout();
    },
    create: async (report) => {
      const created = await api.create(report);
      await refreshReports();
      await refreshMyReports();
      return created;
    },
    confirm: async (id) => {
      const result = await api.confirm(id);
      setSupportedReports((current) => ({ ...current, [id]: result.supported }));
      await refreshReports();
      await refreshMyReports();
      return result;
    },
    setStatus: async (id, status) => {
      await api.setStatus(id, status);
      await refreshReports();
      await refreshMyReports();
    },
    updateProfile,
  }), [login, logout, refreshMyReports, refreshReports, register, updateProfile]);

  const routePage =
    ROUTE_PAGE[path]
    || (path.startsWith("/analytics/transparency/") ? "transparency" : "")
    || (path.startsWith("/problems/") ? "problems" : "home");
  const selectedReportData = reports.find((report) => report.id === selectedId);
  const selectedReport = selectedReportData
    ? { ...selectedReportData, isSupported: supportedReports[selectedId] ?? false }
    : null;
  const displayUser = user || { name: "Vizitator", role: "cit", phone: "" };
  const pageProps = {
    reports,
    myReports: myReportsState.userId === account?.id ? myReportsState.items : [],
    categories,
    openReport,
    locale,
    t,
  };
  const isAuthUtility = [
    "/forgot-password",
    "/reset-password",
    "/auth/google/success",
  ].includes(path);

  if (loading && !isAuthUtility) {
    return <main className="auth-loading" aria-live="polite">Se verifică sesiunea...</main>;
  }

  if (path === "/login" || path === "/register") {
    if (user) return <Navigate to="/" replace />;
    return (
      <>
        <PreferenceControls
          locale={locale}
          onLocaleChange={changeLocale}
          theme={theme}
          onThemeToggle={toggleTheme}
          t={t}
        />
        <AuthPage
          actions={actions}
          t={t}
          initialMode={path === "/register" ? "register" : "login"}
          onExit={() => navigate("/", { replace: true })}
        />
      </>
    );
  }

  if (isAuthUtility) {
    return (
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/google/success" element={<GoogleSuccessPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <PreferenceControls
        locale={locale}
        onLocaleChange={changeLocale}
        theme={theme}
        onThemeToggle={toggleTheme}
        t={t}
      />
      <DashboardLayout
        activePage={routePage}
        user={displayUser}
        onLogout={user ? actions.logout : () => navigate("/login")}
        isGuest={!user}
        unreadCount={unreadCount}
        t={t}
      >
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <HomePage {...pageProps} onSelectReport={openReportOnMap} user={user} />
              </PublicRoute>
            }
          />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/map" element={<PublicRoute><MapPage {...pageProps} /></PublicRoute>} />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportPage
                  actions={actions}
                  t={t}
                  locale={locale}
                  user={user}
                  categories={categories}
                  onRequireAuth={() => navigate("/login")}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/problems/create"
            element={
              <ProtectedRoute>
                <ReportPage
                  actions={actions}
                  t={t}
                  locale={locale}
                  user={user}
                  categories={categories}
                  onRequireAuth={() => navigate("/login")}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage {...pageProps} user={displayUser} onUpdateProfile={actions.updateProfile} />
              </ProtectedRoute>
            }
          />
          <Route path="/problems" element={<Navigate to="/map" replace />} />
          <Route path="/problems/:id" element={<PublicRoute><ProblemDetailsPage /></PublicRoute>} />
          <Route
            path="/dashboard"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="/my-problems"
            element={
              <ProtectedRoute>
                <MyProblemsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]}>
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/transparency/:idOrSlug"
            element={<PublicRoute><TransparencyPage /></PublicRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DashboardLayout>
      {selectedReport && (
        <ProblemDetails
          report={selectedReport}
          user={displayUser}
          actions={actions}
          onClose={() => setSelectedId(null)}
          t={t}
          locale={locale}
          categories={categories}
          onRequireAuth={() => navigate("/login")}
        />
      )}
    </>
  );
}
