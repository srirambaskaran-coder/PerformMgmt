import { createContext, useContext, useState, ReactNode } from "react";

interface SystemErrorContextType {
  hasSystemError: boolean;
  errorMessage: string;
  setSystemError: (error: boolean, message?: string) => void;
  clearSystemError: () => void;
}

const SystemErrorContext = createContext<SystemErrorContextType | undefined>(
  undefined
);

export function SystemErrorProvider({ children }: { children: ReactNode }) {
  const [hasSystemError, setHasSystemError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const setSystemError = (error: boolean, message = "") => {
    setHasSystemError(error);
    setErrorMessage(message);
  };

  const clearSystemError = () => {
    setHasSystemError(false);
    setErrorMessage("");
  };

  return (
    <SystemErrorContext.Provider
      value={{ hasSystemError, errorMessage, setSystemError, clearSystemError }}
    >
      {children}
    </SystemErrorContext.Provider>
  );
}

export function useSystemError() {
  const context = useContext(SystemErrorContext);
  if (!context) {
    throw new Error("useSystemError must be used within SystemErrorProvider");
  }
  return context;
}
