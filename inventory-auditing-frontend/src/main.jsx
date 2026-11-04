import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";
import App from "./App.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ConfirmProvider } from "./context/ConfirmContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <ConfirmProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ConfirmProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
