"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Toast, { ToastProps } from "@/components/ui/toast/Toast";

interface ToastContextType {
  showToast: (
    variant: "success" | "error" | "warning" | "info",
    title: string,
    message?: string,
    duration?: number
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
};

interface ToastData {
  id: string;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback(
    (
      variant: "success" | "error" | "warning" | "info",
      title: string,
      message?: string,
      duration: number = 3000
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastData = { id, variant, title, message, duration };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-0 right-0 z-[999999] flex flex-col gap-3 p-4 pointer-events-none sm:p-6">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
