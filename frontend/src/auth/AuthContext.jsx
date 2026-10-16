import { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getToken, setToken, clearToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => api("/users/myAccount"),
    enabled: !!getToken(),
    staleTime: Infinity,
  });

  // an old or invalid token: forget it
  useEffect(() => {
    if (meQ.error?.status === 401) clearToken();
  }, [meQ.error]);

  async function login(email, password) {
    const res = await api("/users/login", {
      method: "POST",
      body: {
        email,
        password,
      },
    });
    setToken(res.token);
    queryClient.setQueryData(["me"], {
      data: {
        user: res.data.user,
      },
    });
    return res.data.user;
  }

  function logout() {
    clearToken();
    queryClient.setQueryData(["me"], null);
  }

  const value = {
    user: meQ.data?.data.user ?? null,
    isLoading: meQ.isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
