"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import AuthModal from "./AuthModal";

type Mode = "login" | "signup";

interface AuthModalContextValue {
  open: (mode?: Mode) => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used inside AuthModalProvider");
  return ctx;
}

export default function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");

  function open(m?: Mode) {
    setMode(m || "login");
    setIsOpen(true);
  }
  function close() {
    setIsOpen(false);
  }

  return (
    <AuthModalContext.Provider value={{ open, close }}>
      {children}
      {isOpen && <AuthModal mode={mode} onModeChange={setMode} onClose={close} />}
    </AuthModalContext.Provider>
  );
}
