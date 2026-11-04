import { createContext, useState, useRef, useCallback } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);
  const timers = useRef([]);

  const showToast = useCallback((message, type = "success") => {
    timers.current.forEach(clearTimeout);

    setToast({ message, type });
    setVisible(true);

    const t1 = setTimeout(() => setVisible(false), 3000);
    const t2 = setTimeout(() => setToast(null), 3300);
    timers.current = [t1, t2];
  }, []);

  function closeToast() {
    setVisible(false);
    setTimeout(() => setToast(null), 300);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className={
            visible
              ? `toast toast-${toast.type} show`
              : `toast toast-${toast.type}`
          }
        >
          {toast.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{toast.message}</span>
          <button className="toast-close" onClick={closeToast}>
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export default ToastContext;
