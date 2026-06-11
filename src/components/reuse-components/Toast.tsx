import React, { useState, createContext, useContext } from "react";
import type {  ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Toast state type
interface ToastState {
  id: number;
  title: string;
  message: string;
  variant: "success" | "danger" | "warning" | "info";
}

type ToastContextType = (
  title: string,
  message: string,
  variant?: ToastState["variant"]
) => void;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast: ToastContextType = (
    title,
    message,
    variant = "success"
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, variant }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const bgColors: Record<ToastState["variant"], string> = {
    success: "#198754", 
    danger: "#dd3b4cff",  
    warning: "#ffc107", 
    info: "#0dcaf0",   
  };

  const textColor = (variant: ToastState["variant"]) =>
    variant === "warning" ? "#000" : "#fff";

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 2000 }}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="mb-2 shadow-lg rounded-3 p-3"
              style={{
                backgroundColor: bgColors[toast.variant],
                color: textColor(toast.variant),
                minWidth: "280px",
                maxWidth: "340px",
              }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="fw-bold mb-1">{toast.title}</h6>
                  <p className="mb-0" style={{ fontSize: "0.9rem" }}>
                    {toast.message}
                  </p>
                </div>
                <button
                  className={`btn-close ms-2 ${
                    toast.variant === "warning" ? "" : "btn-close-white"
                  }`}
                  onClick={() => removeToast(toast.id)}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
