import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

// Components
import { Navbar } from "./components/Navbar.jsx";
import { Footer } from "./components/Footer.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";

// Pages
import { HomePage } from "./pages/HomePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.jsx";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.jsx";
import { GoogleSuccessPage } from "./pages/GoogleSuccessPage.jsx";

import { CitizenDashboardPage } from "./pages/CitizenDashboardPage.jsx";
import { MapPage } from "./pages/MapPage.jsx";
import { ProblemsListPage } from "./pages/ProblemsListPage.jsx";
import { CreateProblemPage } from "./pages/CreateProblemPage.jsx";
import { ProblemDetailsPage } from "./pages/ProblemDetailsPage.jsx";
import { MyProblemsPage } from "./pages/MyProblemsPage.jsx";
import { NotificationsPage } from "./pages/NotificationsPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";

import { StaffDashboardPage } from "./pages/StaffDashboardPage.jsx";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.jsx";
import { TransparencyPage } from "./pages/TransparencyPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/auth/google/success" element={<GoogleSuccessPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/problems" element={<ProblemsListPage />} />
                <Route path="/problems/:id" element={<ProblemDetailsPage />} />
                <Route path="/analytics/transparency/:idOrSlug" element={<TransparencyPage />} />

                {/* Citizen Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <CitizenDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/problems/create"
                  element={
                    <ProtectedRoute>
                      <CreateProblemPage />
                    </ProtectedRoute>
                  }
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
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Staff Protected Routes */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]}>
                      <StaffDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
