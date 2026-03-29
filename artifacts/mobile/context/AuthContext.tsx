import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  userEmail: string;
  setUserEmail: (email: string) => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  userEmail: "",
  setUserEmail: () => {},
  isLoggedIn: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState("");

  return (
    <AuthContext.Provider
      value={{
        userEmail,
        setUserEmail,
        isLoggedIn: userEmail !== "",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
