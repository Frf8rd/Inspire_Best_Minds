import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import UrbanPulseApp from "./design/UrbanPulseApp.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <UrbanPulseApp />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
